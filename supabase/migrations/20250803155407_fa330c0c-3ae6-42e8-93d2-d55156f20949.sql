-- Create subscribers table to track subscription information
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own subscription info
CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid() OR email = auth.email());

-- Create policy for edge functions to update subscription info
CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE
USING (true);

-- Create policy for edge functions to insert subscription info
CREATE POLICY "insert_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (true);

-- Update user limits based on subscription tier
CREATE OR REPLACE FUNCTION public.check_user_limit(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_usage INTEGER := 0;
  daily_limit INTEGER := 10; -- Default free tier limit
  subscription_tier TEXT;
  result JSON;
BEGIN
  -- Get subscription tier
  SELECT s.subscription_tier INTO subscription_tier
  FROM public.subscribers s
  WHERE s.user_id = p_user_id AND s.subscribed = true;
  
  -- Set daily limit based on subscription tier
  IF subscription_tier = 'Pro' THEN
    daily_limit := 100;
  ELSIF subscription_tier = 'Unlimited' THEN
    daily_limit := 999999; -- Effectively unlimited
  ELSE
    daily_limit := 10; -- Free tier
  END IF;
  
  -- Get today's usage, defaulting to 0 if no record exists
  SELECT COALESCE(prompts_generated, 0) INTO current_usage
  FROM public.user_usage
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  -- If no record found, current_usage is already 0
  IF current_usage IS NULL THEN
    current_usage := 0;
  END IF;
  
  result := json_build_object(
    'current_usage', current_usage,
    'daily_limit', daily_limit,
    'remaining', GREATEST(0, daily_limit - current_usage),
    'can_generate', current_usage < daily_limit,
    'subscription_tier', COALESCE(subscription_tier, 'Free')
  );
  
  RETURN result;
END;
$function$