-- CreateTable
CREATE TABLE "story_prompts" (
    "id" UUID NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "is_open" BOOLEAN NOT NULL DEFAULT false,
    "opens_at" TIMESTAMPTZ,
    "closes_at" TIMESTAMPTZ,

    CONSTRAINT "story_prompts_pkey" PRIMARY KEY ("id")
);

-- AddColumn (antes del FK, la columna debe existir)
ALTER TABLE "community_stories" ADD COLUMN "prompt_id" UUID;

-- AddForeignKey
ALTER TABLE "community_stories" ADD CONSTRAINT "community_stories_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "story_prompts"("id") ON DELETE SET NULL ON UPDATE CASCADE;