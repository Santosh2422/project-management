import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAllTasksService } from "../../../services/task.service";
import { getAllWorkspacesUserIsMemberService } from "../../../services/workspace.service";
import {
  checkProjectMembership,
  getUserProjectsInWorkspaceService,
} from "../../../services/project.service";

// --------------------
// Schema
// --------------------

const getTasksSchema = z.object({
  workspaceName: z.string().optional(),
  workspaceId: z.string().optional(),

  projectName: z.string().optional(),
  projectId: z.string().optional(),

  status: z.array(z.string()).optional(),
  priority: z.array(z.string()).optional(),
  keyword: z.string().optional(),
  dueDate: z.string().optional(),

  pageSize: z.number().optional(),
  pageNumber: z.number().optional(),
});

type GetTaskInput = z.infer<typeof getTasksSchema>;

// --------------------
// Helpers
// --------------------

const formatList = (items: any[], label: string) =>
  items
    .map((item, i) => `${i + 1}. ${item.name} (${label}: ${item._id})`)
    .join("\n");

// 🔥 Normalize Priority
const normalizePriority = (values?: string[]) => {
  if (!values) return undefined;

  const map: Record<string, string> = {
    low: "LOW",
    medium: "MEDIUM",
    high: "HIGH",
    urgent: "HIGH",
  };

  return values
    .map((v) => map[v.toLowerCase()])
    .filter(Boolean);
};

// 🔥 Normalize Status
const normalizeStatus = (values?: string[]) => {
  if (!values) return undefined;

  const map: Record<string, string> = {
    backlog: "BACKLOG",
    todo: "TODO",
    "in progress": "IN_PROGRESS",
    in_progress: "IN_PROGRESS",
    review: "IN_REVIEW",
    done: "DONE",
  };

  return values
    .map((v) => map[v.toLowerCase()])
    .filter(Boolean);
};

// --------------------
// Tool
// --------------------

export function registerGetTasksWithFiltersTool(server: McpServer, userId: string) {
  server.registerTool(
    "retrieve_tasks",
    {
      title: "Retrieve Tasks",
      description:
        "Retrieve tasks inside a workspace or project with filters",
      inputSchema: getTasksSchema as any,
      annotations: {
        readOnlyHint: true,
      },
    },
    async (args: GetTaskInput) => {
      const parsed = getTasksSchema.parse(args);

      let {
        workspaceId,
        workspaceName,
        projectId,
        projectName,
        status,
        priority,
        keyword,
        dueDate,
        pageSize = 10,
        pageNumber = 1,
      } = parsed;

      // userId provided by parameter
      if (!userId) {
        return {
          content: [{ type: "text" as const, text: "User ID missing." }],
          isError: true,
        };
      }

      // -------------------------------
      // WORKSPACE
      // -------------------------------
      const { workspaces } =
        await getAllWorkspacesUserIsMemberService(userId);

      if (!workspaceId && workspaceName) {
        const matches = workspaces.filter((w: any) =>
          w.name.toLowerCase().includes(workspaceName.toLowerCase())
        );

        if (matches.length === 1) {
          workspaceId = matches[0]._id.toString();
        } else {
          const list = formatList(
            matches.length ? matches : workspaces,
            "id"
          );

          return {
            content: [
              {
                type: "text" as const,
                text:
                  `Found ${workspaces.length} workspaces.\n\n` +
                  (matches.length === 0
                    ? `Workspace "${workspaceName}" not found.\n\n`
                    : `Multiple matching workspaces found.\n\n`) +
                  `Available workspaces:\n${list}\n\n` +
                  `👉 Reply with exact workspaceId.`,
              },
            ],
          };
        }
      }

      if (!workspaceId) {
        const list = formatList(workspaces, "id");

        return {
          content: [
            {
              type: "text" as const,
              text:
                `Available workspaces:\n${list}\n\n` +
                `👉 Reply with workspaceId.`,
            },
          ],
        };
      }

      // -------------------------------
      // PROJECT
      // -------------------------------
      const { projects } =
        await getUserProjectsInWorkspaceService(
          userId,
          workspaceId,
          50,
          1
        );

      if (!projectId && projectName) {
        const matches = projects.filter((p: any) =>
          p.name.toLowerCase().includes(projectName.toLowerCase())
        );

        if (matches.length === 1) {
          projectId = (matches[0] as any)._id.toString();
        } else {
          const list = formatList(
            matches.length ? matches : projects,
            "id"
          );

          return {
            content: [
              {
                type: "text" as const,
                text:
                  `Found ${projects.length} projects.\n\n` +
                  (matches.length === 0
                    ? `Project "${projectName}" not found.\n\n`
                    : `Multiple matching projects found.\n\n`) +
                  `Available projects:\n${list}\n\n` +
                  `👉 Reply with projectId.`,
              },
            ],
          };
        }
      }

      if (!projectId) {
        const list = formatList(projects, "id");

        return {
          content: [
            {
              type: "text" as const,
              text:
                `Available projects:\n${list}\n\n` +
                `👉 Reply with projectId.`,
            },
          ],
        };
      }

      // -------------------------------
      // MEMBERSHIP
      // -------------------------------
      const isMember = await checkProjectMembership(userId, projectId);

      if (!isMember) {
        return {
          content: [
            {
              type: "text" as const,
              text: "❌ You are not a member of this project.",
            },
          ],
          isError: true,
        };
      }

      // -------------------------------
      // NORMALIZE FILTERS 🔥
      // -------------------------------
      priority = normalizePriority(priority);
      status = normalizeStatus(status);

      // -------------------------------
      // FETCH TASKS
      // -------------------------------
      const { tasks, paginaion } = await getAllTasksService(
        workspaceId,
        userId,
        {
          projectId,
          status,
          priority,
          keyword,
          dueDate,
        },
        {
          pageSize,
          pageNumber,
        }
      );

      if (!tasks || tasks.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No tasks found.",
            },
          ],
        };
      }

      // -------------------------------
      // DISPLAY (clean, no IDs)
      // -------------------------------
      const limited = tasks.slice(0, 10);

      const list = limited
        .map((t: any, i: number) => {
          let line = `${i + 1}. ${t.title}`;

          if (t.status) line += ` • ${t.status}`;
          if (t.priority) line += ` • ${t.priority}`;

          return line;
        })
        .join("\n");

      return {
        content: [
          {
            type: "text" as const,
            text:
              `Found ${paginaion.totalCount} tasks.\n\n` +
              `Showing ${limited.length} tasks:\n\n${list}`,
          },
        ],
      };
    }
  );
}