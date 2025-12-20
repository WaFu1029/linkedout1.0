-- Create gifts table to track individual gift transactions
CREATE TABLE IF NOT EXISTS public.gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gifter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Gifts are viewable by recipient" ON public.gifts
  FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can create gifts to mutual connections" ON public.gifts
  FOR INSERT
  WITH CHECK (
    auth.uid() = gifter_id
    AND EXISTS (
      SELECT 1 FROM public.connections c1
      WHERE c1.user_id = auth.uid()
      AND c1.connected_user_id = recipient_id
    )
    AND EXISTS (
      SELECT 1 FROM public.connections c2
      WHERE c2.user_id = recipient_id
      AND c2.connected_user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gifts_recipient_id ON public.gifts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gifts_gifter_id ON public.gifts(gifter_id);
CREATE INDEX IF NOT EXISTS idx_gifts_created_at ON public.gifts(created_at DESC);
