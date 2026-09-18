import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role?: "admin" | "worker";
      id?: string;
      username?: string;
      organizationId?: string;
      organizationName?: string;
      organizationSlug?: string;
      departmentId?: string;
      departmentName?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "worker";
    id?: string;
    username?: string;
    organizationId?: string;
    organizationName?: string;
    organizationSlug?: string;
    departmentId?: string;
    departmentName?: string;
  }
}
