-- Grant table-level privileges to authenticated role
-- RLS policies alone are not enough without these grants
GRANT SELECT, INSERT, UPDATE ON public.aurum_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.aurum_agents TO authenticated;
