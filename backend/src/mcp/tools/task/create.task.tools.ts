import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createTaskService } from "../../../services/task.service";
import { checkProjectMembership } from "../../../services/project.service";
import { getAllWorkspacesUserIsMemberService } from "../../../services/workspace.service";
import { getUserProjectsInWorkspaceService } from "../../../services/project.service";
import { getProjectSectionsService } from "../../../services/section.service";
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

const createTaskSchema = z.object({
  workspaceId: z.string().optional(),
  workspaceName: z.string().optional(),

  projectId: z.string().optional(),
  projectName: z.string().optional(),

  sectionId: z.string().optional(),
  sectionName: z.string().optional(),

  title: z.string(),
  description: z.string().optional(),

  priority: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),

  assignees: z.array(z.string()).optional(),
  dueDate: z.string().optional(),

  parentId: z.string().optional(),
});

// --------------------
// Formatter (🔥 important)
// --------------------

const formatList = (items: any[], label: string) =>
  items
    .map((item, i) => `${i + 1}. ${item.name} (${label}: ${item._id})`)
    .join("\n");

// --------------------
// Tool
// --------------------

export function registerCreateTaskTool(server: McpServer) {
  server.registerTool(
    "create_task",
    {
      title: "Create Task",
      description: "Creates a task inside a project",
      inputSchema: createTaskSchema as any,
    },
    async (args: any) => {
      const parsed = createTaskSchema.parse(args);

      let {
        workspaceId,
        workspaceName,
        projectId,
        projectName,
        sectionId,
        sectionName,
        title,
        description,
        priority,
        status,
        type,
        assignees,
        dueDate,
        parentId,
      } = parsed;

      const userId = process.env.MY_ID;
      if (!userId) {
        return {
          content: [{ type: "text" as const, text: "User ID missing." }],
          isError: true,
        };
      }

      priority = normalizePriority(priority) ?? "MEDIUM";
      status = normalizeStatus(status) ?? "TODO";

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
                  `IMPORTANT: Do not skip any items.\n\n` +
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
                `Found ${workspaces.length} workspaces.\n\n` +
                `IMPORTANT: Do not skip any items.\n\n` +
                `Available workspaces:\n${list}\n\n` +
                `👉 Reply with exact workspaceId.`,
            },
          ],
        };
      }

      // -------------------------------
      // PROJECT
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
                  `Found ${projects.length} projects.\n\n` +
                  (matches.length === 0
                    ? `Project "${projectName}" not found.\n\n`
                    : `Multiple matching projects found.\n\n`) +
                  `IMPORTANT: Do not skip any items.\n\n` +
                  `Available projects:\n${list}\n\n` +
                  `👉 Reply with exact projectId.`,
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
                `Found ${projects.length} projects.\n\n` +
                `IMPORTANT: Do not skip any items.\n\n` +
                `Available projects:\n${list}\n\n` +
                `👉 Reply with exact projectId.`,
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
      // SECTION
      // -------------------------------
      if (!parentId) {
        const { sections } = await getProjectSectionsService(
          workspaceId,
          projectId
        );

        if (!sectionId && sectionName) {
          const matches = sections.filter((s: any) =>
            s.name.toLowerCase().includes(sectionName.toLowerCase())
          );

          if (matches.length === 1) {
            sectionId = (matches[0] as any)._id.toString();
          } else {
            const list = formatList(
              matches.length ? matches : sections,
              "id"
            );

            return {
              content: [
                {
                  type: "text" as const,
                  text:
                    `Found ${sections.length} sections.\n\n` +
                    (matches.length === 0
                      ? `Section "${sectionName}" not found.\n\n`
                      : `Multiple matching sections found.\n\n`) +
                    `IMPORTANT: Do not skip any items.\n\n` +
                    `Available sections:\n${list}\n\n` +
                    `👉 Reply with exact sectionId.`,
                },
              ],
            };
          }
        }

        if (!sectionId) {
          const list = formatList(sections, "id");

          return {
            content: [
              {
                type: "text" as const,
                text:
                  `Found ${sections.length} sections.\n\n` +
                  `IMPORTANT: Do not skip any items.\n\n` +
                  `Available sections:\n${list}\n\n` +
                  `👉 Reply with exact sectionId.`,
              },
            ],
          };
        }
      }
     

      // ❌ Missing
      if (!dueDate) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Due date is required.`,
            },
          ],
        };
      }

      // ❌ Invalid
      const parsedDueDate = parseDueDate(dueDate.toString());
      if (!parsedDueDate) {
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
     // -------------------------------
      // CREATE TASK
      // -------------------------------
      const { task } = await createTaskService(
        workspaceId,
        projectId,
        userId,
        {
          title,
          description,
          priority,
          status,
          type,
          assignees,
          dueDate: parsedDueDate.toISOString(),
          parentId,
          sectionId,
        }
      );

      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Task "${task.title}" created!\nID: ${task._id}`,
          },
        ],
      };
    }
  );
}