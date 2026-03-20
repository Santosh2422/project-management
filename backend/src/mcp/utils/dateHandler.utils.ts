import * as chrono from "chrono-node";


export const parseDueDate = (dueDate?: string) => {
  if (!dueDate) return undefined;

  // Try natural parsing
  const parsed = chrono.parseDate(dueDate);

  if (!parsed) return null;

  // Optional: set end of day
  parsed.setHours(23, 59, 59, 999);

  return parsed;
};