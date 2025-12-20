-- Create dismissed_notifications table to track which notifications have been cleared
CREATE TABLE IF NOT EXISTS public.dismissed_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('connection_request', 'comment', 'reaction', 'gift')),
  notification_id UUID NOT NULL, -- ID of the connection, comment, reaction, or gift
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, notification_type, notification_id)
);

-- Enable Row Level Security
ALTER TABLE public.dismissed_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own dismissed notifications" ON public.dismissed_notifications;
DROP POLICY IF EXISTS "Users can dismiss their own notifications" ON public.dismissed_notifications;

-- Create policies
CREATE POLICY "Users can view their own dismissed notifications" ON public.dismissed_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can dismiss their own notifications" ON public.dismissed_notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dismissed_notifications_user_id ON public.dismissed_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_dismissed_notifications_type ON public.dismissed_notifications(notification_type);
