-- AlterEnum
ALTER TYPE "Gender" ADD VALUE 'self_described';

-- AlterTable
ALTER TABLE "companions" ADD COLUMN     "gender" "Gender";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "genderSelfDescribed" TEXT,
ADD COLUMN     "sameGenderOnly" BOOLEAN NOT NULL DEFAULT false;
