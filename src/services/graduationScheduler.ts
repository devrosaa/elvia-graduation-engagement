import cron from "node-cron";
import { getStudentsByGraduationDate } from "../data/mockData";
import eventBus from "./eventBus";
import { Student, SchedulerStatus } from "../types";

class GraduationScheduler {
  private isRunning: boolean;
  private scheduler: cron.ScheduledTask | null;

  constructor() {
    this.isRunning = false;
    this.scheduler = null;
  }

  start(): void {
    if (this.isRunning) {
      console.log("⚠️ Graduation scheduler is already running");
      return;
    }

    console.log("📅 Starting graduation scheduler...");

    // Schedule daily check at 9 AM
    this.scheduler = cron.schedule(
      "0 9 * * *",
      () => {
        this.checkGraduations();
      },
      {
        scheduled: false,
        timezone: "America/Bogota", // Latin America timezone
      }
    );

    this.scheduler.start();
    this.isRunning = true;

    console.log("✅ Graduation scheduler started successfully");
    console.log("⏰ Will check for graduations daily at 9:00 AM (Bogota time)");

    // For testing purposes, also check immediately
    this.checkGraduations();
  }

  stop(): void {
    if (this.scheduler) {
      this.scheduler.stop();
      this.isRunning = false;
      console.log("⏹️ Graduation scheduler stopped");
    }
  }

  private checkGraduations(): void {
    const today = this.getFormattedDate();
    console.log(`📅 Checking for graduations on ${today}`);

    const graduatingStudents = getStudentsByGraduationDate(today);

    if (graduatingStudents.length === 0) {
      console.log(`📅 No graduations scheduled for ${today}`);
      return;
    }

    console.log(
      `🎓 Found ${graduatingStudents.length} student(s) graduating today:`
    );

    graduatingStudents.forEach((student) => {
      console.log(
        `   - ${student.name} (ID: ${student.id}) - ${student.title}`
      );

      // Emit graduation day event
      eventBus.emitGraduationDay(student.id);
    });
  }

  private getFormattedDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Method to manually trigger graduation check (useful for testing)
  triggerGraduationCheck(date?: string): Student[] {
    const checkDate = date || this.getFormattedDate();
    console.log(`🔧 Manually triggering graduation check for ${checkDate}`);

    const graduatingStudents = getStudentsByGraduationDate(checkDate);

    if (graduatingStudents.length === 0) {
      console.log(`📅 No graduations found for ${checkDate}`);
      return [];
    }

    console.log(
      `🎓 Found ${graduatingStudents.length} student(s) graduating on ${checkDate}:`
    );

    graduatingStudents.forEach((student) => {
      console.log(
        `   - ${student.name} (ID: ${student.id}) - ${student.title}`
      );
      eventBus.emitGraduationDay(student.id);
    });

    return graduatingStudents;
  }

  // Method to get scheduler status
  getStatus(): SchedulerStatus {
    try {
      return {
        isRunning: this.isRunning,
        nextRun: this.scheduler ? (this.scheduler as any).nextDate() : null,
        lastCheck: new Date(),
      };
    } catch (error) {
      console.error("Error getting scheduler status:", error);
      return {
        isRunning: this.isRunning,
        nextRun: null,
        lastCheck: new Date(),
      };
    }
  }
}

// Create singleton instance
const graduationScheduler = new GraduationScheduler();

export default graduationScheduler;
