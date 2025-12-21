-- Verify and fix gifts table structure and RLS policies
-- This ensures gifts table works correctly with auth.users

-- First, ensure post_id column exists (from migration 14)
ALTER TABLE public.gifts
ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE;

-- Create index for post_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_gifts_post_id ON public.gifts(post_id);

-- First, ensure foreign keys reference auth.users (in case migration 16 wasn't run)
DO $$
BEGIN
  -- Drop existing foreign key constraints if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'gifts_gifter_id_fkey' 
    AND table_name = 'gifts'
  ) THEN
    ALTER TABLE public.gifts DROP CONSTRAINT gifts_gifter_id_fkey;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'gifts_recipient_id_fkey' 
    AND table_name = 'gifts'
  ) THEN
    ALTER TABLE public.gifts DROP CONSTRAINT gifts_recipient_id_fkey;
  END IF;
END $$;

-- Recreate foreign keys to reference auth.users directly
ALTER TABLE public.gifts
ADD CONSTRAINT gifts_gifter_id_fkey
FOREIGN KEY (gifter_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.gifts
ADD CONSTRAINT gifts_recipient_id_fkey
FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure RLS is enabled
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- Drop and recreate SELECT policy to ensure it's correct
DROP POLICY IF EXISTS "Gifts are viewable by recipient" ON public.gifts;

CREATE POLICY "Gifts are viewable by recipient" ON public.gifts
  FOR SELECT
  USING (auth.uid() = recipient_id);

-- Ensure INSERT policy allows gifts from posts (in case migration 14 wasn't run)
DROP POLICY IF EXISTS "Users can create gifts" ON public.gifts;
DROP POLICY IF EXISTS "Users can create gifts to mutual connections" ON public.gifts;

CREATE POLICY "Users can create gifts" ON public.gifts
  FOR INSERT
  WITH CHECK (
    auth.uid() = gifter_id
    AND (
      -- Allow if mutual connection (existing behavior)
      (
        EXISTS (
          SELECT 1 FROM public.connections c1
          WHERE c1.user_id = auth.uid()
          AND c1.connected_user_id = recipient_id
        )
        AND EXISTS (
          SELECT 1 FROM public.connections c2
          WHERE c2.user_id = recipient_id
          AND c2.connected_user_id = auth.uid()
        )
      )
      -- OR if gift is from a post (new behavior - no connection required)
      OR post_id IS NOT NULL
    )
  );
