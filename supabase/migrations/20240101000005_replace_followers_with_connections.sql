-- Create connections table to replace followers table
-- Connections represent one-way connection requests
-- A mutual connection exists when both A->B and B->A exist

CREATE TABLE IF NOT EXISTS public.connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  connected_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, connected_user_id),
  CHECK (user_id != connected_user_id)
);

-- Enable Row Level Security on connections table
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Connections policies: everyone can read, authenticated users can create/delete their own connections
CREATE POLICY "Connections are viewable by everyone" ON public.connections
  FOR SELECT
  USING (true);

CREATE POLICY "Users can connect with others" ON public.connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can disconnect from others" ON public.connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for connections table
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON public.connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_connected_user_id ON public.connections(connected_user_id);

-- Migrate existing followers data to connections (if followers table exists)
-- Note: This assumes follower_id maps to user_id and following_id maps to connected_user_id
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'followers') THEN
    -- Migrate data from followers to connections
    INSERT INTO public.connections (user_id, connected_user_id, created_at)
    SELECT 
      p1.id as user_id,
      p2.id as connected_user_id,
      f.created_at
    FROM public.followers f
    JOIN public.profiles p1 ON p1.id = f.follower_id
    JOIN public.profiles p2 ON p2.id = f.following_id
    ON CONFLICT (user_id, connected_user_id) DO NOTHING;
    
    -- Drop the old followers table
    DROP TABLE IF EXISTS public.followers CASCADE;
  END IF;
END $$;
