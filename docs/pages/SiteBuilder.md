# SiteBuilder

## Propósito
- Construção e edição do site da igreja.

## Rota
- `/site-builder` (ver `src/App.tsx:63-64`).

## Integrações
- Configurações do site: `site_settings` (ver `scripts/setup-supabase.js:63-69`, políticas em `scripts/setup-supabase.js:108-145`).
- Template sincronizado para `public/modelo-site` via `scripts/modelo-sync.js:40-46`.

## Funcionalidades
- Edição de dados do site, publicação e sincronização de templates.

