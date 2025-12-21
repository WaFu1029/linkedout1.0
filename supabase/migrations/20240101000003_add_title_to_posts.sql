-- Add title field to posts table (optional/nullable)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS title TEXT;

-- Rename content to body for clarity (optional - we can keep content if preferred)
-- Actually, let's keep content as is for backward compatibility
-- The title will be optional, and content will serve as the body text








