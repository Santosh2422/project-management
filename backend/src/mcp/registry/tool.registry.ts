import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCreateWorkspaceTool } from "../tools/workspace/create.workspace.tools";
import { registerCreateProjectTool } from "../tools/project/create.project.tools";
import { registerCreateTaskTool } from "../tools/task/create.task.tools";
import {getProjectsInWorkspaceTool} from "../tools/project/get.project.tools"
export function registerTools(server: McpServer) {
  registerCreateWorkspaceTool(server);
  registerCreateProjectTool(server);
  registerCreateTaskTool(server);
  getProjectsInWorkspaceTool(server);
}