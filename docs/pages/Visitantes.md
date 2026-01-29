# Visitantes

## Propósito
- Gerenciar funil de visitantes (criação, atualização, conversão em membro, histórico de estágio/tag/observações).

## Rota
- `/visitantes` (ver `src/App.tsx:52`).

## Fluxos Principais
- Criação de visitante: formulário com nome, telefone, data primeira visita, email, notas, tag — ver `src/pages/Visitantes.tsx:523-579`.
- Conversão de visitante em membro: insere em `members`, atualiza histórico, remove visitante — ver `src/pages/Visitantes.tsx:479-521`.
- Visualização e detalhes com estado interno e modais.

## Dados e Estruturas
- Campos principais `visitors`: `id`, `church_id`, `full_name`, `phone`, `email`, `first_visit_date`, `notes`, `tag`, `status`, `history`.
- Histórico: array de `HistoryEntry` com `timestamp`, `from`, `to`, `user`, `action`.

## Regras de Negócio
- `status` inicia em `primeira_visita`.
- Fallback opcional para usar `members` com `status = 'visitante'` quando tabela `visitors` não está disponível.
- Ao converter para membro:
  - Insere em `members` (`status = 'ativo'` e `member_since` = data atual).
  - Atualiza `history` em `visitors` e depois deleta o visitante.

## Supabase
- Tabelas: `visitors`, `members`.
- Auxílio: limpeza de notas pode ocorrer via script `src/scripts/fixVisitorNotes.ts:1-49`.

## UX/Erros
- Toasts nas ações: criação, conversão, remoção.
- Validação: nome/telefone/data obrigatórios na criação.

