import { ServiceError } from "./errors";

export interface ChatMessageRecord {
  id: string;
  sessionId: string;
  senderId: string;
  message: string;
  sentAt: Date;
  sender: { id: string; name: string };
}

export function createChatService(
  findParticipant: (sessionId: string, userId: string) => Promise<{ id: string } | null>,
  createMessage: (data: { sessionId: string; senderId: string; message: string }) => Promise<ChatMessageRecord>
) {
  return {
    async send(sessionId: string, senderId: string, input: unknown) {
      if (typeof input !== "string") {
        throw new ServiceError("Pesan harus berisi 1–2000 karakter.", 400);
      }
      const message = input.trim();
      if (message.length < 1 || message.length > 2000) {
        throw new ServiceError("Pesan harus berisi 1–2000 karakter.", 400);
      }
      const participant = await findParticipant(sessionId, senderId);
      if (!participant) {
        throw new ServiceError("Hanya anggota sesi yang dapat mengirim pesan.", 403);
      }
      return createMessage({ sessionId, senderId, message });
    }
  };
}
