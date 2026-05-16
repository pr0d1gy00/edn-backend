-- CreateEnum
CREATE TYPE "PlatformType" AS ENUM ('YOUTUBE', 'SPOTIFY', 'PATREON');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('AVAILABLE', 'FEW_TICKETS', 'SOLD_OUT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "bio" TEXT,
    "twitter_handle" VARCHAR(50),
    "instagram_handle" VARCHAR(50),

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" UUID NOT NULL,
    "episode_number" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "platform_type" "PlatformType" NOT NULL,
    "content_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "published_at" DATE NOT NULL,
    "is_exclusive" BOOLEAN NOT NULL DEFAULT false,
    "duration_seconds" INTEGER,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inside_jokes" (
    "id" UUID NOT NULL,
    "episode_id" UUID NOT NULL,
    "start_timestamp" TEXT NOT NULL,
    "end_timestamp" TEXT,
    "key_concept" VARCHAR(100) NOT NULL,
    "transcript_context" TEXT NOT NULL,

    CONSTRAINT "inside_jokes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_shows" (
    "id" UUID NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "venue_name" VARCHAR(150) NOT NULL,
    "show_date" TIMESTAMPTZ NOT NULL,
    "ticket_url" TEXT,
    "ticket_status" "TicketStatus" NOT NULL DEFAULT 'AVAILABLE',
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),

    CONSTRAINT "tour_shows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_stories" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "title" VARCHAR(150) NOT NULL,
    "content" TEXT NOT NULL,
    "category" VARCHAR(50),
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "community_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_votes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "vote_value" INTEGER NOT NULL,

    CONSTRAINT "story_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EpisodeGuests" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_EpisodeGuests_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_episode_number_key" ON "episodes"("episode_number");

-- CreateIndex
CREATE UNIQUE INDEX "story_votes_user_id_story_id_key" ON "story_votes"("user_id", "story_id");

-- CreateIndex
CREATE INDEX "_EpisodeGuests_B_index" ON "_EpisodeGuests"("B");

-- AddForeignKey
ALTER TABLE "inside_jokes" ADD CONSTRAINT "inside_jokes_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_stories" ADD CONSTRAINT "community_stories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_votes" ADD CONSTRAINT "story_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_votes" ADD CONSTRAINT "story_votes_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "community_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EpisodeGuests" ADD CONSTRAINT "_EpisodeGuests_A_fkey" FOREIGN KEY ("A") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EpisodeGuests" ADD CONSTRAINT "_EpisodeGuests_B_fkey" FOREIGN KEY ("B") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
