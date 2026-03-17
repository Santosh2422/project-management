import { createTaskTool } from "../tools/dummy.tools"

export function registerTools(server: any) {
  server.tool(
    createTaskTool.name,
    createTaskTool.description,
    createTaskTool.schema,
    createTaskTool.handler
  );
}