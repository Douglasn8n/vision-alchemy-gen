-- Fix email enumeration vulnerability in subscribers table
-- Remove email-based access from SELECT policy to prevent attackers from
-- querying subscription data using arbitrary email addresses

-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "subscribers_select_own" ON public.subscribers;

-- Create new restrictive SELECT policy that only allows user_id-based access
CREATE POLICY "subscribers_select_own" ON public.subscribers
  FOR SELECT
  USING (user_id = auth.uid());