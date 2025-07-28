import { Router, Request, Response } from "express";
import conversationManager from "../services/conversationManager";
import { getStudentById } from "../data/mockData";
import { WebhookRequest, WebhookResponse, ApiError } from "../types";

const router = Router();

// POST /api/whatsapp-webhook
router.post(
  "/whatsapp-webhook",
  (
    req: Request<{}, {}, WebhookRequest>,
    res: Response<WebhookResponse | ApiError>
  ) => {
    try {
      const { studentId, message } = req.body;

      // Validate input
      if (!studentId || !message) {
        return res.status(400).json({
          error: "Missing required fields",
          message:
            "Please provide both studentId and message in the request body",
        });
      }

      // Check if student exists
      const student = getStudentById(studentId);
      if (!student) {
        return res.status(404).json({
          error: "Student not found",
          message: `No student found with ID: ${studentId}`,
        });
      }

      // Check if conversation exists
      const conversation = conversationManager.getConversation(studentId);
      if (!conversation) {
        return res.status(404).json({
          error: "No active conversation",
          message: `No active conversation found for student ${studentId}. Please start a conversation first.`,
        });
      }

      // Handle the message
      conversationManager.handleMessage(studentId, message);

      // Return success response
      return res.status(200).json({
        message: "Message processed successfully",
        student: {
          id: student.id,
          name: student.name,
        },
        conversationState: conversation.state,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error processing webhook message:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: "Failed to process webhook message",
      });
    }
  }
);

// GET /api/whatsapp-webhook - Webhook verification (for real WhatsApp API)
router.get("/whatsapp-webhook", (_req: Request, res: Response) => {
  // This endpoint would handle WhatsApp webhook verification
  // For now, just return a simple response
  return res.status(200).json({
    message: "WhatsApp webhook endpoint is active",
    timestamp: new Date(),
  });
});

export default router;
