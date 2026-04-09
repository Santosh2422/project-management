# MCP Server Documentation

## Overview

This MCP (Model Context Protocol) server enables AI assistants (like Claude) to interact with the project management application programmatically. It provides a set of tools for creating, reading, and updating workspaces, projects, sections, and tasks.

## Architecture

```
backend/src/mcp/
|-- index.ts                 # Main exports
|-- server.ts                # Creates MCP server instance per user session
|-- instance.ts              # McpServer instance configuration
|-- registry/
|   |-- tool.registry.ts     # Central registry that registers all tools
|-- transport/
|   |-- see.transport.ts     # Streamable HTTP transport with session management
|-- oauth/
|   |-- mcp.oauth.router.ts  # OAuth 2.0 implementation for authentication
|-- utils/
|   |-- dateHandler.utils.ts # Natural language date parsing (chrono-node)
|-- tools/                   # Individual tool implementations
    |-- workspace/           # Workspace tools (create, get, update)
    |-- project/             # Project tools (create, get, update)
    |-- section/             # Section tools (create, get, update)
    |-- task/                # Task tools (create, get, update)
```

### Key Components

1. **McpServer Instance** (`instance.ts`): Creates a new MCP server with name `project-management-mcp` version `1.0.0`

2. **Tool Registry** (`tool.registry.ts`): Registers all available tools to the MCP server instance

3. **Transport** (`see.transport.ts`): Handles HTTP transport with:
   - Session management (5-minute inactivity timeout)
   - POST `/mcp` for tool calls
   - GET `/mcp` for SSE streams
   - DELETE `/mcp` for session termination
   - JWT authentication middleware

4. **OAuth Flow** (`mcp.oauth.router.ts`): Implements OAuth 2.0 with PKCE for secure authentication

## Available Tools

### Workspace Tools

| Tool | Description | Read-Only |
|------|-------------|-----------|
| `create_workspace` | Creates a new workspace | No |
| `retrieve_workspaces` | Gets all workspaces user is member of | Yes |
| `update_workspace` | Updates workspace name/description | No |

**Input Schema - create_workspace:**
```typescript
{
  workspaceName: string;          // Required - Name of the workspace
  workspaceDescription?: string;  // Optional - Description
}
```

**Input Schema - retrieve_workspaces:**
```typescript
{}  // No input required
```

**Input Schema - update_workspace:**
```typescript
{
  workspaceId?: string;           // Optional - Specific workspace ID
  workspaceName?: string;         // Optional - Search by name
  name?: string;                  // Optional - New name
  description?: string;           // Optional - New description
}
```

---

### Project Tools

| Tool | Description | Read-Only |
|------|-------------|-----------|
| `create_project` | Creates a project in a workspace | No |
| `retrieve_projects_in_workspace` | Gets all projects in a workspace | Yes |
| `update_project` | Updates project name/emoji/description | No |

**Input Schema - create_project:**
```typescript
{
  projectName: string;            // Required - Project name
  projectDescription?: string;    // Optional - Description
  workspaceId?: string;           // Optional - Target workspace ID
}
```

**Input Schema - retrieve_projects_in_workspace:**
```typescript
{
  workspaceName?: string;         // Optional - Search by workspace name
  workspaceId?: string;           // Optional - Specific workspace ID
}
```

**Input Schema - update_project:**
```typescript
{
  workspaceId?: string;           // Optional - Workspace ID
  workspaceName?: string;         // Optional - Search by workspace name
  projectId?: string;             // Optional - Specific project ID
  projectName?: string;           // Optional - Search by project name
  name?: string;                  // Optional - New project name
  emoji?: string;                 // Optional - New emoji
  description?: string;           // Optional - New description
}
```

---

### Section Tools

| Tool | Description | Read-Only |
|------|-------------|-----------|
| `create_section` | Creates a section in a project | No |
| `retrieve_project_sections` | Gets all sections in a project | Yes |
| `update_section` | Updates section name | No |

**Input Schema - create_section:**
```typescript
{
  workspaceName?: string;         // Optional - Workspace name
  workspaceId?: string;           // Optional - Workspace ID
  projectName?: string;           // Optional - Project name
  projectId?: string;             // Optional - Project ID
  name?: string;                  // Required - Section name
}
```

**Input Schema - retrieve_project_sections:**
```typescript
{
  workspaceName?: string;         // Optional - Workspace name
  workspaceId?: string;           // Optional - Workspace ID
  projectName?: string;           // Optional - Project name
  projectId?: string;             // Optional - Project ID
}
```

**Input Schema - update_section:**
```typescript
{
  workspaceName?: string;         // Optional - Workspace name
  workspaceId?: string;           // Optional - Workspace ID
  projectName?: string;           // Optional - Project name
  projectId?: string;             // Optional - Project ID
  sectionName?: string;           // Optional - Search by section name
  sectionId?: string;             // Optional - Specific section ID
  newName?: string;               // Required - New section name
}
```

---

### Task Tools

| Tool | Description | Read-Only |
|------|-------------|-----------|
| `create_task` | Creates a task in a project | No |
| `retrieve_tasks` | Gets tasks with filters | Yes |
| `update_task` | Updates task details | No |

**Input Schema - create_task:**
```typescript
{
  workspaceId?: string;           // Optional - Workspace ID
  workspaceName?: string;         // Optional - Workspace name
  projectId?: string;             // Optional - Project ID
  projectName?: string;           // Optional - Project name
  sectionId?: string;             // Optional - Section ID
  sectionName?: string;           // Optional - Section name
  title: string;                  // Required - Task title
  description?: string;           // Optional - Description
  priority?: string;              // Optional - LOW, MEDIUM, HIGH (or "urgent")
  status?: string;                // Optional - TODO, IN_PROGRESS, DONE, BLOCKED
  type?: string;                  // Optional - Task type
  assignees?: string[];           // Optional - Assignee IDs
  dueDate: string;                // Required - Due date (natural language supported!)
  parentId?: string;              // Optional - Parent task ID (for subtasks)
}
```

**Example Request - create_task:**
```json
{
  "name": "create_task",
  "arguments": {
    "workspaceId": "65f2a1b3c9e7123456789012",
    "projectId": "65f2a1b3c9e7123456789013",
    "sectionName": "To Do",
    "title": "Review pull request",
    "description": "Review the new authentication flow PR",
    "priority": "high",
    "status": "todo",
    "dueDate": "next monday"
  }
}
```

**Supported dueDate formats:**
- `2026-03-25` - ISO date
- `tomorrow` - Natural language
- `next monday` - Natural language
- `in 2 weeks` - Natural language

**Input Schema - retrieve_tasks:**
```typescript
{
  workspaceName?: string;         // Optional - Workspace name
  workspaceId?: string;           // Optional - Workspace ID
  projectName?: string;           // Optional - Project name
  projectId?: string;             // Optional - Project ID
  status?: string[];              // Optional - Filter by status
  priority?: string[];            // Optional - Filter by priority
  keyword?: string;               // Optional - Search keyword
  dueDate?: string;               // Optional - Due date filter
  pageSize?: number;              // Optional - Default 10
  pageNumber?: number;            // Optional - Default 1
}
```

**Input Schema - update_task:**
```typescript
{
  workspaceId?: string;           // Optional - Workspace ID
  workspaceName?: string;         // Optional - Workspace name
  projectId?: string;             // Optional - Project ID
  projectName?: string;           // Optional - Project name
  taskId?: string;                // Optional - Specific task ID
  taskName?: string;              // Optional - Search by task name
  title?: string;                 // Optional - New title
  description?: string;           // Optional - New description
  priority?: string;              // Optional - New priority
  status?: string;                // Optional - New status
  type?: string;                  // Optional - New type
  assignees?: string[];           // Optional - New assignees
  dueDate?: string;               // Optional - New due date
}
```

---

## Authentication Flow

### OAuth 2.0 with PKCE

The MCP server uses OAuth 2.0 with PKCE (Proof Key for Code Exchange) for secure authentication:

```
1. Dynamic Client Registration
   Client -> POST /register
   <- client_id, client_secret

2. Authorization Request
   Client -> GET /mcp/oauth/authorize?redirect_uri=..., code_challenge=..., code_challenge_method=S256
   <- Redirects to Google OAuth

3. User logs in with Google
   User authenticates via Google

4. Authorization Code
   Google redirects user -> GET /mcp/oauth/google/callback
   -> POST /mcp/oauth/token?code=..., code_verifier=...
   <- access_token, token_type, expires_in
```

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/register` | POST | Dynamic client registration |
| `/.well-known/oauth-authorization-server` | GET | OAuth discovery |
| `/mcp/oauth/authorize` | GET | Authorization endpoint |
| `/mcp/oauth/google/callback` | GET | Google OAuth callback |
| `/mcp/oauth/token` | POST | Token endpoint |
| `/mcp` | POST | MCP tool calls |
| `/mcp` | GET | SSE stream |
| `/mcp` | DELETE | Session termination |

### Session Management

- Sessions are tracked via `mcp-session-id` header
- 5-minute inactivity timeout (configurable via `SESSION_TIMEOUT_MS`)
- Automatic cleanup of stale/orphaned sessions every 60 seconds

---

## For Developers

### Adding a New Tool

1. **Create the tool file** in `backend/src/mcp/tools/[entity]/[action].tools.ts`:

```typescript
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { myService } from "../../../services/my.service";

// Define input schema
const myToolSchema = z.object({
  param1: z.string(),
  param2: z.string().optional(),
});

type MyToolInput = z.infer<typeof myToolSchema>;

export function registerMyToolTool(server: McpServer, userId: string) {
  server.registerTool(
    "my_tool",  // Tool name (snake_case)
    {
      title: "My Tool",
      description: "Does something useful",
      inputSchema: myToolSchema as any,
      annotations: {
        readOnlyHint: false,  // true for read-only, false for write
      },
    },
    async (args: MyToolInput) => {
      // Validate input
      const { param1, param2 } = myToolSchema.parse(args);

      // Call service
      const result = await myService(param1, param2);

      // Return response in MCP format
      return {
        content: [
          {
            type: "text" as const,
            text: `Result: ${result}`,
          },
        ],
      };
    }
  );
}
```

2. **Register the tool** in `backend/src/mcp/registry/tool.registry.ts`:

```typescript
import { registerMyToolTool } from "../tools/mytool/my.tool.tools";

export function registerTools(server: McpServer, userId: string) {
  // ... existing tools
  
  // Add new tool
  registerMyToolTool(server, userId);
}
```

3. **Key Patterns**:
   - Always resolve entities by name if ID not provided (user-friendly)
   - Return helpful error messages with available options
   - Use Zod for schema validation
   - Reuse existing services (`workspace.service.ts`, `project.service.ts`, etc.)
   - Use `formatList` helper for displaying lists

### Best Practices

1. **Entity Resolution**: If user provides a name but not an ID, resolve to ID:
   - If 1 match: use it
   - If 0 matches: return error with available options
   - If multiple matches: return disambiguation list

2. **Error Messages**: Always provide actionable feedback:
   ```
   "Workspace 'xyz' not found. Available workspaces:
   1. Workspace A (id: abc)
   2. Workspace B (id: def)
   Reply with workspaceId."
   ```

3. **Input Schema**: Use Zod for validation with clear descriptions:
   ```typescript
   workspaceName: z.string().describe("Workspace Name"),
   ```

4. **Response Format**: Return MCP-compliant responses:
   ```typescript
   return {
     content: [{ type: "text" as const, text: "..." }],
     // isError: true for errors
   };
   ```

---

## Integration with Express

The MCP server is integrated into the main Express application in `backend/src/index.ts`:

```typescript
import { setupMcpTransport } from "./mcp/index";
import mcpOAuthRouter from './mcp/oauth/mcp.oauth.router';

// After creating the Express app...
const app = express();

// Setup MCP transport (POST, GET, DELETE /mcp)
setupMcpTransport(app);

// OAuth endpoints
app.use('/.well-known', mcpOAuthRouter);           // Discovery endpoint
app.use('/mcp/oauth', mcpOAuthRouter);             // Auth, token, callback
app.use('/', mcpOAuthRouter);                      // Dynamic registration
```

The `setupMcpTransport()` function:
- Mounts the MCP endpoints (`/mcp`) on your Express app
- Handles JWT authentication via passport
- Manages session lifecycle (creation, activity tracking, cleanup)

---

## Authentication Details

### JWT Authentication

All MCP requests require a valid JWT token in the `Authorization: Bearer <token>` header. The token is validated by the `mcpAuth` middleware in `see.transport.ts`:

```typescript
function mcpAuth(req: Request, res: Response, next: NextFunction) {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err || !user) {
      // Return 401 with OAuth discovery header
      res.setHeader("WWW-Authenticate", `Bearer realm="${config.BASE_URL}", resource_metadata="${config.BASE_URL}/.well-known/oauth-authorization-server"`);
      // ...
    }
    req.user = user;  // User object available in request
    next();
  })(req, res, next);
}
```

**Important**: When you register tools, the `userId` parameter comes from the authenticated user's JWT. It's automatically extracted from `req.user._id.toString()` and passed to each tool registration. You don't need to handle authentication in your tool code.

### Google OAuth Strategy (MCP)

The MCP OAuth flow uses a separate Google OAuth strategy named `google-mcp` (defined in `backend/src/config/passport.config.ts`):

```typescript
passport.use(
  'google-mcp',
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.MCP_GOOGLE_CALLBACK_URL,  // Different from main app!
      scope: ['profile', 'email'],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      // Same user creation/login logic as main Google strategy
      // ...
    }
  )
);
```

This strategy uses a separate callback URL (`MCP_GOOGLE_CALLBACK_URL`) to differentiate MCP OAuth flows from regular app OAuth flows.

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Unauthorized: please authenticate via MCP OAuth flow" | Missing or invalid JWT token | Complete OAuth flow to get valid access token |
| Session timeout errors | 5-minute inactivity | Re-authenticate or implement keep-alive |
| PKCE verification failed | code_verifier doesn't match code_challenge | Ensure the same code_verifier used in auth request is sent to token endpoint |
| "Workspace not found" | Typo in workspace name | Use exact name or provide workspaceId directly |
| "No tasks found" | User not project member | User must be a member of the project to access its tasks |

### Debugging Tips

1. **Check session state**: Look for "Session initialized", "Session closed", or "Cleaning up stale session" logs
2. **Verify JWT**: Decode the token to ensure `userId` claim is present
3. **OAuth flow**: Use a tool like OAuth 2.0 Debugger to step through the flow
4. **Tool execution**: Enable verbose logging in the MCP SDK to see request/response details

---

## Configuration

Required environment variables (see `backend/src/config/app.config.ts`):

| Variable | Description |
|----------|-------------|
| `BASE_URL` | Public base URL (e.g., https://api.example.com) |
| `FRONTEND_ORIGIN` | Frontend origin for OAuth redirects |
| `MCP_GOOGLE_CALLBACK_URL` | OAuth callback URL |
| `JWT_SECRET` | JWT signing secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

---

## Testing

To test the MCP server manually:

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Use a tool like Postman or curl to interact with the endpoints.

3. For OAuth flow, configure your MCP client (e.g., mcp-remote) with:
   - Server URL: `https://your-base-url/mcp`
   - Auth URL: `https://your-base-url/mcp/oauth/authorize`
   - Token URL: `https://your-base-url/mcp/oauth/token`

---

## Dependencies

Key packages used:
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `zod` - Schema validation
- `chrono-node` - Natural language date parsing
- `passport` - Authentication middleware
- `express` - Web framework