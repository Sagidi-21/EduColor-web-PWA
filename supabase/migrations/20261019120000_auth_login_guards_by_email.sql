-- D-037 ajuste: el lockout debe acumular por email.
-- La IP en Edge (Functions) no es estable entre peticiones del mismo cliente,
-- así que la clave compuesta (email, ip_hash) dejaba fail_count siempre en 1.
-- Se conserva ip_hash como última IP vista (auditoría), no como parte de la PK.

alter table public.auth_login_guards
  drop constraint if exists auth_login_guards_pkey;

-- Fusionar filas duplicadas por email (quedarse con el peor estado).
delete from public.auth_login_guards a
  using public.auth_login_guards b
 where a.email_norm = b.email_norm
   and a.ctid < b.ctid;

alter table public.auth_login_guards
  add primary key (email_norm);

comment on table public.auth_login_guards is
  'D-037: intentos fallidos de Entrar al Colegio por email. ip_hash = última IP (SHA-256), no forma parte de la clave.';

notify pgrst, 'reload schema';
