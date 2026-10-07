import type { StudySession } from "../models/StudySession";

export interface CreateSessionRequest {
  title: string;
  subject: string;
  startTime: string;
  location: string;
  capacity: number;
}

export type UpdateSessionRequest = Partial<CreateSessionRequest>;
export type SessionResponse = StudySession;
export type SessionListResponse = StudySession[];
