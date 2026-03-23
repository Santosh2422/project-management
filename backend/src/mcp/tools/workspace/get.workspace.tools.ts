import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAllWorkspacesUserIsMemberService } from "../../../services/workspace.service";

// --------------------
// Schema (no input needed)
// --------------------

const getWorkspacesSchema = z.object({});

// --------------------
// Formatter
// --------------------

const formatList = (items: any[]) =>
  items
    .map(
      (item, i) =>
        `${i + 1}. ${item.name} (id: ${item._id})${
          item.description ? `\n   → ${item.description}` : ""
        }`
    )
    .join("\n");

// --------------------
// Tool
// --------------------

export function registerGetWorkspacesTool(server: McpServer, userId: string) {
  server.registerTool(
    "retrieve_workspaces",
    {
      title: "Retrieve Workspaces",
      description: "Retrieves all workspaces where the user is a member",
      inputSchema: getWorkspacesSchema as any,
      annotations: {
        readOnlyHint: true,
      },
    },
    async () => {
      // userId provided by parameter

      if (!userId) {
        return {
          content: [
            {
              type: "text" as const,
              text: "User ID not found.",
            },
          ],
          isError: true,
        };
      }

      // -------------------------------
      // FETCH WORKSPACES
      // -------------------------------
      const { workspaces } =
        await getAllWorkspacesUserIsMemberService(userId);

      // -------------------------------
      // NO WORKSPACES
      // -------------------------------
      if (!workspaces || workspaces.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text:
                `No workspaces found.\n\n` +
                `👉 You are not a member of any workspace yet.`,
            },
          ],
        };
      }

      // -------------------------------
      // SUCCESS RESPONSE
      // -------------------------------
      const list = formatList(workspaces);

      return {
        content: [
          {
            type: "text" as const,
            text:
              `Found ${workspaces.length} workspaces.\n\n` +
              `IMPORTANT: Do not skip any items.\n\n` +
              `Workspaces:\n${list}\n\n` +
              `👉 Use workspaceId for further actions.`,
          },
        ],
      };
    }
  );
}