-- CreateEnum
CREATE TYPE "MediaEntityType" AS ENUM ('TOUR_SHOW', 'EPISODE');

-- CreateTable
CREATE TABLE "media" (
    "id" UUID NOT NULL,
    "entity_type" "MediaEntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_entity_type_entity_id_idx" ON "media"("entity_type", "entity_id");
