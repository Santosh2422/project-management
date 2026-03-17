import { z } from "zod";

export const createTaskTool = {
  name: "create_task",
  description: "Create a new task inside a project",
  schema: { message: z.string().optional() },
  handler: async ({ message }: { message?: string }) => {
    return {
      content: [
        {
          type: "text" as const,
          text: `Hi hello namaste Vanakkam! You said: ${message ?? "nothing"}`,
        },
      ],
    };
  },
};