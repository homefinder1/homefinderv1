-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function for role checks (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Add status column to annonser
CREATE TYPE public.annons_status AS ENUM ('vantande', 'godkand', 'avvisad');

ALTER TABLE public.annonser
ADD COLUMN status annons_status NOT NULL DEFAULT 'vantande';

CREATE INDEX idx_annonser_status ON public.annonser (status);

-- 6. Replace old SELECT policy: public sees only approved listings
DROP POLICY IF EXISTS "Anyone can view annonser" ON public.annonser;

CREATE POLICY "Public can view approved annonser"
ON public.annonser FOR SELECT
TO anon, authenticated
USING (status = 'godkand');

CREATE POLICY "Admins can view all annonser"
ON public.annonser FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Allow admins to update status
CREATE POLICY "Admins can update annonser"
ON public.annonser FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. Allow admins to delete annonser
CREATE POLICY "Admins can delete annonser"
ON public.annonser FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));