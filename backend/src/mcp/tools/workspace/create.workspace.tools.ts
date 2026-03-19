import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createWorkSpaceService } from "../../../services/workspace.service";

// ✅ Zod schema
const createWorkspaceSchema = z.object({
  workspaceName: z.string().describe("Name of the workspace"),
  workspaceDescription: z.string().optional().describe("Optional description"),
});

// ✅ Infer type from schema
type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export function registerCreateWorkspaceTool(server: McpServer) {
  server.registerTool(
    "create_workspace",
    {
      title: "Create Workspace",
      description: "Creates a new workspace",
      inputSchema: createWorkspaceSchema as any, // ✅ break TS deep inference
    },
    async (args: CreateWorkspaceInput) => {
      // ✅ Runtime validation (IMPORTANT)
      const { workspaceName, workspaceDescription } =
        createWorkspaceSchema.parse(args);

      const userId = process.env.MY_ID;
      if (!userId) {
        throw new Error("User ID not found");
      }

      const res = await createWorkSpaceService(userId, {
        name: workspaceName,
        description: workspaceDescription,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Workspace "${res.workspace.name}" created successfully!`,
          },
        ],
      };
    }
  );
}