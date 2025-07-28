import { Router, Request, Response } from "express";
import conversationManager from "../services/conversationManager";
import { getStudentById } from "../data/mockData";
import {
  StartConversationRequest,
  StartConversationResponse,
  ApiError,
} from "../types";

const router = Router();

// POST /api/start-conversation
router.post(
  "/start-conversation",
  (
    req: Request<{}, {}, StartConversationRequest>,
    res: Response<StartConversationResponse | ApiError>
  ) => {
    try {
      const { studentId } = req.body;

      // Validate input
      if (!studentId) {
        return res.status(400).json({
          error: "Missing required field: studentId",
          message: "Please provide a studentId in the request body",
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

      // Check if conversation already exists
      const existingConversation =
        conversationManager.getConversation(studentId);
      if (existingConversation) {
        return res.status(409).json({
          error: "Conversation already exists",
          message: `A conversation is already active for student ${studentId}`,
          conversation: {
            id: existingConversation.id,
            state: existingConversation.state,
            createdAt: existingConversation.createdAt,
            updatedAt: existingConversation.updatedAt,
          },
        } as any);
      }

      // Start conversation
      conversationManager.startConversation(studentId);

      // Return success response
      return res.status(200).json({
        message: "Conversation started successfully",
        student: {
          id: student.id,
          name: student.name,
          phone: student.phone,
          graduation_date: student.graduation_date,
          title: student.title,
          education_institution: student.education_institution,
        },
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error starting conversation:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: "Failed to start conversation",
      });
    }
  }
);

// GET /api/conversations - Get all active conversations (for debugging)
router.get("/conversations", (_req: Request, res: Response) => {
  try {
    const conversations = conversationManager.getAllConversations();

    return res.status(200).json({
      conversations: conversations.map((conv) => ({
        id: conv.id,
        studentId: conv.studentId,
        studentName: conv.student.name,
        state: conv.state,
        preferences: conv.preferences,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })),
      count: conversations.length,
    });
  } catch (error) {
    console.error("Error getting conversations:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to get conversations",
    });
  }
});

// GET /api/conversations/:studentId - Get specific conversation
router.get(
  "/conversations/:studentId",
  (req: Request<{ studentId: string }>, res: Response) => {
    try {
      const { studentId } = req.params;
      const conversation = conversationManager.getConversation(
        parseInt(studentId)
      );

      if (!conversation) {
        return res.status(404).json({
          error: "Conversation not found",
          message: `No active conversation found for student ${studentId}`,
        });
      }

      return res.status(200).json({
        conversation: {
          id: conversation.id,
          studentId: conversation.studentId,
          student: conversation.student,
          state: conversation.state,
          preferences: conversation.preferences,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error getting conversation:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: "Failed to get conversation",
      });
    }
  }
);

// DELETE /api/conversations/:studentId - Clear conversation (for testing)
router.delete(
  "/conversations/:studentId",
  (req: Request<{ studentId: string }>, res: Response) => {
    try {
      const { studentId } = req.params;
      const conversation = conversationManager.getConversation(
        parseInt(studentId)
      );

      if (!conversation) {
        return res.status(404).json({
          error: "Conversation not found",
          message: `No active conversation found for student ${studentId}`,
        });
      }

      conversationManager.clearConversation(parseInt(studentId));

      return res.status(200).json({
        message: "Conversation cleared successfully",
        studentId: parseInt(studentId),
      });
    } catch (error) {
      console.error("Error clearing conversation:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: "Failed to clear conversation",
      });
    }
  }
);

export default router;
