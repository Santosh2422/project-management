import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { updateWorkspaceByIdService } from "../../../services/workspace.service";
import { getAllWorkspacesUserIsMemberService } from "../../../services/workspace.service";

// --------------------
// Schema
// --------------------

const updateWorkspaceSchema = z.object({
  workspaceId: z.string().optional(),
  workspaceName: z.string().optional(),

  name: z.string().optional(),
  description: z.string().optional(),
});

type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

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

export function registerUpdateWorkspaceTool(server: McpServer, userId: string) {
  server.registerTool(
    "update_workspace",
    {
      title: "Update Workspace",
      description: "Updates workspace name or description",
      inputSchema: updateWorkspaceSchema as any,
      annotations: {
        readOnlyHint: false,
      }
    },
    async (args: UpdateWorkspaceInput) => {
      const {
        workspaceId: providedWorkspaceId,
        workspaceName,
        name,
        description,
      } = updateWorkspaceSchema.parse(args);

      let workspaceId = providedWorkspaceId;

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
      // VALIDATION
      // -------------------------------
      if (!name && !description) {
        return {
          content: [
            {
              type: "text" as const,
              text:
                `👉 Please provide at least one field to update:\n` +
                `• name\n• description`,
            },
          ],
        };
      }

      // -------------------------------
      // UPDATE WORKSPACE
      // -------------------------------
      const { workspace } = await updateWorkspaceByIdService(
        workspaceId,
        name || "",
        description
      );

      // -------------------------------
      // SUCCESS RESPONSE
      // -------------------------------
      return {
        content: [
          {
            type: "text" as const,
            text:
              `✅ Workspace updated successfully.\n\n` +
              `Name: ${workspace.name}\n` +
              `Description: ${workspace.description || "None"}`,
          },
        ],
      };
    }
  );
}