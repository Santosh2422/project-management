import express, { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "../server";

const transports: Record<string, StreamableHTTPServerTransport> = {};
const sessionLastSeen: Record<string, number> = {}; // ← track last activity per session

const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes of inactivity = stale

// ─── Periodic stale session cleanup ───────────────────────────────────────────
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [sid, transport] of Object.entries(transports)) {
    const lastSeen = sessionLastSeen[sid] ?? 0;
    const isStale = now - lastSeen > SESSION_TIMEOUT_MS;
    const isOrphaned = transport.sessionId === undefined;

    if (isStale || isOrphaned) {
      console.log(`Cleaning up stale session: ${sid} (reason: ${isOrphaned ? "orphaned" : "timeout"})`);
      transport.close(); // gracefully close transport
      delete transports[sid];
      delete sessionLastSeen[sid];
    }
  }
}, 60_000); // runs every 60 seconds

// Prevent interval from keeping process alive after server shuts down
cleanupInterval.unref();

export function setupMcpTransport(app: express.Application) {

  // POST — initialize session or handle tool calls
  app.post("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    try {
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports[sessionId]) {
        // Existing session — reuse transport
        transport = transports[sessionId];
        sessionLastSeen[sessionId] = Date.now(); // ← update activity timestamp

      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New session — create fresh transport + server
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newSessionId) => {
            transports[newSessionId] = transport;
            sessionLastSeen[newSessionId] = Date.now(); // ← record session start
            console.log(`Session initialized: ${newSessionId}`);
          }
        });

        // Cleanup when transport closes
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            delete transports[sid];
            delete sessionLastSeen[sid]; // ← clean up timestamp too
            console.log(`Session closed: ${sid}`);
          }
        };

        // Each connection gets its own MCP server instance
        const mcpServer = createMcpServer();
        await mcpServer.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;

      } else {
        res.status(400).json({
          jsonrpc: "2.0",
          error: { code: -32000, message: "Bad Request: No valid session ID provided" },
          id: null
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);

    } catch (error) {
      console.error("Error handling MCP POST request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null
        });
      }
    }
  });

  // GET — open SSE stream for server-to-client updates
  app.get("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (!sessionId || !transports[sessionId]) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }

    console.log(`SSE stream opened for session: ${sessionId}`);
    sessionLastSeen[sessionId] = Date.now(); // ← update activity timestamp
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  });

  // DELETE — terminate session
  app.delete("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (!sessionId || !transports[sessionId]) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }

    console.log(`Session termination requested: ${sessionId}`);
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
  });
}