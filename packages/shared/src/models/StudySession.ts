import type { CapacityStatus } from "../enums/CapacityStatus";
import type { SessionParticipant } from "./SessionParticipant";
import type { UserSummary } from "./User";

export interface StudySession {
  id: string;
  creatorId: string;
  title: string;
  subject: string;
  startTime: string;
  location: string;
  capacity: number;
  createdAt: string;
  creator: UserSummary;
  participants: SessionParticipant[];
  participantCount: number;
  capacityStatus: CapacityStatus;
}
