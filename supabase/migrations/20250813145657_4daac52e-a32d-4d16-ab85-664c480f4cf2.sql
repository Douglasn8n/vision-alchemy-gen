-- Fix security vulnerability in subscribers table by adding comprehensive RLS policies

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;

-- Create comprehensive RLS policies for subscribers table

-- SELECT: Users can only view their own subscription data
CREATE POLICY "subscribers_select_own" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

-- INSERT: Only allow edge functions (service role) to create subscription records
-- Regular users cannot directly insert subscription data
CREATE POLICY "subscribers_insert_service_only" ON public.subscribers
FOR INSERT
WITH CHECK (false); -- This will be bypassed by edge functions using service role key

-- UPDATE: Only allow edge functions (service role) to update subscription records  
-- Regular users cannot directly modify subscription data
CREATE POLICY "subscribers_update_service_only" ON public.subscribers
FOR UPDATE
USING (false) -- This will be bypassed by edge functions using service role key
WITH CHECK (false);

-- DELETE: Prevent all direct deletions - subscriptions should be managed via Stripe
-- Edge functions should handle subscription cancellations by updating the subscribed flag
CREATE POLICY "subscribers_delete_none" ON public.subscribers  
FOR DELETE
USING (false);