ALTER TYPE "public"."storage_provider" ADD VALUE 'youtube';--> statement-breakpoint
ALTER TABLE "videos" ALTER COLUMN "storage_path" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "youtube_id" text;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_file_or_youtube" CHECK (("videos"."storage_provider"::text = 'youtube' and "videos"."youtube_id" is not null)
        or ("videos"."storage_provider"::text <> 'youtube' and "videos"."storage_path" is not null));