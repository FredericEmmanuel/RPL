import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("belajar123", 10);
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "alya@studybuddy.id" },
      update: {},
      create: {
        name: "Alya Putri",
        email: "alya@studybuddy.id",
        passwordHash,
        schoolOrUniversity: "SMA Negeri 8 Jakarta",
        favoriteSubjects: ["Matematika", "Fisika"],
        preferredLocation: "Jakarta Selatan"
      }
    }),
    prisma.user.upsert({
      where: { email: "bima@studybuddy.id" },
      update: {},
      create: {
        name: "Bima Pratama",
        email: "bima@studybuddy.id",
        passwordHash,
        schoolOrUniversity: "Universitas Indonesia",
        favoriteSubjects: ["Matematika", "Informatika"],
        preferredLocation: "Depok"
      }
    }),
    prisma.user.upsert({
      where: { email: "citra@studybuddy.id" },
      update: {},
      create: {
        name: "Citra Maharani",
        email: "citra@studybuddy.id",
        passwordHash,
        schoolOrUniversity: "Universitas Indonesia",
        favoriteSubjects: ["Biologi", "Kimia"],
        preferredLocation: "Depok"
      }
    })
  ]);

  const [alya, bima, citra] = users;
  const sessions = await Promise.all([
    prisma.studySession.upsert({
      where: { id: "seed-session-matematika" },
      update: {},
      create: {
        id: "seed-session-matematika",
        creatorId: alya.id,
        title: "Persiapan Ujian Kalkulus",
        subject: "Matematika",
        startTime: new Date(Date.now() + 86_400_000),
        location: "Perpustakaan UI, Depok",
        capacity: 5
      }
    }),
    prisma.studySession.upsert({
      where: { id: "seed-session-biologi" },
      update: {},
      create: {
        id: "seed-session-biologi",
        creatorId: citra.id,
        title: "Belajar Sistem Sel",
        subject: "Biologi",
        startTime: new Date(Date.now() + 172_800_000),
        location: "Kafe Taman, Depok",
        capacity: 4
      }
    })
  ]);

  for (const [session, user] of [
    [sessions[0], alya],
    [sessions[0], bima],
    [sessions[1], citra],
    [sessions[1], bima]
  ]) {
    await prisma.sessionParticipant.upsert({
      where: { sessionId_userId: { sessionId: session.id, userId: user.id } },
      update: {},
      create: { sessionId: session.id, userId: user.id }
    });
  }

  await prisma.chatMessage.createMany({
    data: [
      {
        id: "seed-message-math-1",
        sessionId: sessions[0].id,
        senderId: alya.id,
        message: "Hai! Kita mulai dari latihan limit, ya."
      },
      {
        id: "seed-message-math-2",
        sessionId: sessions[0].id,
        senderId: bima.id,
        message: "Siap, aku sudah menyiapkan catatan."
      },
      {
        id: "seed-message-bio-1",
        sessionId: sessions[1].id,
        senderId: citra.id,
        message: "Sampai ketemu di perpustakaan!"
      }
    ],
    skipDuplicates: true
  });

  console.log("Data awal StudyBuddy berhasil disiapkan.");
}

main()
  .catch((error: unknown) => {
    console.error("Gagal menyiapkan data awal:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
