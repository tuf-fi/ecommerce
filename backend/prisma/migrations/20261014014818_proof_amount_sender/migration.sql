-- AlterTable
ALTER TABLE "PaymentProof" ADD COLUMN     "amount" INTEGER,
ADD COLUMN     "senderName" TEXT;

-- CreateIndex
CREATE INDEX "PaymentProof_reference_idx" ON "PaymentProof"("reference");
