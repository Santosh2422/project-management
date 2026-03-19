import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createProjectService } from "../../../services/project.service";
import { getAllWorkspacesUserIsMemberService } from "../../../services/workspace.service";

// ✅ Zod schema
const projectInputSchema = z.object({
  projectName: z.string(),
  projectDescription: z.string().optional(),
  workspaceId: z.string().optional(),
});

// ✅ Infer type
type ProjectInput = z.infer<typeof projectInputSchema>;

export function registerCreateProjectTool(server: McpServer) {
  server.registerTool(
    "create_project",
    {
      title: "Create Project",
      description: "Creates a new project inside a workspace",
      inputSchema: projectInputSchema as any,
    },
    async (args: ProjectInput) => {
      const { projectName, projectDescription, workspaceId: providedId } =
        projectInputSchema.parse(args);

      let workspaceId = providedId;

      const userId = process.env.MY_ID;
      if (!userId) {
        return {
          content: [
            {
              type: "text" as const,
              text: "User ID is missing in environment.",
            },
          ],
        };
      }

      // ✅ Handle missing workspace WITHOUT elicitInput
      if (!workspaceId) {
        const { workspaces } =
          await getAllWorkspacesUserIsMemberService(userId);

        if (!workspaces || workspaces.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No workspaces found. Please create a workspace first.",
              },
            ],
          };
        }

        const workspaceList = workspaces
          .map((ws: any) => `• ${ws.name} (id: ${ws._id})`)
          .join("\n");

        return {
          content: [
            {
              type: "text" as const,
              text:
                `Please provide a workspaceId to create the project "${projectName}".\n\n` +
                `Available workspaces:\n${workspaceList}\n\n` +
                `👉 Example: "Create project ${projectName} in workspaceId <id>"`,
            },
          ],
        };
      }

      // ✅ Create project
      const { project } = await createProjectService(
        userId,
        workspaceId,
        {
          name: projectName,
          description: projectDescription,
        }
      );

      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Project "${project.name}" created successfully!\nID: ${project._id}`,
          },
        ],
      };
    }
  );
}