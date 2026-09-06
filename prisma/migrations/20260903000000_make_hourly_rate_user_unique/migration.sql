-- DropIndex
DROP INDEX "HourlyRate_userId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "HourlyRate_userId_key" ON "HourlyRate"("userId");
