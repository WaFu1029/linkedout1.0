-- Allow users to update other users' inventory and gifts_received for gifting
-- This policy allows updating profiles where the recipient is a mutual connection
-- Note: This works alongside the existing "Users can update their own profile" policy

CREATE POLICY "Users can gift to mutual connections" ON public.profiles
  FOR UPDATE
  USING (
    -- Allow if there's a mutual connection (both directions exist in connections table)
    EXISTS (
      SELECT 1 FROM public.connections c1
      WHERE c1.user_id = auth.uid()
      AND c1.connected_user_id = profiles.id
    )
    AND EXISTS (
      SELECT 1 FROM public.connections c2
      WHERE c2.user_id = profiles.id
      AND c2.connected_user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Same conditions for WITH CHECK
    EXISTS (
      SELECT 1 FROM public.connections c1
      WHERE c1.user_id = auth.uid()
      AND c1.connected_user_id = profiles.id
    )
    AND EXISTS (
      SELECT 1 FROM public.connections c2
      WHERE c2.user_id = profiles.id
      AND c2.connected_user_id = auth.uid()
    )
  );
