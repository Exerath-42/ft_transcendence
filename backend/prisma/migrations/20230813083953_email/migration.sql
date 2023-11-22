/*
  Warnings:

  - A unique constraint covering the columns `[student_email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `student_email` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "student_email" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_student_email_key" ON "users"("student_email");
