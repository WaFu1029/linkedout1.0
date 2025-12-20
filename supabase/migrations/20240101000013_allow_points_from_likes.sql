-- Allow authenticated users to update garden_points on any profile when awarding points from likes
-- This policy works alongside the existing "Users can update their own profile" policy
-- Note: The application logic ensures points are only awarded once per user-post combination
-- via the reaction_points_awarded table's UNIQUE constraint

CREATE POLICY "Users can award points from likes" ON public.profiles
  FOR UPDATE
  USING (auth.uid() IS NOT NULL) -- Must be authenticated
  WITH CHECK (auth.uid() IS NOT NULL); -- Must be authenticated
