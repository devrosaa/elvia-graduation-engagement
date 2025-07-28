// Student interface
export interface Student {
  id: number;
  name: string;
  phone: string;
  graduation_date: string;
  title: string;
  education_institution: string;
}

// Job interface
export interface Job {
  id: number;
  title: string;
  type: "full-time" | "part-time";
  model: "remote" | "on-site" | "hybrid";
}

// Conversation states
export type ConversationState =
  | "initial"
  | "asking_employment_type"
  | "asking_work_model"
  | "providing_jobs"
  | "completed"
  | "failed";

// Employment type options
export type EmploymentType = "full-time" | "part-time" | "unknown";

// Work model options
export type WorkModel = "remote" | "on-site" | "hybrid" | "unknown";

// Student preferences
export interface StudentPreferences {
  employmentType?: EmploymentType;
  workModel?: WorkModel;
}

// Conversation interface
export interface Conversation {
  id: string;
  studentId: number;
  student: Student;
  state: ConversationState;
  preferences: StudentPreferences;
  createdAt: Date;
  updatedAt: Date;
}

// Event types
export interface GraduationDayEvent {
  studentId: number;
  timestamp: Date;
}

export interface ConversationStartedEvent {
  studentId: number;
  phone: string;
  timestamp: Date;
}

export interface MessageSentEvent {
  studentId: number;
  message: string;
  phone: string;
  timestamp: Date;
}

export interface MessageReceivedEvent {
  studentId: number;
  message: string;
  phone: string;
  timestamp: Date;
}

export interface ConversationCompletedEvent {
  studentId: number;
  jobMatches: Job[];
  timestamp: Date;
}

export interface ConversationFailedEvent {
  studentId: number;
  error: string;
  timestamp: Date;
}

// API Request/Response types
export interface StartConversationRequest {
  studentId: number;
}

export interface StartConversationResponse {
  message: string;
  student: Student;
  timestamp: Date;
}

export interface WebhookRequest {
  studentId: number;
  message: string;
}

export interface WebhookResponse {
  message: string;
  student: {
    id: number;
    name: string;
  };
  conversationState: ConversationState;
  timestamp: Date;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: Date;
  version: string;
}

export interface SystemStatusResponse {
  status: string;
  timestamp: Date;
  components: {
    graduationScheduler: {
      isRunning: boolean;
      nextRun: Date | null;
      lastCheck: Date;
    };
    conversationManager: {
      activeConversations: number;
      conversations: Array<{
        studentId: number;
        studentName: string;
        state: ConversationState;
        createdAt: Date;
        updatedAt: Date;
      }>;
    };
  };
  data: {
    totalStudents: number;
    totalJobs: number;
  };
}

// Error types
export interface ApiError {
  error: string;
  message: string;
}

// Scheduler status
export interface SchedulerStatus {
  isRunning: boolean;
  nextRun: Date | null;
  lastCheck: Date;
}
