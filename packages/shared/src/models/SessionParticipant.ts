import type { UserSummary } from "./User";

export interface SessionParticipant {
  id: string;
  sessionId: string;
  userId: string;
  joinedAt: string;
  user: UserSummary;
}
