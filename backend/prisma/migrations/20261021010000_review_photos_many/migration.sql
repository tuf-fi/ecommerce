-- A review can carry several photos: give each its own id and order, and drop the single-photo flag.
ALTER TABLE "ReviewPhoto" DROP CONSTRAINT "ReviewPhoto_pkey";
ALTER TABLE "ReviewPhoto" ADD COLUMN "id" SERIAL NOT NULL,
ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "ReviewPhoto_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "ReviewPhoto_reviewId_idx" ON "ReviewPhoto"("reviewId");

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "hasPhoto";
