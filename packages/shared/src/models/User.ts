export interface User {
  id: string;
  name: string;
  email: string;
  schoolOrUniversity: string | null;
  favoriteSubjects: string[];
  preferredLocation: string | null;
  createdAt: string;
}

export type UserSummary = Pick<User, "id" | "name">;
