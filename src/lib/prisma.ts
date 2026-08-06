// src/lib/prisma.ts
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load local .env (or other env files) early so Prisma can read DATABASE_URL
dotenv.config();

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
export { prisma };