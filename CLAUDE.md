# CLAUDE.md — Reglas coperamigo-portal

## Stack
Vue 3 + Vite · Tailwind CSS v4 · Vue Router · @supabase/supabase-js
lucide-vue-next · VueUse · Zod

## Regla #1 — CERO hardcoding visual
Todo color, tamaño, sombra o radio viene de var(--token) definido en
src/styles/main.css. Prohibido escribir valores directos en templates.

## Regla #2 — Separación lógica/presentación
- Componentes: solo template + props + emits
- Composables: lógica, validaciones, llamadas a servicios
- Servicios: única puerta a Supabase

## Regla #3 — Servicios
- src/services/supabase.js → instancia única del cliente
- src/services/credito.service.js → operaciones de crédito
- src/services/afiliacion.service.js → operaciones de afiliación
- Nunca importar supabase directamente en componentes o páginas

## Regla #4 — Naming
- Componentes: PascalCase → BaseButton.vue
- Composables: camelCase + prefijo use → useCredito.js
- Servicios: camelCase + sufijo .service.js
- Páginas: PascalCase + sufijo Page → SolicitudCreditoPage.vue

## Regla #5 — Imports
Siempre absolutos desde @/ — nunca rutas relativas de más de un nivel

## Identidad de marca
- PRIMARY:  #114C5A — verde profundo
- ACCENT:   #FFC801 — amarillo ("amigó")
- IMPULSO:  #FE9932 — naranja
- DARK:     #172B36 — azul petróleo
- P-LIGHT:  #D9E8E2 — verde claro
- BG-APP:   #F1F6F4 — fondo general
- Fuente:   Nunito — 400/600/700/800/900
- Logo: "Cooper" en #114C5A + "amigó" en #FFC801

---

## Regla #6 — Seguridad obligatoria

Estas reglas se verifican en **cada cambio de código**, sin excepción.
Si alguna se viola, el cambio debe corregirse antes de continuar.

### 6.1 Variables de entorno y claves
- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` en el frontend ni con prefijo `VITE_`.
- Solo usar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el cliente.
- `VITE_SKIP_OTP=true` nunca debe estar activo en producción ni en CI.
- No hardcodear tokens, contraseñas, API keys ni UUIDs de recursos en código fuente.

### 6.2 Subida de archivos
- Todo upload en `documentos.service.js` debe validar extensión **y** MIME type antes de llamar a Supabase Storage.
- Extensiones permitidas: `jpg`, `jpeg`, `png`, `webp`, `pdf`.
- MIME types permitidos: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
- Si se añade un nuevo tipo de archivo, actualizar `EXT_PERMITIDAS` y `MIME_PERMITIDOS` en `documentos.service.js`.

### 6.3 Sanitización de entrada
- Todo objeto que va a la base de datos pasa por `sanitizarObjeto()` de `src/utils/seguridad.js`.
- `sanitizarObjeto` es recursivo — cubre campos JSONB anidados (cónyuge, referencias, actividad independiente, activos/pasivos).
- Nunca interpolar directamente `route.query`, ni datos del usuario en queries, HTML o SQL.

### 6.4 Inyección HTML en correos
- Cualquier nombre o texto del usuario que se inserte en plantillas HTML de correo debe pasar por `escaparHtml()`.
- La función `escaparHtml` escapa: `&`, `<`, `>`, `"`.

### 6.5 Llamadas a Edge Functions
- Todos los `fetch()` a `${VITE_SUPABASE_URL}/functions/v1/...` deben incluir:
  ```
  Authorization: Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}
  ```
- No hacer llamadas raw `fetch()` a la Edge Function sin ese header.
- Preferir `supabase.functions.invoke()` cuando no se necesite `FormData`.

### 6.6 Datos sensibles en almacenamiento local
- El borrador del formulario (`src/utils/borrador.js`) tiene TTL de **1 día**.
- No guardar imágenes base64, tokens ni contraseñas en `localStorage`.
- No extender el TTL sin una justificación explícita.

### 6.7 Logs y consola
- `vite.config.ts` tiene `esbuild: { drop: ['console'] }` — todos los `console.*` se eliminan del build de producción. No revertir esta configuración.
- Durante desarrollo está bien loguear, pero nunca loguear tokens, claves ni datos PII completos.

### 6.8 Rate limiting
- `verificarRateLimit()` en `seguridad.js` falla abierto (deja pasar) pero **loguea el error** si la RPC falla.
- No eliminar ese `console.error` — es el único rastro de que el rate limit no está funcionando.
- No cambiar el comportamiento de "fallar abierto" sin revisar el impacto en UX primero.

### 6.9 QR y datos en URLs externas
- El QR se genera localmente con el paquete `qrcode` — nunca enviar la `url_captura` (que contiene tokens) a un servicio externo de terceros.
- No reemplazar `QRCode.toDataURL()` por una URL de imagen externa.

### 6.10 Dependencias
- Después de instalar o actualizar paquetes, ejecutar `npm audit` y corregir vulnerabilidades de severidad `high` o `critical` antes de hacer commit.
- No usar `npm audit fix --force` sin revisar los breaking changes.

---

## Checklist de seguridad — antes de cada commit

Verificar cada punto antes de proponer un cambio:

- [ ] ¿Se usa `sanitizarObjeto()` en todos los datos que van a la BD?
- [ ] ¿Los uploads validan extensión + MIME?
- [ ] ¿Los fetch a Edge Functions llevan `Authorization`?
- [ ] ¿Ningún texto del usuario se interpola directo en HTML de correo?
- [ ] ¿No hay claves o tokens hardcodeados ni en `VITE_` expuestos?
- [ ] ¿No se revirtió `drop: ['console']` en vite.config.ts?
- [ ] ¿El TTL de borrador sigue en 1 día?
- [ ] ¿El QR sigue generándose localmente con `qrcode`?
- [ ] ¿`npm audit` no muestra vulnerabilidades `high`/`critical`?
