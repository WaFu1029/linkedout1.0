-- Create table to track which users have already given points for which posts
-- This prevents point fraud by ensuring each user can only give points once per post
CREATE TABLE IF NOT EXISTS public.reaction_points_awarded (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(post_id, user_id) -- Each user can only give points once per post
);

-- Enable Row Level Security
ALTER TABLE public.reaction_points_awarded ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own points awarded" ON public.reaction_points_awarded
  FOR SELECT
  USING (auth.uid() = author_id OR auth.uid() = user_id);

CREATE POLICY "System can insert points awarded records" ON public.reaction_points_awarded
  FOR INSERT
  WITH CHECK (true); -- Points are awarded server-side, so we allow inserts

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reaction_points_post_id ON public.reaction_points_awarded(post_id);
CREATE INDEX IF NOT EXISTS idx_reaction_points_user_id ON public.reaction_points_awarded(user_id);
CREATE INDEX IF NOT EXISTS idx_reaction_points_author_id ON public.reaction_points_awarded(author_id);
