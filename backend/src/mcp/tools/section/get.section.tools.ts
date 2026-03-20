import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getProjectSectionsService } from "../../../services/section.service";
import { getAllWorkspacesUserIsMemberService } from "../../../services/workspace.service";
import { checkProjectMembership, getUserProjectsInWorkspaceService } from "../../../services/project.service";

// --------------------
// Schema
// --------------------

const getSectionsSchema = z.object({
  workspaceName: z.string().optional(),
  workspaceId: z.string().optional(),

  projectName: z.string().optional(),
  projectId: z.string().optional(),
});

type GetSectionsInput = z.infer<typeof getSectionsSchema>;

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

export function getProjectSectionsTool(server: McpServer) {
  server.registerTool(
    "retrieve_project_sections",
    {
      title: "Retrieve Project Sections",
      description: "Get all sections inside a project",
      inputSchema: getSectionsSchema as any,
    },
    async (args: GetSectionsInput) => {
      const parsed = getSectionsSchema.parse(args);

      let { workspaceId, workspaceName, projectId, projectName } = parsed;

      const userId = process.env.MY_ID;

      if (!userId) {
        return {
          content: [
            {
              type: "text" as const,
              text: "User ID missing.",
            },
          ],
          isError: true,
        };
      }

      // -------------------------------
    // WORKSPACE
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
    // PROJECT
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
    // MEMBERSHIP
    // -------------------------------
    const isMember = await checkProjectMembership(userId, projectId);

    if (!isMember) {
        return {
        content: [
            {
            type: "text" as const,
            text: "❌ You are not a member of this project.",
            },
        ],
        isError: true,
        };
    }
      
      // -------------------------------
      // FETCH SECTIONS
      // -------------------------------
      const { sections } = await getProjectSectionsService(
        workspaceId,
        projectId
      );

      if (!sections || sections.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No sections found in this project.",
            },
          ],
        };
      }

      // -------------------------------
      // RESPONSE (clean)
      // -------------------------------
      const list = sections
        .map((s: any, i: number) => `${i + 1}. ${s.name}`)
        .join("\n");

      return {
        content: [
          {
            type: "text" as const,
            text:
              `Found ${sections.length} sections:\n\n${list}\n\n` +
              `👉 Reply with the section name exactly.`+
              `👉 You can now use section name to create or manage tasks.`,
          },
        ],
      };
    }
  );
}