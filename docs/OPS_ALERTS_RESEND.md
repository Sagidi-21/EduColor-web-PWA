# Avisos de lockout a ops (Resend) — guía paso a paso

Cuando alguien falla el login **3 veces**, EduColor bloquea 15 minutos y puede
enviar correo de contraseña nueva al usuario. **Además**, avisa a ops por
correo (D16) usando **Resend** (plan gratis).

**Destinatario (piloto, sin dominio propio):**

- `salvadorginestarhernandez@gmail.com` (mismo email de la cuenta Resend)

Con `onboarding@resend.dev` no se puede avisar a otros correos. Cuando verifiques
un dominio, podrás ampliar `OPS_ALERT_EMAILS` (lista separada por comas).

Sentry **no** sustituye esto: Sentry es para errores de la app; el lockout es
un aviso de seguridad. Guía aparte cuando montéis Sentry.

---

## 1. Crear cuenta Resend (gratis)

1. Entra en [https://resend.com](https://resend.com) y regístrate (puedes usar uno de tus Gmail).
2. Confirma el email si te lo piden.
3. En el panel, ve a **API Keys** → **Create API Key**.
4. Nombre: `educolor-ops` (o similar). Permiso: **Sending access**.
5. **Copia la clave** (`re_...`) y guárdala en un sitio seguro. Solo se muestra una vez.

## 2. Remitente (desde quién sale el correo)

### Limitación importante (`onboarding@resend.dev`)

Sin dominio propio, el remitente de prueba es:

`EduColor Ops <onboarding@resend.dev>`

Con ese remitente Resend **solo** entrega al email con el que te registraste
en Resend. Si `OPS_ALERT_EMAILS` tiene otros Gmail → error 403 y **no llega nada**.

- **Prueba rápida:** pon en `OPS_ALERT_EMAILS` solo el email de tu cuenta Resend.
- **Producción / dos destinatarios:** verifica un dominio en Resend → **Domains**
  y cambia `RESEND_FROM` a p. ej. `EduColor Ops <avisos@tudominio.com>`.

### No confundir con el correo Auth

Al 3.er fallo, Supabase Auth puede enviar **reset de contraseña** al email que
intentó entrar (si la cuenta existe). Eso es D-037 y **es correcto**. El aviso
ops (Resend) es un correo **aparte** a tus direcciones de administración.

## 3. Secretos en Supabase (Edge Functions)

1. Abre el proyecto en [Supabase Dashboard](https://supabase.com/dashboard).
2. Ve a **Project Settings** → **Edge Functions** → **Secrets** (o **Manage secrets**).
3. Añade estos secretos (nombres exactos):

| Nombre             | Valor                                  |
| ------------------ | -------------------------------------- |
| `RESEND_API_KEY`   | La clave `re_...` que copiaste         |
| `OPS_ALERT_EMAILS` | `salvadorginestarhernandez@gmail.com`  |
| `RESEND_FROM`      | `EduColor Ops <onboarding@resend.dev>` |

Sin `RESEND_API_KEY`, el login sigue funcionando; solo **no** se envía el aviso ops
(quedará un log en la función).

## 4. Redesplegar `school-login`

En tu máquina, desde la raíz del repo (con CLI de Supabase ya enlazada al proyecto):

```bash
npx supabase functions deploy school-login
```

O desde el Dashboard: Edge Functions → `school-login` → Deploy de la versión del repo.

## 5. Probar

1. En la app (prod o local apuntando a ese proyecto), ve a **Entrar al Colegio**.
2. Usa un email **de prueba** con contraseña incorrecta **3 veces**.
3. Debe aparecer el mensaje de espera 15 minutos.
4. Revisa la bandeja (y spam) de **ambos** Gmail ops: asunto tipo «EduColor: bloqueo de login».
5. En Admin Central, el chip Seguridad debe reflejar el lockout en 24 h.

## 6. Si no llega el correo

- Mira los logs de Edge `school-login` en Supabase (error de Resend).
- Confirma que los tres secretos existen y no tienen espacios de más.
- Con `onboarding@resend.dev`, Resend a veces limita a direcciones de prueba; si falla, verifica un dominio en Resend o usa el modo de prueba de su documentación.
- No confundas este correo con el de «contraseña nueva» de Supabase Auth (ese va al email que intentó entrar, y cuenta en el cupo Free 2/h).

## Relación con el cupo Auth Free

- Correos de **Auth** (alta, recovery, lockout→reset): Supabase, **2/h** en Free.
- Correos **ops** (este aviso): Resend, cupo Free aparte — no gasta el cupo Auth.
