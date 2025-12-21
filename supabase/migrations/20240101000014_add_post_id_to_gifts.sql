-- Add post_id column to gifts table to track which post the gift came from
ALTER TABLE public.gifts
ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_gifts_post_id ON public.gifts(post_id);

-- Update the insert policy to allow gifts from posts (not just mutual connections)
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



