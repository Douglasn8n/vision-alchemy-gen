-- Create table to track daily prompt usage for freemium model
CREATE TABLE public.user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  prompts_generated INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for user usage tracking
CREATE POLICY "Users can view their own usage" 
ON public.user_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage records" 
ON public.user_usage 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update usage records" 
ON public.user_usage 
FOR UPDATE 
USING (true);

-- Create function to increment user usage
CREATE OR REPLACE FUNCTION public.increment_user_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_usage INTEGER;
BEGIN
  -- Insert or update usage for today
  INSERT INTO public.user_usage (user_id, date, prompts_generated)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    prompts_generated = user_usage.prompts_generated + 1,
    updated_at = now();
  
  -- Get current usage count
  SELECT prompts_generated INTO current_usage
  FROM public.user_usage
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  RETURN current_usage;
END;
$$;

-- Create function to check user's daily limit
CREATE OR REPLACE FUNCTION public.check_user_limit(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_usage INTEGER := 0;
  daily_limit INTEGER := 10; -- Free tier limit
  result JSON;
BEGIN
  -- Get today's usage
  SELECT COALESCE(prompts_generated, 0) INTO current_usage
  FROM public.user_usage
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  result := json_build_object(
    'current_usage', current_usage,
    'daily_limit', daily_limit,
    'remaining', daily_limit - current_usage,
    'can_generate', current_usage < daily_limit
  );
  
  RETURN result;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_user_usage_updated_at
BEFORE UPDATE ON public.user_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();