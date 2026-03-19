import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function createServerInstance() {
  return new McpServer(
    { name: "project-management-mcp", version: "1.0.0" },
    { capabilities: {} }
  );
}