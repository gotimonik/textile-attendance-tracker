import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyPin } from "@/lib/worker-auth";

type AuthorizedAdmin = {
  role: "admin";
  id: string;
  name: string;
  username: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
};

type AuthorizedWorker = {
  role: "worker";
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
};

type AuthorizedUser = AuthorizedAdmin | AuthorizedWorker;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "admin-login",
      name: "Admin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.adminUser.findUnique({
          where: { username: credentials.username },
          include: { organization: true },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        const authorized: AuthorizedAdmin = {
          role: "admin",
          id: user.id,
          name: user.name,
          username: user.username,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
          organizationSlug: user.organization.slug,
        };
        return authorized as unknown as AuthorizedAdmin & { id: string };
      },
    }),
    CredentialsProvider({
      id: "worker-login",
      name: "Worker",
      credentials: {
        code: { label: "Invite code", type: "text" },
        phone: { label: "Phone", type: "text" },
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.code || !credentials?.phone || !credentials?.pin) {
          return null;
        }

        const organization = await prisma.organization.findUnique({
          where: { inviteCode: credentials.code },
        });
        if (!organization) {
          throw new Error("ORG_NOT_FOUND");
        }

        const phoneDigits = credentials.phone.replace(/\D/g, "");
        const worker = await prisma.worker.findFirst({
          where: { organizationId: organization.id, phone: phoneDigits },
          include: { department: true },
        });

        if (!worker || !worker.pinHash) return null;

        const isValid = await verifyPin(credentials.pin, worker.pinHash);
        if (!isValid) return null;

        if (worker.approvalStatus === "PENDING") {
          throw new Error("PENDING_APPROVAL");
        }
        if (worker.approvalStatus === "REJECTED") {
          throw new Error("REJECTED");
        }
        if (!worker.isActive) {
          throw new Error("INACTIVE");
        }

        const authorized: AuthorizedWorker = {
          role: "worker",
          id: worker.id,
          name: worker.name,
          departmentId: worker.departmentId,
          departmentName: worker.department.name,
          organizationId: organization.id,
          organizationName: organization.name,
          organizationSlug: organization.slug,
        };
        return authorized as unknown as AuthorizedWorker & { id: string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as AuthorizedUser;
        token.role = u.role;
        token.id = u.id;
        token.organizationId = u.organizationId;
        token.organizationName = u.organizationName;
        token.organizationSlug = u.organizationSlug;

        if (u.role === "admin") {
          token.name = u.name;
          token.username = u.username;
        } else {
          token.name = u.name;
          token.departmentId = u.departmentId;
          token.departmentName = u.departmentName;
          // Clear any admin-only claim that might linger from a previous token shape.
          token.username = undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        Object.assign(session.user, {
          role: token.role,
          id: token.id,
          username: token.username,
          organizationId: token.organizationId,
          organizationName: token.organizationName,
          organizationSlug: token.organizationSlug,
          departmentId: token.departmentId,
          departmentName: token.departmentName,
        });
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
