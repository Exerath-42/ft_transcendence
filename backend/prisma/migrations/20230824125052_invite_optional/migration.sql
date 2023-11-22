-- DropForeignKey
ALTER TABLE "GameInvitation" DROP CONSTRAINT "GameInvitation_inviteeId_fkey";

-- AlterTable
ALTER TABLE "GameInvitation" ALTER COLUMN "inviteeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "GameInvitation" ADD CONSTRAINT "GameInvitation_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
