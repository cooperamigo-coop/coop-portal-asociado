# AGENTS.md — Reglas coperamigo-portal

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
