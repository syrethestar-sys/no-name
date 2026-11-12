CREATE TYPE "public"."storage_provider" AS ENUM('supabase', 'r2');--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "storage_provider" "storage_provider" DEFAULT 'supabase' NOT NULL;