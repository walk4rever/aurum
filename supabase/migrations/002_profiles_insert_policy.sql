-- Allow users to insert their own profile row
CREATE POLICY "aurum_profiles_insert_own" ON public.aurum_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
