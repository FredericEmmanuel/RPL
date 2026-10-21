import { ServiceError } from "./errors";

interface ParticipantTransaction {
  studySession: {
    findUnique(args: {
      where: { id: string };
      include: { _count: { select: { participants: true } } };
    }): Promise<{ capacity: number; _count: { participants: number } } | null>;
  };
  sessionParticipant: {
    findUnique(args: {
      where: { sessionId_userId: { sessionId: string; userId: string } };
    }): Promise<{ id: string } | null>;
    create(args: { data: { sessionId: string; userId: string } }): Promise<unknown>;
  };
}

export interface ParticipantPrisma {
  $transaction<T>(
    operation: (transaction: ParticipantTransaction) => Promise<T>,
    options: { isolationLevel: "Serializable" }
  ): Promise<T>;
}

export function createParticipantService(prisma: ParticipantPrisma) {
  return {
    async join(sessionId: string, userId: string): Promise<void> {
      try {
        await prisma.$transaction(
          async (transaction) => {
            const session = await transaction.studySession.findUnique({
              where: { id: sessionId },
              include: { _count: { select: { participants: true } } }
            });
            if (!session) {
              throw new ServiceError("Sesi belajar tidak ditemukan.", 404);
            }
            const existing = await transaction.sessionParticipant.findUnique({
              where: { sessionId_userId: { sessionId, userId } }
            });
            if (existing) {
              throw new ServiceError("Kamu sudah bergabung dalam sesi ini.", 409);
            }
            if (session._count.participants >= session.capacity) {
              throw new ServiceError("Maaf, kapasitas sesi ini sudah penuh.", 409);
            }
            await transaction.sessionParticipant.create({ data: { sessionId, userId } });
          },
          { isolationLevel: "Serializable" }
        );
      } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
          throw new ServiceError("Kamu sudah bergabung dalam sesi ini.", 409);
        }
        throw error;
      }
    }
  };
}
