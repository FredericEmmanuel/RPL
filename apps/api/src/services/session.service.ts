import { z } from "zod";
import { ServiceError } from "./errors";

export interface SessionRecord {
  id: string;
  creatorId: string;
  title: string;
  subject: string;
  startTime: Date;
  location: string;
  capacity: number;
  createdAt: Date;
  creator: { id: string; name: string };
  participants: Array<{
    id: string;
    sessionId: string;
    userId: string;
    joinedAt: Date;
    user: { id: string; name: string };
  }>;
  _count: { participants: number };
}

const sessionSchema = z.object({
  title: z.string().trim().min(3).max(120),
  subject: z.string().trim().min(1).max(80),
  startTime: z.string().datetime(),
  location: z.string().trim().min(2).max(160),
  capacity: z.number().int().min(2).max(100)
});

export function assertFutureStartTime(startTime: string): void {
  if (new Date(startTime).getTime() <= Date.now()) {
    throw new ServiceError("Waktu mulai sesi harus berada di masa depan.", 400);
  }
}

export type SessionCreator = (data: {
  title: string;
  subject: string;
  startTime: Date;
  location: string;
  capacity: number;
  creatorId: string;
  participants: { create: { userId: string } };
}) => Promise<SessionRecord>;

export function createSessionService(createSession: SessionCreator) {
  return {
    async create(userId: string, input: unknown) {
      const parsed = sessionSchema.safeParse(input);
      if (!parsed.success) {
        throw new ServiceError(parsed.error.issues[0]?.message ?? "Data sesi tidak valid.", 400);
      }
      assertFutureStartTime(parsed.data.startTime);
      return createSession({
        ...parsed.data,
        startTime: new Date(parsed.data.startTime),
        creatorId: userId,
        participants: { create: { userId } }
      });
    }
  };
}
