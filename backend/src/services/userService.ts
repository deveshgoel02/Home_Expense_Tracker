import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/passwords.js";
import { ConflictError } from "../utils/errors.js";

// Never select passwordHash for anything that reaches the frontend.
export const SAFE_USER_SELECT = {
  id: true,
  name: true,
  initials: true,
  color: true,
  isActive: true,
  mustChangePassword: true,
  createdAt: true,
} as const;

const PALETTE = ["#6366f1", "#ec4899", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#14b8a6", "#f43f5e"];

function deriveInitials(name: string): string {
  const words = name.replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export async function createFamilyMember(input: { name: string; password: string; color?: string }) {
  const existing = await prisma.user.findUnique({ where: { name: input.name } });
  if (existing) throw new ConflictError("A family member with this name already exists");

  const userCount = await prisma.user.count();
  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      name: input.name,
      initials: deriveInitials(input.name),
      color: input.color ?? PALETTE[userCount % PALETTE.length],
      passwordHash,
      mustChangePassword: true,
    },
  });
}
