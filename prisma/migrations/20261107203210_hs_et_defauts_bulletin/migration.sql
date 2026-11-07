-- AlterTable
ALTER TABLE "User" ADD COLUMN     "overtimeMult" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
ALTER COLUMN "nightMult" SET DEFAULT 0.1,
ALTER COLUMN "sundayMult" SET DEFAULT 0.1,
ALTER COLUMN "netRatio" SET DEFAULT 0.78;

-- AlterTable
ALTER TABLE "WorkShift" ADD COLUMN     "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "overtimePay" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Aligner les réglages existants encore aux anciens défauts (cf. bulletin JDM Sécurité oct. 2026) :
-- majorations nuit/dimanche réelles = +10%, ratio net réel = 0,78.
UPDATE "User" SET "nightMult"  = 0.1  WHERE "nightMult"  = 0.2;
UPDATE "User" SET "sundayMult" = 0.1  WHERE "sundayMult" = 0.2;
UPDATE "User" SET "netRatio"   = 0.78 WHERE "netRatio"   = 0.77;
