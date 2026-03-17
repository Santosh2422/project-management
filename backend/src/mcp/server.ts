import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./registry/tool.registry";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "project-management-mcp",
    version: "1.0.0",
  });

  registerTools(server);
  return server;
}