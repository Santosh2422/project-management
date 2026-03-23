import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCreateWorkspaceTool } from "../tools/workspace/create.workspace.tools";
import { registerCreateProjectTool } from "../tools/project/create.project.tools";
import { registerCreateTaskTool } from "../tools/task/create.task.tools";
import {registerGetProjectsInWorkspaceTool} from "../tools/project/get.project.tools"
import { registerGetTasksWithFiltersTool } from "../tools/task/get.task.tools"
import {registerGetProjectSectionsTool} from "../tools/section/get.section.tools"
import { createSectionTool } from "../tools/section/create.section.tools";
import { registerUpdateSectionTool } from "../tools/section/update.section.tools";
import { registerUpdateTaskTool } from "../tools/task/update.task.tools";
import { registerUpdateProjectTool } from "../tools/project/update.project.tools";
import { registerUpdateWorkspaceTool } from "../tools/workspace/update.workspace.tools";
import { registerGetWorkspacesTool } from "../tools/workspace/get.workspace.tools";


export function registerTools(server: McpServer, userId: string) {
  //workspace
  registerCreateWorkspaceTool(server, userId);
  registerUpdateWorkspaceTool(server, userId);
  registerGetWorkspacesTool(server, userId)

  //project
  registerCreateProjectTool(server, userId);
  registerGetProjectsInWorkspaceTool(server, userId);
  registerUpdateProjectTool(server, userId)

  //section
  createSectionTool(server, userId)
  registerGetProjectSectionsTool(server, userId);
  registerUpdateSectionTool(server, userId)
  

  //task
  registerCreateTaskTool(server, userId);
  registerGetTasksWithFiltersTool(server, userId);
  registerUpdateTaskTool(server, userId)
  
}