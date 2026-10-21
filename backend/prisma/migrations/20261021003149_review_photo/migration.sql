-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "hasPhoto" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ReviewPhoto" (
    "reviewId" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "ReviewPhoto_pkey" PRIMARY KEY ("reviewId")
);

-- AddForeignKey
ALTER TABLE "ReviewPhoto" ADD CONSTRAINT "ReviewPhoto_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
