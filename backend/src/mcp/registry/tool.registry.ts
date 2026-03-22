import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCreateWorkspaceTool } from "../tools/workspace/create.workspace.tools";
import { registerCreateProjectTool } from "../tools/project/create.project.tools";
import { registerCreateTaskTool } from "../tools/task/create.task.tools";
import {getProjectsInWorkspaceTool} from "../tools/project/get.project.tools"
import { getTasksWithFiltersTool } from "../tools/task/get.task.tools"
import {getProjectSectionsTool} from "../tools/section/get.section.tools"
import { createSectionTool } from "../tools/section/create.section.tools";
import { updateSectionTool } from "../tools/section/update.section.tools";


export function registerTools(server: McpServer) {
  //workspace
  registerCreateWorkspaceTool(server);

  //project
  registerCreateProjectTool(server);
  getProjectsInWorkspaceTool(server);

  //section
  createSectionTool(server)
  getProjectSectionsTool(server);
  updateSectionTool(server)
  

  //task
  registerCreateTaskTool(server);
  getTasksWithFiltersTool(server);
  
}