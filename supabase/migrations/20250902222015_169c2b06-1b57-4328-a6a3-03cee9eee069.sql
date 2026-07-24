-- Fix the update_organization_stats function to avoid DELETE without WHERE clause
CREATE OR REPLACE FUNCTION public.update_organization_stats()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Use TRUNCATE instead of DELETE for clearing all records
    TRUNCATE public.organization_stats;
    
    -- Insert updated stats
    INSERT INTO public.organization_stats (id, name, slug, description, status, member_count, created_at)
    SELECT 
        o.id,
        o.name,
        o.slug,
        o.description,
        o.status,
        COALESCE(COUNT(om.id), 0) as member_count,
        o.created_at
    FROM public.organizations o
    LEFT JOIN public.organization_members om ON o.id = om.organization_id AND om.status = 'active'
    GROUP BY o.id, o.name, o.slug, o.description, o.status, o.created_at;
END;
$function$;