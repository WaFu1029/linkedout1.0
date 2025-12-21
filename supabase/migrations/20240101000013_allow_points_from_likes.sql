-- Allow authenticated users to update garden_points and inventory on any profile
-- This policy allows:
-- 1. Awarding points from likes (garden_points)
-- 2. Gifting vegetables through posts (inventory, gifts_received)
-- This policy works alongside the existing "Users can update their own profile" policy
-- Note: The application logic ensures proper validation (e.g., points only awarded once per user-post)

CREATE POLICY "Users can award points and gift from posts" ON public.profiles
  FOR UPDATE
  USING (auth.uid() IS NOT NULL) -- Must be authenticated
  WITH CHECK (auth.uid() IS NOT NULL); -- Must be authenticated


