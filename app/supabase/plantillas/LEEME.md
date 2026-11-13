# Mails de En Claro en español

En Supabase: **Authentication → Emails → Templates**. Para cada plantilla: pegá el HTML y el asunto.

| Plantilla de Supabase | Archivo | Asunto |
|---|---|---|
| Confirm sign up | `confirmar-cuenta.html` | Confirmá tu mail en En Claro |
| Magic Link | `entrar-con-link.html` | Tu link para entrar a En Claro |
| Reset Password | `cambiar-contrasena.html` | Elegí tu contraseña nueva en En Claro |
| Change Email Address | `cambiar-mail.html` | Confirmá tu mail nuevo en En Claro |

Los links usan `token_hash`: funcionan aunque abras el mail en otra app del celular (Gmail, Chrome, etc.).
