/*
  Warnings:

  - You are about to drop the column `hash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `student_id` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_student_id_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "hash",
DROP COLUMN "student_id";
