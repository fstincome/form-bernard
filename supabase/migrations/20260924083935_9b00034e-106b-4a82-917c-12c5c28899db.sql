CREATE TABLE public.questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.questionnaire_responses TO anon, authenticated;
GRANT ALL ON public.questionnaire_responses TO service_role;
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can submit questionnaire responses"
ON public.questionnaire_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (jsonb_typeof(answers) = 'object');
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER update_questionnaire_responses_updated_at
BEFORE UPDATE ON public.questionnaire_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();