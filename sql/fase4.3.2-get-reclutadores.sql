-- SIMAN SmartRecruit - Fase 4.3.2
-- RPC segura para llenar el selector de reclutadores sin abrir SELECT general sobre profiles.

create or replace function public.get_reclutadores()
returns table (
  id uuid,
  email text,
  nombre text,
  role_code text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.email,
    p.nombre,
    p.role_code
  from public.profiles p
  where coalesce(p.activo, true) = true
    and lower(trim(coalesce(p.role_code, ''))) in ('reclutadora', 'administrador', 'admin')
  order by p.nombre nulls last, p.email;
$$;

revoke all on function public.get_reclutadores() from public;
grant execute on function public.get_reclutadores() to authenticated;
