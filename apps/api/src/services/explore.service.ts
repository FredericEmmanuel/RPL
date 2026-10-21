import type { Prisma } from "@prisma/client";
import type { SessionRecord } from "./session.service";

export type SessionSearch = (where: Prisma.StudySessionWhereInput) => Promise<SessionRecord[]>;

export function createExploreService(findSessions: SessionSearch) {
  return {
    async search(filters: { subject?: string; location?: string; search?: string }) {
      const subject = filters.subject?.trim() ?? "";
      const location = filters.location?.trim() ?? "";
      const search = filters.search?.trim() ?? "";
      return findSessions({
        ...(subject ? { subject: { equals: subject, mode: "insensitive" } } : {}),
        ...(location ? { location: { contains: location, mode: "insensitive" } } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { subject: { contains: search, mode: "insensitive" } },
                { location: { contains: search, mode: "insensitive" } }
              ]
            }
          : {})
      });
    }
  };
}
