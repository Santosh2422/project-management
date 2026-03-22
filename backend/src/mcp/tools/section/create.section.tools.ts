import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createSectionService } from "../../../services/section.service";
import { getAllWorkspacesUserIsMemberService } from "../../../services/workspace.service";
import { getUserProjectsInWorkspaceService } from "../../../services/project.service";

// --------------------
// Schema
// --------------------

const createSectionInputSchema = z.object({
  workspaceName: z.string().optional().describe("Workspace Name"),
  workspaceId: z.string().optional().describe("Workspace Id"),
  projectName: z.string().optional().describe("Project Name"),
  projectId: z.string().optional().describe("Project Id"),
  name: z.string().optional().describe("Section name"),
});

type CreateSectionInput = z.infer<typeof createSectionInputSchema>;

// --------------------
// Formatter
// --------------------

const formatList = (items: any[], label: string) =>
  items
    .map((item, i) => `${i + 1}. ${item.name} (${label}: ${item._id})`)
    .join("\n");

// --------------------
// Tool
// --------------------

export function createSectionTool(server: McpServer) {
  server.registerTool(
    "create_section",
    {
      title: "Create Section",
      description: "Creates a section inside a project",
      inputSchema: createSectionInputSchema as any,
    },
    async (args: CreateSectionInput) => {
      const {
        workspaceName,
        workspaceId: providedWorkspaceId,
        projectName,
        projectId: providedProjectId,
        name,
      } = createSectionInputSchema.parse(args);

      let workspaceId = providedWorkspaceId;
      let projectId = providedProjectId;

      const userId = process.env.MY_ID;
      if (!userId) {
        return {
          content: [{ type: "text" as const, text: "User ID not found." }],
          isError: true,
        };
      }

      // -------------------------------
      // WORKSPACE RESOLUTION
      // -------------------------------
      const { workspaces } =
        await getAllWorkspacesUserIsMemberService(userId);

      if (!workspaceId && workspaceName) {
        const matches = workspaces.filter((w: any) =>
          w.name.toLowerCase().includes(workspaceName.toLowerCase())
        );

        if (matches.length === 1) {
          workspaceId = matches[0]._id.toString();
        } else {
          const list = formatList(
            matches.length ? matches : workspaces,
            "id"
          );

          return {
            content: [
              {
                type: "text" as const,
                text:
                  `Found ${workspaces.length} workspaces.\n\n` +
                  (matches.length === 0
                    ? `Workspace "${workspaceName}" not found.\n\n`
                    : `Multiple matching workspaces found.\n\n`) +
                  `Available workspaces:\n${list}\n\n` +
                  `👉 Reply with exact workspaceId.`,
              },
            ],
          };
        }
      }

      if (!workspaceId) {
        const list = formatList(workspaces, "id");

        return {
          content: [
            {
              type: "text" as const,
              text:
                `Available workspaces:\n${list}\n\n` +
                `👉 Reply with workspaceId.`,
            },
          ],
        };
      }

      // -------------------------------
      // PROJECT RESOLUTION
      // -------------------------------
      const { projects } =
        await getUserProjectsInWorkspaceService(
          userId,
          workspaceId,
          50,
          1
        );

      if (!projectId && projectName) {
        const matches = projects.filter((p: any) =>
          p.name.toLowerCase().includes(projectName.toLowerCase())
        );

        if (matches.length === 1) {
          projectId = (matches[0] as any)._id.toString();
        } else {
          const list = formatList(
            matches.length ? matches : projects,
            "id"
          );

          return {
            content: [
              {
                type: "text" as const,
                text:
                  `Found ${projects.length} projects.\n\n` +
                  (matches.length === 0
                    ? `Project "${projectName}" not found.\n\n`
                    : `Multiple matching projects found.\n\n`) +
                  `Available projects:\n${list}\n\n` +
                  `👉 Reply with projectId.`,
              },
            ],
          };
        }
      }

      if (!projectId) {
        const list = formatList(projects, "id");

        return {
          content: [
            {
              type: "text" as const,
              text:
                `Available projects:\n${list}\n\n` +
                `👉 Reply with projectId.`,
            },
          ],
        };
      }

      // -------------------------------
      // SECTION NAME CHECK
      // -------------------------------
      if (!name) {
        return {
          content: [
            {
              type: "text" as const,
              text: `👉 Please provide a name for the section.`,
            },
          ],
        };
      }

      // -------------------------------
      // CREATE SECTION
      // -------------------------------
      const { section } = await createSectionService(
        workspaceId,
        projectId,
        name
      );

      // -------------------------------
      // SUCCESS RESPONSE
      // -------------------------------
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Section "${section.name}" created successfully.`,
          },
        ],
      };
    }
  );
}