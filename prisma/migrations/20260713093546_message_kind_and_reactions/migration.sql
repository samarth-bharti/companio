-- CreateEnum
CREATE TYPE "MessageKind" AS ENUM ('text', 'sticker');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "kind" "MessageKind" NOT NULL DEFAULT 'text',
ADD COLUMN     "reactions" TEXT[] DEFAULT ARRAY[]::TEXT[];
