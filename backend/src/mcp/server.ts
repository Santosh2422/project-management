import { createServerInstance } from "./instance";
import { registerTools } from "./registry/tool.registry";

export function createMcpServer(userId: string) {
  const server = createServerInstance(); // fresh instance per session
  registerTools(server, userId);                 // register onto this instance only
  return server;
}