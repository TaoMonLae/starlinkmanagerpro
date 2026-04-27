import { prisma } from "../config/prisma.js";

export function logActivity({ userId, type, message, metadata }) {
  return prisma.activityLog.create({
    data: { userId, type, message, metadata }
  });
}

