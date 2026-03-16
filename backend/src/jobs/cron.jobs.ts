import cron from "node-cron";
import TaskModel, { TaskDocument } from "../models/task.model";
//import sendEmail from "../utils/sendEmail";

// ✅ TypeScript interface — defines shape of job result
interface JobResult {
  successCount: number;
  failCount: number;
  totalFound: number;
}

// ── Helper: build the overdue email body ──────────────────
// const buildEmailBody = (task: TaskDocument): string => {
//   return `Hi ${task.assigneeName ?? "there"},

// Your task "${task.name}" was due on ${task.dueDate.toDateString()} 
// and has now been marked as OVERDUE.

// Please update your progress or contact your manager.

// - Your Project Management App`;
// };

// ── Main job logic (exported so you can test it manually) ──
const runOverdueCheck = async (): Promise<JobResult> => {
  const result: JobResult = {
    successCount: 0,
    failCount: 0,
    totalFound: 0
  };

  // Get today at exactly 00:00:00
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch only tasks that just became overdue
  const overdueTasks: TaskDocument[] = await TaskModel.find({
    dueDate: { $lt: today },
    status: { $nin: ["DONE", "BACKLOG"] }
  });

  result.totalFound = overdueTasks.length;

  if (overdueTasks.length === 0) {
    console.log("✅ No overdue tasks found. All good!");
    return result;
  }

  console.log(`⚠️  Found ${overdueTasks.length} overdue task(s). Processing...`);

  // Process each overdue task
  for (const task of overdueTasks) {
    try {
      // 1. Update status in DB
      task.status = "BACKLOG";
      await task.save();

      // 2. Send email only if assignee email exists
      // if (task.assigneeEmail) {
      //   await sendEmail({
      //     to: task.assigneeEmail,
      //     subject: `⚠️ Task Overdue: ${task.name}`,
      //     body: buildEmailBody(task)
      //   });
      //}

      result.successCount++;
      console.log(`  ✅ Done: "${task.title}" → OVERDUE`);

    } catch (error) {
      result.failCount++;
      if (error instanceof Error) {
        console.error(`  ❌ Failed: "${task.title}" →`, error.message);
      }
    }
  }

  return result;
};

// ── Schedule the cron job ─────────────────────────────────
cron.schedule("0 0 * * *", async () => {

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("⏰ Midnight check started:", new Date().toLocaleString());
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    const result = await runOverdueCheck();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📊 Summary: ${result.successCount} updated, ${result.failCount} failed`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Cron job crashed:", error.message);
    }
  }

}, {
  timezone: "Asia/Kolkata" // ← IST for Bengaluru
});

console.log("📅 Overdue checker scheduled — runs every midnight IST");