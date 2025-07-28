import { EventEmitter } from "events";
import {
  GraduationDayEvent,
  ConversationStartedEvent,
  MessageSentEvent,
  MessageReceivedEvent,
  ConversationCompletedEvent,
  ConversationFailedEvent,
} from "../types";

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Allow more listeners for scalability
  }

  // Emit graduation day event
  emitGraduationDay(studentId: number): void {
    console.log(`📅 Emitting graduation day event for student ${studentId}`);
    const event: GraduationDayEvent = { studentId, timestamp: new Date() };
    this.emit("graduation.day", event);
  }

  // Emit conversation started event
  emitConversationStarted(studentId: number, phone: string): void {
    console.log(
      `💬 Emitting conversation started event for student ${studentId}`
    );
    const event: ConversationStartedEvent = {
      studentId,
      phone,
      timestamp: new Date(),
    };
    this.emit("conversation.started", event);
  }

  // Emit message sent event
  emitMessageSent(studentId: number, message: string, phone: string): void {
    console.log(`📤 Emitting message sent event for student ${studentId}`);
    const event: MessageSentEvent = {
      studentId,
      message,
      phone,
      timestamp: new Date(),
    };
    this.emit("message.sent", event);
  }

  // Emit message received event
  emitMessageReceived(studentId: number, message: string, phone: string): void {
    console.log(`📥 Emitting message received event for student ${studentId}`);
    const event: MessageReceivedEvent = {
      studentId,
      message,
      phone,
      timestamp: new Date(),
    };
    this.emit("message.received", event);
  }

  // Emit conversation completed event
  emitConversationCompleted(studentId: number, jobMatches: any[]): void {
    console.log(
      `✅ Emitting conversation completed event for student ${studentId}`
    );
    const event: ConversationCompletedEvent = {
      studentId,
      jobMatches,
      timestamp: new Date(),
    };
    this.emit("conversation.completed", event);
  }

  // Emit conversation failed event
  emitConversationFailed(studentId: number, error: string): void {
    console.log(
      `❌ Emitting conversation failed event for student ${studentId}`
    );
    const event: ConversationFailedEvent = {
      studentId,
      error,
      timestamp: new Date(),
    };
    this.emit("conversation.failed", event);
  }
}

// Create singleton instance
const eventBus = new EventBus();

export default eventBus;
