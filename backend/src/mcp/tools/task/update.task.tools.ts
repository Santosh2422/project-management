import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { updateTaskService } from "../../../services/task.service";
import { checkProjectMembership } from "../../../services/project.service";
import { getAllWorkspacesUserIsMemberService } from "../../../services/workspace.service";
import { getUserProjectsInWorkspaceService } from "../../../services/project.service";
import { getAllTasksService } from "../../../services/task.service";
import { parseDueDate } from "../../utils/dateHandler.utils";

// --------------------
// Helpers
// --------------------

const normalizePriority = (value?: string) => {
  if (!value) return undefined;
  const map: Record<string, string> = {
    low: "LOW",
    medium: "MEDIUM",
    high: "HIGH",
    urgent: "HIGH",
  };
  return map[value.toLowerCase()];
};

const normalizeStatus = (value?: string) => {
  if (!value) return undefined;
  const map: Record<string, string> = {
    todo: "TODO",
    in_progress: "IN_PROGRESS",
    done: "DONE",
    blocked: "BLOCKED",
  };
  return map[value.toLowerCase()];
};

// --------------------
// Schema
// --------------------

const updateTaskSchema = z.object({
  workspaceId: z.string().optional(),
  workspaceName: z.string().optional(),

  projectId: z.string().optional(),
  projectName: z.string().optional(),

  taskId: z.string().optional(),
  taskName: z.string().optional(),

  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
});

// --------------------
// Formatter
// --------------------

const formatList = (items: any[], label: string) =>
  items
    .map((item, i) => `${i + 1}. ${item.title || item.name} (${label}: ${item._id})`)
    .join("\n");

// --------------------
// Tool
// --------------------

export function registerUpdateTaskTool(server: McpServer, userId: string) {
  server.registerTool(
    "update_task",
    {
      title: "Update Task",
      description: "Updates an existing task",
      inputSchema: updateTaskSchema as any,
      annotations: {
        readOnlyHint: false,
      },
    },
    async (args: any) => {
      const parsed = updateTaskSchema.parse(args);

      let {
        workspaceId,
        workspaceName,
        projectId,
        projectName,
        taskId,
        taskName,
        title,
        description,
        priority,
        status,
        type,
        assignees,
        dueDate,
      } = parsed;

      // userId provided by parameter
      if (!userId) {
        return {
          content: [{ type: "text" as const, text: "User ID missing." }],
          isError: true,
        };
      }

      priority = normalizePriority(priority);
      status = normalizeStatus(status);

      // -------------------------------
      // WORKSPACE RESOLUTION
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
                  `Available workspaces:\n${list}\n\n` +
                  `👉 Reply with workspaceId.`,
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
      // PROJECT RESOLUTION
      // -------------------------------
      const { projects } = await getUserProjectsInWorkspaceService(
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
      // MEMBERSHIP CHECK
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
      // TASK RESOLUTION (🔥 KEY PART)
      // -------------------------------
      if (!taskId && taskName) {
        const { tasks } = await getAllTasksService(
          workspaceId,
          userId,
          {
            projectId,
            keyword: taskName,
          },
          {
            pageSize: 20,
            pageNumber: 1,
          }
        );

        const matches = tasks.filter((t: any) =>
          t.title.toLowerCase().includes(taskName.toLowerCase())
        );

        if (matches.length === 1) {
          taskId = (matches[0] as any)._id.toString();
        } else {
          const list = matches
            .map((t: any, i: number) => `${i + 1}. ${t.title} (id: ${t._id})`)
            .join("\n");

          return {
            content: [
              {
                type: "text" as const,
                text:
                  `Found ${matches.length} matching tasks.\n\n` +
                  (matches.length === 0
                    ? `No task found with name "${taskName}".\n\n`
                    : `Multiple matching tasks found.\n\n`) +
                  `Tasks:\n${list}\n\n` +
                  `👉 Reply with taskId.`,
              },
            ],
          };
        }
      }

      if (!taskId) {
        return {
          content: [
            {
              type: "text" as const,
              text: `👉 Please provide taskId or taskName.`,
            },
          ],
        };
      }

      // -------------------------------
      // DUE DATE PARSE
      // -------------------------------
      let parsedDueDate: string | undefined;

      if (dueDate) {
        const parsed = parseDueDate(dueDate.toString());
        if (!parsed) {
          return {
            content: [
              {
                type: "text" as const,
                text:
                  `Invalid due date format.\n\n` +
                  `Try:\n• 2026-03-25\n• tomorrow\n• next monday`,
              },
            ],
          };
        }
        parsedDueDate = parsed.toISOString();
      }

      // -------------------------------
      // UPDATE TASK
      // -------------------------------
      const { task } = await updateTaskService(
        workspaceId,
        projectId,
        taskId,
        userId,
        {
          title,
          description,
          priority,
          status,
          type,
          assignees,
          dueDate: parsedDueDate,
        }
      );

      // -------------------------------
      // SUCCESS RESPONSE
      // -------------------------------
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Task updated successfully.\nTitle: ${task.title}`,
          },
        ],
      };
    }
  );
}