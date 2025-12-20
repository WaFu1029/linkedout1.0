-- Add inventory column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN public.profiles.inventory IS 'Array of inventory items: [{ emoji: string, count: number }]';
