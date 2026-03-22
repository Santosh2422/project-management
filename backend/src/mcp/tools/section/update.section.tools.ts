import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { updateSectionService } from "../../../services/section.service";
import { getAllWorkspacesUserIsMemberService } from "../../../services/workspace.service";
import { getUserProjectsInWorkspaceService } from "../../../services/project.service";
import { getProjectSectionsService } from "../../../services/section.service";

// --------------------
// Schema
// --------------------

const updateSectionInputSchema = z.object({
  workspaceName: z.string().optional().describe("Workspace Name"),
  workspaceId: z.string().optional().describe("Workspace Id"),
  projectName: z.string().optional().describe("Project Name"),
  projectId: z.string().optional().describe("Project Id"),
  sectionName: z.string().optional().describe("Section Name"),
  sectionId: z.string().optional().describe("Section Id"),
  newName: z.string().optional().describe("New section name"),
});

type UpdateSectionInput = z.infer<typeof updateSectionInputSchema>;

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

export function registerUpdateSectionTool(server: McpServer) {
  server.registerTool(
    "update_section",
    {
      title: "Update Section",
      description: "Updates the name of an existing section",
      inputSchema: updateSectionInputSchema as any,
    },
    async (args: UpdateSectionInput) => {
      const {
        workspaceName,
        workspaceId: providedWorkspaceId,
        projectName,
        projectId: providedProjectId,
        sectionName,
        sectionId: providedSectionId,
        newName,
      } = updateSectionInputSchema.parse(args);

      let workspaceId = providedWorkspaceId;
      let projectId = providedProjectId;
      let sectionId = providedSectionId;

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
                  `👉 Reply with workspaceId.`,
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
      // SECTION RESOLUTION
      // -------------------------------
      const { sections } = await getProjectSectionsService(
        workspaceId,
        projectId
      );

      if (!sectionId && sectionName) {
        const matches = sections.filter((s: any) =>
          s.name.toLowerCase().includes(sectionName.toLowerCase())
        );

        if (matches.length === 1) {
          sectionId = (matches[0] as any)._id.toString();
        } else {
          const list = formatList(
            matches.length ? matches : sections,
            "id"
          );

          return {
            content: [
              {
                type: "text" as const,
                text:
                  `Found ${sections.length} sections.\n\n` +
                  (matches.length === 0
                    ? `Section "${sectionName}" not found.\n\n`
                    : `Multiple matching sections found.\n\n`) +
                  `Available sections:\n${list}\n\n` +
                  `👉 Reply with sectionId.`,
              },
            ],
          };
        }
      }

      if (!sectionId) {
        const list = formatList(sections, "id");

        return {
          content: [
            {
              type: "text" as const,
              text:
                `Available sections:\n${list}\n\n` +
                `👉 Reply with sectionId.`,
            },
          ],
        };
      }

      // -------------------------------
      // NEW NAME CHECK
      // -------------------------------
      if (!newName) {
        return {
          content: [
            {
              type: "text" as const,
              text: `👉 Please provide a new name for the section.`,
            },
          ],
        };
      }

      // -------------------------------
      // UPDATE SECTION
      // -------------------------------
      const { section } = await updateSectionService(
        workspaceId,
        projectId,
        sectionId,
        newName
      );

      // -------------------------------
      // SUCCESS RESPONSE
      // -------------------------------
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Section updated successfully. New name: "${section.name}"`,
          },
        ],
      };
    }
  );
}