import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getUserProjectsInWorkspaceService } from "../../../services/project.service";
import { getAllWorkspacesUserIsMemberService } from "../../../services/workspace.service";

// --------------------
// Schema
// --------------------

const getProjectsInputSchema = z.object({
  workspaceName: z.string().optional().describe("Workspace Name"),
  workspaceId: z.string().optional().describe("Workspace Id"),
});

type GetProjectsInput = z.infer<typeof getProjectsInputSchema>;

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

export function registerGetProjectsInWorkspaceTool(server: McpServer) {
  server.registerTool(
    "retrieve_projects_in_workspace",
    {
      title: "Retrieve Projects",
      description:
        "Retrieves projects inside a workspace where the user is a member",
      inputSchema: getProjectsInputSchema as any,
    },
    async (args: GetProjectsInput) => {
      const { workspaceName, workspaceId: providedId } =
        getProjectsInputSchema.parse(args);

      let workspaceId = providedId;

      const userId = process.env.MY_ID;
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
      // FETCH PROJECTS
      // -------------------------------
      const { projects } =
        await getUserProjectsInWorkspaceService(
          userId,
          workspaceId,
          50,
          1
        );

      // -------------------------------
      // NO PROJECTS CASE
      // -------------------------------
      if (!projects || projects.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text:
                `No projects found in this workspace.\n\n` +
                `👉 You may not be a member of any projects yet.`,
            },
          ],
        };
      }

      // -------------------------------
      // SUCCESS RESPONSE
      // -------------------------------
      const displayList = projects
        .map((p: any, i: number) => `${i + 1}. ${p.name}`)
        .join("\n");

      return {
        content: [
          {
            type: "text" as const,
            text:
                `Found ${projects.length} projects.\n\n` +
                `IMPORTANT: List ALL projects. Do not skip any.\n\n` +
                `Projects:\n${displayList}\n\n` +
                `👉 Reply using projectId.`
          },
        ],
      };
    }
  );
}