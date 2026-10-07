import type { UserSummary } from "./User";

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  message: string;
  sentAt: string;
  sender: UserSummary;
}
