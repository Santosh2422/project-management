import { createServerInstance } from "./instance";
import { registerTools } from "./registry/tool.registry";

export function createMcpServer() {
  const server = createServerInstance(); // fresh instance per session
  registerTools(server);                 // register onto this instance only
  return server;
}