-- Update reactions table to use likes and dislikes instead of four reaction types
-- First, drop the old constraint
ALTER TABLE public.reactions DROP CONSTRAINT IF EXISTS reactions_reaction_type_check;

-- Update the constraint to only allow 'like' and 'dislike'
ALTER TABLE public.reactions ADD CONSTRAINT reactions_reaction_type_check 
  CHECK (reaction_type IN ('like', 'dislike'));

-- Update UNIQUE constraint to allow one like OR one dislike per user per post
-- Drop the old unique constraint
ALTER TABLE public.reactions DROP CONSTRAINT IF EXISTS reactions_post_id_user_id_reaction_type_key;

-- Create new unique constraint: one reaction per user per post (but can be either like or dislike)
CREATE UNIQUE INDEX IF NOT EXISTS reactions_post_user_unique ON public.reactions(post_id, user_id);

-- Create followers table
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable Row Level Security on followers table
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Followers policies: everyone can read, authenticated users can create/delete their own follows
CREATE POLICY "Followers are viewable by everyone" ON public.followers
  FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others" ON public.followers
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON public.followers
  FOR DELETE
  USING (auth.uid() = follower_id);

-- Create indexes for followers table
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.followers(following_id);








