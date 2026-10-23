-- Edge content-* llama session_has_app_access con el client service_role.
-- Sin EXECUTE para service_role, el RPC falla → resolveCaller trata al usuario
-- como anonymous → 401 en content-ficha / content-session (p. ej. admin→OW).

grant execute on function public.session_has_app_access(uuid) to service_role;
