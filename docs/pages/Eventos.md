# Eventos

## Propósito
- Gerenciar eventos da igreja: criação, edição, listagem e integração com check-in.

## Rota
- `/eventos` (ver `src/App.tsx:54`).

## Integrações
- Tabela `events` com campos usados em check-in público: `id`, `title`, `event_date`, `location`, `church_id` (ver `src/pages/PublicCheckin.tsx:31-43`).

## Funcionalidades
- Listagem futura (ordenada por `event_date`).
- Criação/edição com validações de data e local.
- Geração de link/QR para check-in: `/checkin/:event_id`.

## Regras
- `church_id` vincula evento à igreja do usuário.

