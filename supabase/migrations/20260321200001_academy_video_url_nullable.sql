-- Allow videos without a URL (placeholder for upcoming content)
ALTER TABLE academy_videos ALTER COLUMN video_url DROP NOT NULL;
