import { Router } from "express";
import { z } from "zod";
import { CapacityStatus, type ChatMessage, type StudySession } from "@studybuddy/shared";
import { createToken, mapUser, requireAuth, type AuthenticatedRequest } from "./auth";
import { prisma } from "./db";
import { createAuthService } from "./services/auth.service";
import { createChatService } from "./services/chat.service";
import { createExploreService } from "./services/explore.service";
import { createParticipantService } from "./services/participant.service";
import { assertFutureStartTime, createSessionService } from "./services/session.service";
import { ServiceError } from "./services/errors";
import { writeLog } from "./logger";
import { createRateLimiter } from "./rate-limit";

export const apiRouter = Router();
const authRateLimit = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });

const profileSchema = z.object({
  schoolOrUniversity: z.string().trim().min(1, "Nama sekolah atau kampus wajib diisi.").max(120),
  favoriteSubjects: z.array(z.string().trim().min(1)).max(20),
  preferredLocation: z.string().trim().min(1, "Lokasi pilihan wajib diisi.").max(120)
});
const sessionSchema = z.object({
  title: z.string().trim().min(3).max(120),
  subject: z.string().trim().min(1).max(80),
  startTime: z.string().datetime(),
  location: z.string().trim().min(2).max(160),
  capacity: z.number().int().min(2).max(100)
});
function sessionInclude() {
  return {
    creator: { select: { id: true, name: true } },
    participants: {
      orderBy: { joinedAt: "asc" as const },
      include: { user: { select: { id: true, name: true } } }
    },
    _count: { select: { participants: true } }
  };
}

function mapSession(session: {
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
}): StudySession {
  return {
    id: session.id,
    creatorId: session.creatorId,
    title: session.title,
    subject: session.subject,
    startTime: session.startTime.toISOString(),
    location: session.location,
    capacity: session.capacity,
    createdAt: session.createdAt.toISOString(),
    creator: session.creator,
    participants: session.participants.map((participant) => ({
      id: participant.id,
      sessionId: participant.sessionId,
      userId: participant.userId,
      joinedAt: participant.joinedAt.toISOString(),
      user: participant.user
    })),
    participantCount: session._count.participants,
    capacityStatus:
      session._count.participants >= session.capacity ? CapacityStatus.Full : CapacityStatus.Open
  };
}

function getUserId(request: AuthenticatedRequest): string {
  if (!request.userId) {
    throw new Error("Identitas pengguna tidak tersedia.");
  }
  return request.userId;
}

const authService = createAuthService(prisma, { createToken });
const sessionService = createSessionService((data) =>
  prisma.studySession.create({ data, include: sessionInclude() })
);
const exploreService = createExploreService((where) =>
  prisma.studySession.findMany({ where, include: sessionInclude(), orderBy: { startTime: "asc" } })
);
const participantService = createParticipantService(prisma);
const chatService = createChatService(
  (sessionId, userId) =>
    prisma.sessionParticipant.findUnique({
      where: { sessionId_userId: { sessionId, userId } }
    }),
  (data) =>
    prisma.chatMessage.create({
      data,
      include: { sender: { select: { id: true, name: true } } }
    })
);

function sendValidationError(response: import("express").Response, error: z.ZodError): void {
  response.status(400).json({ error: error.issues[0]?.message ?? "Data yang dimasukkan tidak valid." });
}

function handleServiceError(
  error: unknown,
  response: import("express").Response,
  next: import("express").NextFunction
): void {
  if (error instanceof ServiceError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }
  next(error);
}

apiRouter.post("/auth/register", authRateLimit, async (request, response, next) => {
  try {
    const result = await authService.register(request.body);
    void writeLog({
      level: "info",
      event: "auth.register.succeeded",
      statusCode: 201
    }).catch(() => console.error("Gagal menyimpan log diagnostik."));
    response.status(201).json({ data: { token: result.token, user: mapUser(result.user) } });
  } catch (error) {
    void writeLog({
      level: error instanceof ServiceError && error.statusCode < 500 ? "warn" : "error",
      event: "auth.register.failed",
      statusCode: error instanceof ServiceError ? error.statusCode : 500,
      errorType: error instanceof Error ? error.name : "UnknownError"
    }).catch(() => console.error("Gagal menyimpan log diagnostik."));
    handleServiceError(error, response, next);
  }
});

apiRouter.post("/auth/login", authRateLimit, async (request, response, next) => {
  try {
    const result = await authService.login(request.body);
    void writeLog({
      level: "info",
      event: "auth.login.succeeded",
      statusCode: 200
    }).catch(() => console.error("Gagal menyimpan log diagnostik."));
    response.json({ data: { token: result.token, user: mapUser(result.user) } });
  } catch (error) {
    void writeLog({
      level: error instanceof ServiceError && error.statusCode < 500 ? "warn" : "error",
      event: "auth.login.failed",
      statusCode: error instanceof ServiceError ? error.statusCode : 500,
      errorType: error instanceof Error ? error.name : "UnknownError"
    }).catch(() => console.error("Gagal menyimpan log diagnostik."));
    handleServiceError(error, response, next);
  }
});

apiRouter.use(requireAuth);

apiRouter.get("/users/me", async (request: AuthenticatedRequest, response, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: getUserId(request) } });
    if (!user) {
      response.status(404).json({ error: "Pengguna tidak ditemukan." });
      return;
    }
    response.json({ data: mapUser(user) });
  } catch (error) {
    next(error);
  }
});

apiRouter.put("/users/me", async (request: AuthenticatedRequest, response, next) => {
  const parsed = profileSchema.safeParse(request.body);
  if (!parsed.success) {
    sendValidationError(response, parsed.error);
    return;
  }
  try {
    const user = await prisma.user.update({
      where: { id: getUserId(request) },
      data: parsed.data
    });
    response.json({ data: mapUser(user) });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/sessions", async (request, response, next) => {
  try {
    const sessions = await exploreService.search({
      subject: typeof request.query.subject === "string" ? request.query.subject : undefined,
      location: typeof request.query.location === "string" ? request.query.location : undefined,
      search: typeof request.query.search === "string" ? request.query.search : undefined
    });
    response.json({ data: sessions.map(mapSession) });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/sessions/mine", async (request: AuthenticatedRequest, response, next) => {
  try {
    const sessions = await prisma.studySession.findMany({
      where: { participants: { some: { userId: getUserId(request) } } },
      include: sessionInclude(),
      orderBy: { startTime: "asc" }
    });
    response.json({ data: sessions.map(mapSession) });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/sessions", async (request: AuthenticatedRequest, response, next) => {
  try {
    const session = await sessionService.create(getUserId(request), request.body);
    void writeLog({
      level: "info",
      event: "session.created",
      statusCode: 201
    }).catch(() => console.error("Gagal menyimpan log diagnostik."));
    response.status(201).json({ data: mapSession(session) });
  } catch (error) {
    handleServiceError(error, response, next);
  }
});

apiRouter.get("/sessions/:Id", async (request, response, next) => {
  try {
    const session = await prisma.studySession.findUnique({
      where: { id: request.params.Id },
      include: sessionInclude()
    });
    if (!session) {
      response.status(404).json({ error: "Sesi belajar tidak ditemukan." });
      return;
    }
    response.json({ data: mapSession(session) });
  } catch (error) {
    next(error);
  }
});

apiRouter.put("/sessions/:Id", async (request: AuthenticatedRequest, response, next) => {
  const parsed = sessionSchema.partial().safeParse(request.body);
  if (!parsed.success) {
    sendValidationError(response, parsed.error);
    return;
  }
  if (Object.keys(parsed.data).length === 0) {
    response.status(400).json({ error: "Tidak ada perubahan yang dikirim." });
    return;
  }
  try {
    if (parsed.data.startTime) {
      assertFutureStartTime(parsed.data.startTime);
    }
    const session = await prisma.$transaction(
      async (transaction) => {
        const current = await transaction.studySession.findUnique({
          where: { id: request.params.Id },
          include: { _count: { select: { participants: true } } }
        });
        if (!current) {
          throw new ServiceError("Sesi belajar tidak ditemukan.", 404);
        }
        if (current.creatorId !== getUserId(request)) {
          throw new ServiceError("Hanya pembuat sesi yang dapat mengubahnya.", 403);
        }
        if (parsed.data.capacity !== undefined && parsed.data.capacity < current._count.participants) {
          throw new ServiceError("Kapasitas tidak boleh kurang dari jumlah peserta saat ini.", 400);
        }
        return transaction.studySession.update({
          where: { id: request.params.Id },
          data: {
            ...parsed.data,
            ...(parsed.data.startTime ? { startTime: new Date(parsed.data.startTime) } : {})
          },
          include: sessionInclude()
        });
      },
      { isolationLevel: "Serializable" }
    );
    response.json({ data: mapSession(session) });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") {
      response.status(409).json({ error: "Sesi berubah saat kamu mengubahnya. Silakan coba lagi." });
      return;
    }
    handleServiceError(error, response, next);
  }
});

apiRouter.delete("/sessions/:Id", async (request: AuthenticatedRequest, response, next) => {
  try {
    const session = await prisma.studySession.findUnique({ where: { id: request.params.Id } });
    if (!session) {
      response.status(404).json({ error: "Sesi belajar tidak ditemukan." });
      return;
    }
    if (session.creatorId !== getUserId(request)) {
      response.status(403).json({ error: "Hanya pembuat sesi yang dapat menghapusnya." });
      return;
    }
    await prisma.studySession.delete({ where: { id: session.id } });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/sessions/:Id/join", async (request: AuthenticatedRequest, response, next) => {
  try {
    const sessionId = request.params.Id;
    const userId = getUserId(request);
    await participantService.join(sessionId, userId);
    const session = await prisma.studySession.findUniqueOrThrow({
      where: { id: sessionId },
      include: sessionInclude()
    });
    response.json({ data: mapSession(session) });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") {
      response.status(409).json({ error: "Sesi berubah saat kamu bergabung. Silakan coba lagi." });
      return;
    }
    handleServiceError(error, response, next);
  }
});

apiRouter.get("/sessions/:Id/messages", async (request: AuthenticatedRequest, response, next) => {
  try {
    const sessionId = request.params.Id;
    const participant = await prisma.sessionParticipant.findUnique({
      where: { sessionId_userId: { sessionId, userId: getUserId(request) } }
    });
    if (!participant) {
      response.status(403).json({ error: "Hanya anggota sesi yang dapat melihat obrolan." });
      return;
    }
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { sentAt: "asc" },
      take: 200
    });
    const data: ChatMessage[] = messages.map((message: (typeof messages)[number]) => ({
      id: message.id,
      sessionId: message.sessionId,
      senderId: message.senderId,
      message: message.message,
      sentAt: message.sentAt.toISOString(),
      sender: message.sender
    }));
    response.json({ data });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/sessions/:Id/messages", async (request: AuthenticatedRequest, response, next) => {
  try {
    const sessionId = request.params.Id;
    const senderId = getUserId(request);
    const message = await chatService.send(sessionId, senderId, request.body?.message);
    response.status(201).json({
      data: {
        id: message.id,
        sessionId: message.sessionId,
        senderId: message.senderId,
        message: message.message,
        sentAt: message.sentAt.toISOString(),
        sender: message.sender
      } satisfies ChatMessage
    });
  } catch (error) {
    handleServiceError(error, response, next);
  }
});
