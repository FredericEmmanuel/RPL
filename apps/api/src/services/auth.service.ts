import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { ServiceError } from "./errors";

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

type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  schoolOrUniversity: string | null;
  favoriteSubjects: string[];
  preferredLocation: string | null;
  createdAt: Date;
};

export interface AuthPrisma {
  user: {
    findUnique(args: { where: { email: string } }): Promise<UserRecord | null>;
    create(args: {
      data: {
        name: string;
        email: string;
        passwordHash: string;
        schoolOrUniversity?: string | null;
        favoriteSubjects?: string[];
        preferredLocation?: string | null;
      };
    }): Promise<UserRecord>;
  };
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET belum diatur.");
  }
  return secret;
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export function createAuthService(
  prisma: AuthPrisma,
  options: {
    hashPassword?: (password: string) => Promise<string>;
    comparePassword?: (password: string, hash: string) => Promise<boolean>;
    createToken?: (userId: string) => string;
  } = {}
) {
  const hashPassword = options.hashPassword ?? ((password: string) => bcrypt.hash(password, 12));
  const comparePassword = options.comparePassword ?? bcrypt.compare;
  const createToken = options.createToken ?? ((userId: string) =>
    jwt.sign({ userId }, getJwtSecret(), { expiresIn: "7d" }));

  return {
    async register(input: unknown) {
      const parsed = registerSchema.safeParse(input);
      if (!parsed.success) {
        throw new ServiceError(parsed.error.issues[0]?.message ?? "Data pendaftaran tidak valid.", 400);
      }
      const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
      if (existingUser) {
        throw new ServiceError("Email tersebut sudah terdaftar.", 409);
      }
      const { password, ...profile } = parsed.data;
      let user: UserRecord;
      try {
        user = await prisma.user.create({
          data: {
            ...profile,
            passwordHash: await hashPassword(password),
            schoolOrUniversity: profile.schoolOrUniversity || null,
            preferredLocation: profile.preferredLocation || null
          }
        });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new ServiceError("Email tersebut sudah terdaftar.", 409);
        }
        throw error;
      }
      return { token: createToken(user.id), user };
    },

    async login(input: unknown) {
      const parsed = loginSchema.safeParse(input);
      if (!parsed.success) {
        throw new ServiceError(parsed.error.issues[0]?.message ?? "Data masuk tidak valid.", 400);
      }
      const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
      if (!user || !(await comparePassword(parsed.data.password, user.passwordHash))) {
        throw new ServiceError("Email atau kata sandi tidak sesuai.", 401);
      }
      return { token: createToken(user.id), user };
    }
  };
}
