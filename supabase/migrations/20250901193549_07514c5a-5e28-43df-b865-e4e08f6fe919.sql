-- Fix security warnings by setting proper search_path for functions
ALTER FUNCTION public.setup_super_admin_for_email(TEXT) SET search_path = 'public';
ALTER FUNCTION public.setup_super_admin_for_email_fixed(TEXT) SET search_path = 'public';