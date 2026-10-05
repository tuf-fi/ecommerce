/*
  Warnings:

  - You are about to drop the `PaymentSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WebhookEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ProofStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "PaymentSession" DROP CONSTRAINT "PaymentSession_orderId_fkey";

-- DropTable
DROP TABLE "PaymentSession";

-- DropTable
DROP TABLE "WebhookEvent";

-- CreateTable
CREATE TABLE "PaymentProof" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" "ProofStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "reviewedById" INTEGER,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentProof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofFile" (
    "proofId" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "ProofFile_pkey" PRIMARY KEY ("proofId")
);

-- CreateIndex
CREATE INDEX "PaymentProof_orderId_createdAt_idx" ON "PaymentProof"("orderId", "createdAt");

-- AddForeignKey
ALTER TABLE "PaymentProof" ADD CONSTRAINT "PaymentProof_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofFile" ADD CONSTRAINT "ProofFile_proofId_fkey" FOREIGN KEY ("proofId") REFERENCES "PaymentProof"("id") ON DELETE CASCADE ON UPDATE CASCADE;
