# Mídias

## Propósito
- Biblioteca de mídias com upload, listagem, compartilhamento público.

## Rota
- `/midia` (ver `src/App.tsx:62-63`).

## Integrações
- Tabela `media_library` e bucket `media` (ver `scripts/setup-supabase.js:28-40`, `scripts/setup-supabase.js:47-69`, `scripts/setup-supabase.js:71-147`).
- Compartilhamento via `share_id` e página de `MidiaShare`.

## Funcionalidades
- Upload para Storage, geração de URL pública, gestão por `church_id`.

