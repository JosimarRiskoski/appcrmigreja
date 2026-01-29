# Membros

## Propósito
- Gestão de membros da igreja: listagem, busca, atualização de dados, ações administrativas.

## Rota
- `/membros` (ver `src/App.tsx:48-49`).

## Integrações
- Supabase `members` e `profiles` para associação com `church_id`.

## Funcionalidades (esperadas pelo nome e padrões do projeto)
- Listagem paginada/ordenada de membros.
- Busca por nome/telefone.
- Edição de campos como `full_name`, `phone`, `status`, `notes`, `member_since`.
- Ações de conversão/alteração de status (ex.: ativo, visitante).

## Regras de Negócio
- Acesso restrito a usuários autenticados do `church_id` correspondente (RLS nas tabelas).

## Considerações
- Verificar integração com check-in: membros encontrados por telefone em `public_checkin_member`.

