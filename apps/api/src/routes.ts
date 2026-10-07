import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { CapacityStatus, type ChatMessage, type StudySession } from "@studybuddy/shared";
import { createToken, mapUser, requireAuth, type AuthenticatedRequest } from "./auth";
import { prisma } from "./db";

export const apiRouter = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter."),
  email: z.string().trim().email("Format email tidak valid.").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
  schoolOrUniversity: z.string().trim().max(120).optional(),
  favoriteSubjects: z.array(z.string().trim().min(1)).max(20).optional(),
  preferredLocation: z.string().trim().max(120).optional()
});
const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1)
});
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
const messageSchema = z.object({ message: z.string().trim().min(1).max(2000) });

function sendValidationError(response: import("express").Response, error: z.ZodError): void {
  response.status(400).json({ error: error.issues[0]?.message ?? "Data yang dimasukkan tidak valid." });
}

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

apiRouter.post("/auth/register", async (request, response, next) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) {
    sendValidationError(response, parsed.error);
    return;
  }
  try {
    const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existingUser) {
      response.status(409).json({ error: "Email tersebut sudah terdaftar." });
      return;
    }
    const { password, ...profile } = parsed.data;
    const user = await prisma.user.create({
      data: {
        ...profile,
        passwordHash: await bcrypt.hash(password, 12),
        schoolOrUniversity: profile.schoolOrUniversity || null,
        preferredLocation: profile.preferredLocation || null
      }
    });
    response.status(201).json({ data: { token: createToken(user.id), user: mapUser(user) } });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/auth/login", async (request, response, next) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) {
    sendValidationError(response, parsed.error);
    return;
  }
  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      response.status(401).json({ error: "Email atau kata sandi tidak sesuai." });
      return;
    }
    response.json({ data: { token: createToken(user.id), user: mapUser(user) } });
  } catch (error) {
    next(error);
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
    const subject = typeof request.query.subject === "string" ? request.query.subject.trim() : "";
    const location = typeof request.query.location === "string" ? request.query.location.trim() : "";
    const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
    const sessions = await prisma.studySession.findMany({
      where: {
        ...(subject ? { subject: { equals: subject, mode: "insensitive" as const } } : {}),
        ...(location ? { location: { contains: location, mode: "insensitive" as const } } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" as const } },
                { subject: { contains: search, mode: "insensitive" as const } },
                { location: { contains: search, mode: "insensitive" as const } }
              ]
            }
          : {})
      },
      include: sessionInclude(),
      orderBy: { startTime: "asc" }
    });
    response.json({ data: sessions.map(mapSession) });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/sessions", async (request: AuthenticatedRequest, response, next) => {
  const parsed = sessionSchema.safeParse(request.body);
  if (!parsed.success) {
    sendValidationError(response, parsed.error);
    return;
  }
  try {
    const session = await prisma.studySession.create({
      data: {
        ...parsed.data,
        startTime: new Date(parsed.data.startTime),
        creatorId: getUserId(request),
        participants: { create: { userId: getUserId(request) } }
      },
      include: sessionInclude()
    });
    response.status(201).json({ data: mapSession(session) });
  } catch (error) {
    next(error);
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
    const current = await prisma.studySession.findUnique({
      where: { id: request.params.Id },
      include: { _count: { select: { participants: true } } }
    });
    if (!current) {
      response.status(404).json({ error: "Sesi belajar tidak ditemukan." });
      return;
    }
    if (current.creatorId !== getUserId(request)) {
      response.status(403).json({ error: "Hanya pembuat sesi yang dapat mengubahnya." });
      return;
    }
    if (parsed.data.capacity !== undefined && parsed.data.capacity < current._count.participants) {
      response.status(400).json({ error: "Kapasitas tidak boleh kurang dari jumlah peserta saat ini." });
      return;
    }
    const session = await prisma.studySession.update({
      where: { id: request.params.Id },
      data: {
        ...parsed.data,
        ...(parsed.data.startTime ? { startTime: new Date(parsed.data.startTime) } : {})
      },
      include: sessionInclude()
    });
    response.json({ data: mapSession(session) });
  } catch (error) {
    next(error);
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
    const joined = await prisma.$transaction(
      async (transaction) => {
        const session = await transaction.studySession.findUnique({
          where: { id: sessionId },
          include: { _count: { select: { participants: true } } }
        });
        if (!session) {
          return { error: "Sesi belajar tidak ditemukan.", status: 404 as const };
        }
        const existing = await transaction.sessionParticipant.findUnique({
          where: { sessionId_userId: { sessionId, userId } }
        });
        if (existing) {
          return { error: "Kamu sudah bergabung dalam sesi ini.", status: 409 as const };
        }
        if (session._count.participants >= session.capacity) {
          return { error: "Maaf, kapasitas sesi ini sudah penuh.", status: 409 as const };
        }
        await transaction.sessionParticipant.create({ data: { sessionId, userId } });
        return { status: 200 as const };
      },
      { isolationLevel: "Serializable" }
    );
    if ("error" in joined) {
      response.status(joined.status).json({ error: joined.error });
      return;
    }
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
    next(error);
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
    const data: ChatMessage[] = messages.map((message) => ({
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
  const parsed = messageSchema.safeParse(request.body);
  if (!parsed.success) {
    sendValidationError(response, parsed.error);
    return;
  }
  try {
    const sessionId = request.params.Id;
    const senderId = getUserId(request);
    const participant = await prisma.sessionParticipant.findUnique({
      where: { sessionId_userId: { sessionId, userId: senderId } }
    });
    if (!participant) {
      response.status(403).json({ error: "Hanya anggota sesi yang dapat mengirim pesan." });
      return;
    }
    const message = await prisma.chatMessage.create({
      data: { sessionId, senderId, message: parsed.data.message },
      include: { sender: { select: { id: true, name: true } } }
    });
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
    next(error);
  }
});
