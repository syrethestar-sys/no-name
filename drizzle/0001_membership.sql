CREATE TYPE "public"."member_interest" AS ENUM('trading', 'coding', 'sharing', 'other');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."video_topic" AS ENUM('trading', 'coding', 'life');--> statement-breakpoint
CREATE TYPE "public"."video_visibility" AS ENUM('public', 'members');--> statement-breakpoint
CREATE TABLE "members" (
	"user_id" text PRIMARY KEY NOT NULL,
	"status" "member_status" DEFAULT 'pending' NOT NULL,
	"interests" "member_interest"[] DEFAULT '{}' NOT NULL,
	"intro" text NOT NULL,
	"link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "members_intro_length" CHECK (char_length("members"."intro") between 20 and 1000)
);
--> statement-breakpoint
ALTER TABLE "members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "visibility" "video_visibility" DEFAULT 'members' NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "topic" "video_topic" DEFAULT 'life' NOT NULL;--> statement-breakpoint
CREATE INDEX "members_status_created_idx" ON "members" USING btree ("status","created_at");