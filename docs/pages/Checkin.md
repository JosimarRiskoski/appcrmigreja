# Checkin (Interno)

## Propósito
- Tela interna para gerenciar presença: seleção de evento, busca, registro de membros/visitantes, remoção e movimentação para funil.

## Rota
- `/checkin` (ver `src/App.tsx:57-58`).

## Dados e Tipos
- Tipagem local `Checkin` (campos: `id`, `event_id`, `member_id`, `visitor_name`, `visitor_phone`, `checked_in_at`).

## Principais Consultas
- Perfil/role.
- Eventos dos últimos 90 dias da igreja (ordenados por data decrescente).
- Lista de presenças por evento a partir de `event_attendance`.
- Mapa de membros por `member_id`.
- Busca combinada membros/visitantes por nome/telefone.

## Ações
- Registro de presença: insert em `event_attendance`.
- Cadastro rápido de visitante + presença.
- Remover presença.
- Mover presença de visitante para o funil de visitantes.

## Regras de Negócio
- Busca requer ao menos 2 caracteres.
- `checked_in_at` em ISO.
- Fallback de visitantes: se tabela `visitors` não disponível, usa `members` com status `visitante`.

## Supabase
- Tabelas usadas: `events`, `event_attendance`, `members`, `visitors`.
- Autenticação/Perfil: `profiles` para determinar `church_id`.

## UX
- QR Code para página pública.
- Campo de busca por título do evento no dropdown.
- Eventos ordenados do mais recente para o mais antigo.
- Toasts de sucesso/erro em todas ações críticas.
