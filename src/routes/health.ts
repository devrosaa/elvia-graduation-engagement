import { Router, Request, Response } from "express";
import graduationScheduler from "../services/graduationScheduler";
import conversationManager from "../services/conversationManager";
import { students, jobs } from "../data/mockData";
import { HealthResponse, SystemStatusResponse } from "../types";

const router = Router();

// GET /api/health - Basic health check
router.get("/health", (_req: Request, res: Response<HealthResponse>) => {
  res.status(200).json({
    status: "healthy",
    service: "Elvia Graduation Engagement System",
    timestamp: new Date(),
    version: "1.0.0",
  });
});

// GET /api/status - Detailed system status
router.get("/status", (_req: Request, res: Response<SystemStatusResponse>) => {
  try {
    const schedulerStatus = graduationScheduler.getStatus();
    const conversations = conversationManager.getAllConversations();

    return res.status(200).json({
      status: "operational",
      timestamp: new Date(),
      components: {
        graduationScheduler: {
          isRunning: schedulerStatus.isRunning,
          nextRun: schedulerStatus.nextRun,
          lastCheck: schedulerStatus.lastCheck,
        },
        conversationManager: {
          activeConversations: conversations.length,
          conversations: conversations.map((conv) => ({
            studentId: conv.studentId,
            studentName: conv.student.name,
            state: conv.state,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
          })),
        },
      },
      data: {
        totalStudents: students.length,
        totalJobs: jobs.length,
      },
    });
  } catch (error) {
    console.error("Error getting system status:", error);
    return res.status(500).json({
      status: "error",
      error: "Failed to get system status",
      timestamp: new Date(),
    } as any);
  }
});

// GET /api/students - Get all students (for debugging)
router.get("/students", (_req: Request, res: Response) => {
  return res.status(200).json({
    students: students,
    count: students.length,
  });
});

// GET /api/jobs - Get all jobs (for debugging)
router.get("/jobs", (_req: Request, res: Response) => {
  return res.status(200).json({
    jobs: jobs,
    count: jobs.length,
  });
});

// POST /api/trigger-graduation - Manually trigger graduation check (for testing)
router.post(
  "/trigger-graduation",
  (req: Request<{}, {}, { date?: string }>, res: Response) => {
    try {
      const { date } = req.body;
      const graduatingStudents =
        graduationScheduler.triggerGraduationCheck(date);

      return res.status(200).json({
        message: "Graduation check triggered successfully",
        date: date || "today",
        graduatingStudents: graduatingStudents.map((student) => ({
          id: student.id,
          name: student.name,
          title: student.title,
          graduation_date: student.graduation_date,
        })),
        count: graduatingStudents.length,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error triggering graduation check:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: "Failed to trigger graduation check",
      });
    }
  }
);

export default router;
