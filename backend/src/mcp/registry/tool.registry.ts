import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCreateWorkspaceTool } from "../tools/workspace/create.workspace.tools";
import { registerCreateProjectTool } from "../tools/project/create.project.tools";

export function registerTools(server: McpServer) {
  registerCreateWorkspaceTool(server);
  registerCreateProjectTool(server);
}