import request from "supertest";
import app from "../app";
import conversationManager from "../services/conversationManager";

// Mock eventBus
jest.mock("../services/eventBus");

describe("Integration Tests", () => {
  beforeEach(() => {
    // Clear all conversations before each test
    (conversationManager as any).conversations.clear();
    jest.clearAllMocks();
  });

  describe("Full Conversation Flow", () => {
    it("should complete a full conversation flow successfully", async () => {
      const studentId = 1;

      // Step 1: Start conversation
      const startResponse = await request(app)
        .post("/api/start-conversation")
        .send({ studentId })
        .expect(200);

      expect(startResponse.body.message).toBe(
        "Conversation started successfully"
      );
      expect(startResponse.body.student.id).toBe(studentId);
      expect(startResponse.body.student.name).toBe("Ana");

      // Step 2: Send employment type preference
      const employmentResponse = await request(app)
        .post("/api/whatsapp-webhook")
        .send({ studentId, message: "full-time" })
        .expect(200);

      expect(employmentResponse.body.message).toBe(
        "Message processed successfully"
      );
      expect(employmentResponse.body.conversationState).toBe(
        "asking_work_model"
      );

      // Step 3: Send work model preference
      const workModelResponse = await request(app)
        .post("/api/whatsapp-webhook")
        .send({ studentId, message: "remote" })
        .expect(200);

      expect(workModelResponse.body.message).toBe(
        "Message processed successfully"
      );
      expect(workModelResponse.body.conversationState).toBe("completed");

      // Verify conversation state
      const conversation = conversationManager.getConversation(studentId);
      expect(conversation?.preferences.employmentType).toBe("full-time");
      expect(conversation?.preferences.workModel).toBe("remote");
      expect(conversation?.state).toBe("completed");
    });

    it('should handle "I don\'t know" responses gracefully', async () => {
      const studentId = 1;

      // Start conversation
      await request(app)
        .post("/api/start-conversation")
        .send({ studentId })
        .expect(200);

      // Respond with "I don't know" for employment type
      await request(app)
        .post("/api/whatsapp-webhook")
        .send({ studentId, message: "no sé" })
        .expect(200);

      // Respond with "I don't know" for work model
      const finalResponse = await request(app)
        .post("/api/whatsapp-webhook")
        .send({ studentId, message: "no sé" })
        .expect(200);

      expect(finalResponse.body.conversationState).toBe("completed");

      // Verify conversation state
      const conversation = conversationManager.getConversation(studentId);
      expect(conversation?.preferences.employmentType).toBe("unknown");
      expect(conversation?.preferences.workModel).toBe("unknown");
    });
  });

  describe("API Endpoints", () => {
    it("should return 400 for missing studentId in start-conversation", async () => {
      await request(app).post("/api/start-conversation").send({}).expect(400);
    });

    it("should return 404 for non-existent student", async () => {
      await request(app)
        .post("/api/start-conversation")
        .send({ studentId: 999 })
        .expect(404);
    });

    it("should return health status", async () => {
      const response = await request(app).get("/api/health").expect(200);

      expect(response.body.status).toBe("healthy");
      expect(response.body.service).toBe("Elvia Graduation Engagement System");
    });

    it("should return system status", async () => {
      const response = await request(app).get("/api/status").expect(200);

      expect(response.body.status).toBe("operational");
      expect(response.body.components).toBeDefined();
      expect(response.body.data).toBeDefined();
    });
  });
});
