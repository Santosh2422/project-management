import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { updateProjectByIdAndWorkspaceIdService } from "../../../services/project.service";
import { getAllWorkspacesUserIsMemberService } from "../../../services/workspace.service";
import { getUserProjectsInWorkspaceService } from "../../../services/project.service";

// --------------------
// Schema
// --------------------

const updateProjectSchema = z.object({
  workspaceId: z.string().optional(),
  workspaceName: z.string().optional(),

  projectId: z.string().optional(),
  projectName: z.string().optional(),

  name: z.string().optional(),
  emoji: z.string().optional(),
  description: z.string().optional(),
});

type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// --------------------
// Formatter
// --------------------

const formatList = (items: any[], label: string) =>
  items
    .map((item, i) => `${i + 1}. ${item.name} (${label}: ${item._id})`)
    .join("\n");

// --------------------
// Tool
// --------------------

export function registerUpdateProjectTool(server: McpServer, userId: string) {
  server.registerTool(
    "update_project",
    {
      title: "Update Project",
      description: "Updates project name, emoji, or description",
      inputSchema: updateProjectSchema as any,
      annotations: {
        readOnlyHint: false,
      },
    },
    async (args: UpdateProjectInput) => {
      const {
        workspaceId: providedWorkspaceId,
        workspaceName,
        projectId: providedProjectId,
        projectName,
        name,
        emoji,
        description,
      } = updateProjectSchema.parse(args);

      let workspaceId = providedWorkspaceId;
      let projectId = providedProjectId;

      // userId provided by parameter
      if (!userId) {
        return {
          content: [{ type: "text" as const, text: "User ID not found." }],
          isError: true,
        };
      }

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
                  `Found ${workspaces.length} workspaces.\n\n` +
                  (matches.length === 0
                    ? `Workspace "${workspaceName}" not found.\n\n`
                    : `Multiple matching workspaces found.\n\n`) +
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
      // VALIDATION (at least one field)
      // -------------------------------
      if (!name && !emoji && !description) {
        return {
          content: [
            {
              type: "text" as const,
              text:
                `👉 Please provide at least one field to update:\n` +
                `• name\n• emoji\n• description`,
            },
          ],
        };
      }

      // -------------------------------
      // UPDATE PROJECT
      // -------------------------------
      const { project } =
        await updateProjectByIdAndWorkspaceIdService(
          workspaceId,
          projectId,
          {
            name: name || projectName || "",
            emoji,
            description,
          }
        );

      // -------------------------------
      // SUCCESS RESPONSE
      // -------------------------------
      return {
        content: [
          {
            type: "text" as const,
            text:
              `✅ Project updated successfully.\n\n` +
              `Name: ${project.name}\n` +
              `Emoji: ${project.emoji || "None"}\n` +
              `Description: ${project.description || "None"}`,
          },
        ],
      };
    }
  );
}