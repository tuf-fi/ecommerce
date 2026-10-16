import { prisma } from "../lib/prisma";

export const PROOF_RETENTION_DAYS = 90;

// Screenshots show account numbers and names, so the image bytes go once the order is long finished. The proof rows stay.
export async function purgeOldProofImages(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - PROOF_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const { count } = await prisma.proofFile.deleteMany({
    where: { proof: { order: { status: { in: ["DELIVERED", "CANCELLED"] }, updatedAt: { lt: cutoff } } } },
  });
  return count;
}
