import { Role } from "@/generated/prisma";

declare module "better-auth/types" {
  interface User {
    role: Role;
  }
}
