import conversationManager from "../services/conversationManager";
import { getStudentById } from "../data/mockData";
import eventBus from "../services/eventBus";

// Mock eventBus
jest.mock("../services/eventBus");

describe("ConversationManager", () => {
  beforeEach(() => {
    // Clear all conversations before each test
    (conversationManager as any).conversations.clear();

    // Reset eventBus mocks
    jest.clearAllMocks();
  });

  describe("startConversation", () => {
    it("should start a conversation for a valid student", () => {
      const studentId = 1;
      const student = getStudentById(studentId);

      conversationManager.startConversation(studentId);

      const conversation = conversationManager.getConversation(studentId);
      expect(conversation).toBeDefined();
      expect(conversation?.studentId).toBe(studentId);
      expect(conversation?.student).toEqual(student);
      expect(conversation?.state).toBe("asking_employment_type");
      expect(eventBus.emitConversationStarted).toHaveBeenCalledWith(
        studentId,
        student?.phone
      );
    });

    it("should not start conversation for invalid student", () => {
      const invalidStudentId = 999;

      conversationManager.startConversation(invalidStudentId);

      const conversation =
        conversationManager.getConversation(invalidStudentId);
      expect(conversation).toBeUndefined();
      expect(eventBus.emitConversationFailed).toHaveBeenCalledWith(
        invalidStudentId,
        "Student not found"
      );
    });

    it("should not start duplicate conversation", () => {
      const studentId = 1;

      // Start first conversation
      conversationManager.startConversation(studentId);
      const firstConversation = conversationManager.getConversation(studentId);

      // Try to start second conversation
      conversationManager.startConversation(studentId);
      const secondConversation = conversationManager.getConversation(studentId);

      expect(firstConversation?.id).toBe(secondConversation?.id);
    });
  });

  describe("handleMessage", () => {
    beforeEach(() => {
      // Start a conversation for testing
      conversationManager.startConversation(1);
    });

    it("should handle employment type response correctly", () => {
      const studentId = 1;
      const message = "full-time";

      conversationManager.handleMessage(studentId, message);

      const conversation = conversationManager.getConversation(studentId);
      expect(conversation?.preferences.employmentType).toBe("full-time");
      expect(conversation?.state).toBe("asking_work_model");
      expect(eventBus.emitMessageReceived).toHaveBeenCalledWith(
        studentId,
        message,
        conversation?.student.phone
      );
    });

    it("should handle work model response correctly", () => {
      const studentId = 1;

      // First set employment type
      conversationManager.handleMessage(studentId, "full-time");

      // Then set work model
      conversationManager.handleMessage(studentId, "remote");

      const conversation = conversationManager.getConversation(studentId);
      expect(conversation?.preferences.workModel).toBe("remote");
      expect(conversation?.state).toBe("completed");
    });

    it('should handle "I don\'t know" responses', () => {
      const studentId = 1;

      conversationManager.handleMessage(studentId, "no sé");

      const conversation = conversationManager.getConversation(studentId);
      expect(conversation?.preferences.employmentType).toBe("unknown");
      expect(conversation?.state).toBe("asking_work_model");
    });

    it("should handle invalid responses by asking again", () => {
      const studentId = 1;
      const invalidMessage = "invalid response";

      // Mock the sendEmploymentTypeQuestion method
      const mockSendQuestion = jest.spyOn(
        conversationManager as any,
        "sendEmploymentTypeQuestion"
      );

      conversationManager.handleMessage(studentId, invalidMessage);

      expect(mockSendQuestion).toHaveBeenCalledWith(studentId);
      mockSendQuestion.mockRestore();
    });

    it("should not handle messages for non-existent conversation", () => {
      const studentId = 999;
      const message = "test message";

      expect(() => {
        conversationManager.handleMessage(studentId, message);
      }).not.toThrow();
    });
  });

  describe("job matching", () => {
    it("should match jobs based on preferences", () => {
      const studentId = 1;
      conversationManager.startConversation(studentId);

      // Set preferences
      conversationManager.handleMessage(studentId, "full-time");
      conversationManager.handleMessage(studentId, "remote");

      const conversation = conversationManager.getConversation(studentId);
      expect(conversation?.state).toBe("completed");
    });

    it("should handle unknown preferences gracefully", () => {
      const studentId = 1;
      conversationManager.startConversation(studentId);

      // Set unknown preferences
      conversationManager.handleMessage(studentId, "no sé");
      conversationManager.handleMessage(studentId, "no sé");

      const conversation = conversationManager.getConversation(studentId);
      expect(conversation?.state).toBe("completed");
    });
  });

  describe("conversation state management", () => {
    it("should track conversation timestamps", () => {
      const studentId = 1;
      const beforeStart = new Date();

      conversationManager.startConversation(studentId);

      const conversation = conversationManager.getConversation(studentId);
      expect(conversation?.createdAt).toBeInstanceOf(Date);
      expect(conversation?.updatedAt).toBeInstanceOf(Date);
      expect(conversation?.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeStart.getTime()
      );
    });

    it("should clear conversations", () => {
      const studentId = 1;
      conversationManager.startConversation(studentId);

      expect(conversationManager.getConversation(studentId)).toBeDefined();

      conversationManager.clearConversation(studentId);

      expect(conversationManager.getConversation(studentId)).toBeUndefined();
    });

    it("should get all conversations", () => {
      conversationManager.startConversation(1);
      conversationManager.startConversation(2);

      const allConversations = conversationManager.getAllConversations();
      expect(allConversations).toHaveLength(2);
      expect(allConversations[0]?.studentId).toBe(1);
      expect(allConversations[1]?.studentId).toBe(2);
    });
  });
});
