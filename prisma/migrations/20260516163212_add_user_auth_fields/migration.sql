-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password" VARCHAR(255),
ADD COLUMN     "refresh_token" VARCHAR(255);
