-- Fix check_user_limit function to handle new users correctly
CREATE OR REPLACE FUNCTION public.check_user_limit(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_usage INTEGER := 0;
  daily_limit INTEGER := 10; -- Free tier limit
  result JSON;
BEGIN
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
    'can_generate', current_usage < daily_limit
  );
  
  RETURN result;
END;
$function$