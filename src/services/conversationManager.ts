import { v4 as uuidv4 } from "uuid";
import {
  getStudentById,
  getJobsByPreferences,
  getAllJobs,
} from "../data/mockData";
import eventBus from "./eventBus";
import {
  Conversation,
  ConversationState,
  Job,
  EmploymentType,
  WorkModel,
  StudentPreferences,
} from "../types";

// Conversation states
const CONVERSATION_STATES = {
  INITIAL: "initial" as ConversationState,
  ASKING_EMPLOYMENT_TYPE: "asking_employment_type" as ConversationState,
  ASKING_WORK_MODEL: "asking_work_model" as ConversationState,
  PROVIDING_JOBS: "providing_jobs" as ConversationState,
  COMPLETED: "completed" as ConversationState,
  FAILED: "failed" as ConversationState,
};

class ConversationManager {
  private conversations: Map<number, Conversation>;

  constructor() {
    this.conversations = new Map(); // studentId -> conversation state
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for graduation day events
    eventBus.on("graduation.day", (data: { studentId: number }) => {
      this.startConversation(data.studentId);
    });
  }

  startConversation(studentId: number): void {
    const student = getStudentById(studentId);
    if (!student) {
      console.error(`❌ Student ${studentId} not found`);
      eventBus.emitConversationFailed(studentId, "Student not found");
      return;
    }

    // Check if conversation already exists
    const existingConversation = this.conversations.get(studentId);
    if (existingConversation) {
      console.log(`⚠️ Conversation already exists for student ${studentId}`);
      return;
    }

    // Initialize conversation state
    const conversationId = uuidv4();
    const conversation: Conversation = {
      id: conversationId,
      studentId: studentId,
      student: student,
      state: CONVERSATION_STATES.INITIAL,
      preferences: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.conversations.set(studentId, conversation);

    // Emit conversation started event
    eventBus.emitConversationStarted(studentId, student.phone);

    // Send initial message
    this.sendInitialMessage(studentId);
  }

  private sendInitialMessage(studentId: number): void {
    const conversation = this.conversations.get(studentId);
    if (!conversation) return;

    const message = `¡Felicitaciones ${conversation.student.name}! 🎓\n\nHas completado tu ${conversation.student.title} en ${conversation.student.education_institution}. ¡Es un logro increíble!\n\nPara ayudarte a encontrar tu próximo paso profesional, necesito conocer tus preferencias de trabajo.\n\n¿Qué tipo de empleo prefieres?\n\n1️⃣ Tiempo completo (full-time)\n2️⃣ Tiempo parcial (part-time)`;

    // For testing, make this synchronous; in production, this would be async
    if (process.env["NODE_ENV"] === "test") {
      console.log(
        `📤 Sending initial message to ${conversation.student.name}: ${message}`
      );
      eventBus.emitMessageSent(studentId, message, conversation.student.phone);

      // Update state immediately for tests
      conversation.state = CONVERSATION_STATES.ASKING_EMPLOYMENT_TYPE;
      conversation.updatedAt = new Date();
    } else {
      // Simulate latency in production
      setTimeout(() => {
        console.log(
          `📤 Sending initial message to ${conversation.student.name}: ${message}`
        );
        eventBus.emitMessageSent(
          studentId,
          message,
          conversation.student.phone
        );

        // Update state
        conversation.state = CONVERSATION_STATES.ASKING_EMPLOYMENT_TYPE;
        conversation.updatedAt = new Date();
      }, 150); // Simulate 150ms latency
    }
  }

  handleMessage(studentId: number, message: string): void {
    const conversation = this.conversations.get(studentId);
    if (!conversation) {
      console.error(`❌ No active conversation found for student ${studentId}`);
      return;
    }

    // Emit message received event
    eventBus.emitMessageReceived(
      studentId,
      message,
      conversation.student.phone
    );

    // Update conversation timestamp
    conversation.updatedAt = new Date();

    // Handle message based on current state
    switch (conversation.state) {
      case CONVERSATION_STATES.ASKING_EMPLOYMENT_TYPE:
        this.handleEmploymentTypeResponse(studentId, message);
        break;
      case CONVERSATION_STATES.ASKING_WORK_MODEL:
        this.handleWorkModelResponse(studentId, message);
        break;
      default:
        console.log(
          `⚠️ Unexpected message in state ${conversation.state}: ${message}`
        );
    }
  }

  private handleEmploymentTypeResponse(
    studentId: number,
    message: string
  ): void {
    const conversation = this.conversations.get(studentId);
    if (!conversation) return;

    const normalizedMessage = message.toLowerCase().trim();

    let employmentType: EmploymentType | null = null;

    // Parse employment type from message
    if (
      normalizedMessage.includes("1") ||
      normalizedMessage.includes("completo") ||
      normalizedMessage.includes("full-time")
    ) {
      employmentType = "full-time";
    } else if (
      normalizedMessage.includes("2") ||
      normalizedMessage.includes("parcial") ||
      normalizedMessage.includes("part-time")
    ) {
      employmentType = "part-time";
    } else if (
      normalizedMessage.includes("no sé") ||
      normalizedMessage.includes("no se") ||
      normalizedMessage.includes("no se")
    ) {
      // Handle "I don't know" response
      this.handleUnknownPreference(studentId, "employmentType");
      return;
    } else {
      // Invalid response, ask again
      this.sendEmploymentTypeQuestion(studentId);
      return;
    }

    // Store preference
    conversation.preferences.employmentType = employmentType;

    // Send work model question
    this.sendWorkModelQuestion(studentId);
  }

  private handleWorkModelResponse(studentId: number, message: string): void {
    const conversation = this.conversations.get(studentId);
    if (!conversation) return;

    const normalizedMessage = message.toLowerCase().trim();

    let workModel: WorkModel | null = null;

    // Parse work model from message
    if (
      normalizedMessage.includes("1") ||
      normalizedMessage.includes("remoto") ||
      normalizedMessage.includes("remote")
    ) {
      workModel = "remote";
    } else if (
      normalizedMessage.includes("2") ||
      normalizedMessage.includes("presencial") ||
      normalizedMessage.includes("on-site")
    ) {
      workModel = "on-site";
    } else if (
      normalizedMessage.includes("3") ||
      normalizedMessage.includes("híbrido") ||
      normalizedMessage.includes("hybrid")
    ) {
      workModel = "hybrid";
    } else if (
      normalizedMessage.includes("no sé") ||
      normalizedMessage.includes("no se") ||
      normalizedMessage.includes("no se")
    ) {
      // Handle "I don't know" response
      this.handleUnknownPreference(studentId, "workModel");
      return;
    } else {
      // Invalid response, ask again
      this.sendWorkModelQuestion(studentId);
      return;
    }

    // Store preference
    conversation.preferences.workModel = workModel;

    // Provide job matches
    this.provideJobMatches(studentId);
  }

  private handleUnknownPreference(
    studentId: number,
    preferenceType: keyof StudentPreferences
  ): void {
    const conversation = this.conversations.get(studentId);
    if (!conversation) return;

    // Store unknown preference
    conversation.preferences[preferenceType] = "unknown";

    if (preferenceType === "employmentType") {
      this.sendWorkModelQuestion(studentId);
    } else if (preferenceType === "workModel") {
      this.provideJobMatches(studentId);
    }
  }

  private sendEmploymentTypeQuestion(studentId: number): void {
    const conversation = this.conversations.get(studentId);
    if (!conversation) return;

    const message = `Por favor, elige una opción:\n\n1️⃣ Tiempo completo (full-time)\n2️⃣ Tiempo parcial (part-time)\n\nO responde "no sé" si no estás seguro.`;

    if (process.env["NODE_ENV"] === "test") {
      console.log(
        `📤 Sending employment type question to ${conversation.student.name}`
      );
      eventBus.emitMessageSent(studentId, message, conversation.student.phone);
    } else {
      setTimeout(() => {
        console.log(
          `📤 Sending employment type question to ${conversation.student.name}`
        );
        eventBus.emitMessageSent(
          studentId,
          message,
          conversation.student.phone
        );
      }, 100);
    }
  }

  private sendWorkModelQuestion(studentId: number): void {
    const conversation = this.conversations.get(studentId);
    if (!conversation) return;

    const message = `¡Perfecto! Ahora, ¿qué modelo de trabajo prefieres?\n\n1️⃣ Remoto (trabajar desde casa)\n2️⃣ Presencial (en oficina)\n3️⃣ Híbrido (combinación de ambos)\n\nO responde "no sé" si no estás seguro.`;

    if (process.env["NODE_ENV"] === "test") {
      console.log(
        `📤 Sending work model question to ${conversation.student.name}`
      );
      eventBus.emitMessageSent(studentId, message, conversation.student.phone);

      // Update state
      conversation.state = CONVERSATION_STATES.ASKING_WORK_MODEL;
      conversation.updatedAt = new Date();
    } else {
      setTimeout(() => {
        console.log(
          `📤 Sending work model question to ${conversation.student.name}`
        );
        eventBus.emitMessageSent(
          studentId,
          message,
          conversation.student.phone
        );

        // Update state
        conversation.state = CONVERSATION_STATES.ASKING_WORK_MODEL;
        conversation.updatedAt = new Date();
      }, 100);
    }
  }

  private provideJobMatches(studentId: number): void {
    const conversation = this.conversations.get(studentId);
    if (!conversation) return;

    const { employmentType, workModel } = conversation.preferences;

    // Get job matches based on preferences
    const jobMatches = this.getJobMatches(employmentType, workModel);

    // Update state
    conversation.state = CONVERSATION_STATES.PROVIDING_JOBS;
    conversation.updatedAt = new Date();

    // Send job matches
    if (process.env["NODE_ENV"] === "test") {
      const message = this.formatJobMatchesMessage(
        jobMatches,
        employmentType,
        workModel
      );
      console.log(`📤 Sending job matches to ${conversation.student.name}`);
      eventBus.emitMessageSent(studentId, message, conversation.student.phone);

      // Mark conversation as completed
      conversation.state = CONVERSATION_STATES.COMPLETED;
      conversation.updatedAt = new Date();

      // Emit completion event
      eventBus.emitConversationCompleted(studentId, jobMatches);
    } else {
      setTimeout(() => {
        const message = this.formatJobMatchesMessage(
          jobMatches,
          employmentType,
          workModel
        );
        console.log(`📤 Sending job matches to ${conversation.student.name}`);
        eventBus.emitMessageSent(
          studentId,
          message,
          conversation.student.phone
        );

        // Mark conversation as completed
        conversation.state = CONVERSATION_STATES.COMPLETED;
        conversation.updatedAt = new Date();

        // Emit completion event
        eventBus.emitConversationCompleted(studentId, jobMatches);
      }, 200); // Simulate job lookup latency
    }
  }

  private getJobMatches(
    employmentType?: EmploymentType,
    workModel?: WorkModel
  ): Job[] {
    // If both preferences are unknown, return all jobs
    if (employmentType === "unknown" && workModel === "unknown") {
      return getAllJobs();
    }

    // Filter jobs based on known preferences
    return getJobsByPreferences(
      employmentType === "unknown" ? null : employmentType,
      workModel === "unknown" ? null : workModel
    );
  }

  private formatJobMatchesMessage(
    jobMatches: Job[],
    employmentType?: EmploymentType,
    workModel?: WorkModel
  ): string {
    let message = `🎯 Basándome en tus preferencias`;

    if (employmentType !== "unknown") {
      message += ` (${
        employmentType === "full-time" ? "tiempo completo" : "tiempo parcial"
      }`;
    }
    if (workModel !== "unknown") {
      message += employmentType !== "unknown" ? ", " : " (";
      message +=
        workModel === "remote"
          ? "remoto"
          : workModel === "on-site"
          ? "presencial"
          : "híbrido";
    }
    message += `), aquí tienes ${jobMatches.length} oportunidades que podrían interesarte:\n\n`;

    if (jobMatches.length === 0) {
      message += `😔 No encontré trabajos que coincidan exactamente con tus preferencias. Te sugiero:\n\n`;
      message += `• Revisar todas las oportunidades disponibles\n`;
      message += `• Considerar opciones más flexibles\n`;
      message += `• Contactar a nuestro equipo de reclutamiento\n\n`;
      message += `¡Gracias por usar nuestro servicio! 🚀`;
    } else {
      jobMatches.forEach((job, index) => {
        message += `${index + 1}️⃣ ${job.title}\n`;
        message += `   📋 ${
          job.type === "full-time" ? "Tiempo completo" : "Tiempo parcial"
        }\n`;
        message += `   🏢 ${
          job.model === "remote"
            ? "Remoto"
            : job.model === "on-site"
            ? "Presencial"
            : "Híbrido"
        }\n\n`;
      });

      message += `¡Esperamos que encuentres la oportunidad perfecta! 🚀\n\n`;
      message += `Para más información, visita nuestra plataforma o contacta a nuestro equipo.`;
    }

    return message;
  }

  getConversation(studentId: number): Conversation | undefined {
    return this.conversations.get(studentId);
  }

  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values());
  }

  clearConversation(studentId: number): void {
    this.conversations.delete(studentId);
  }
}

// Create singleton instance
const conversationManager = new ConversationManager();

export default conversationManager;
