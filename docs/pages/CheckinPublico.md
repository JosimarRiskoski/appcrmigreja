                        # Check-in Público: Arquitetura, mudanças e operação

## Objetivo
- Permitir que qualquer pessoa confirme presença em um evento via página pública (`/checkin/:event_id`), sem exigir login.
- Garantir persistência consistente no banco via funções RPC do Supabase, mesmo quando o cache de esquema do PostgREST apresenta 404/PGRST202.

## Visão Geral da Solução
- Página pública faz duas operações principais:
  - `public_checkin_member(p_event_id, p_phone)`: confirma presença de um membro existente.
  - `public_checkin_visitor(p_event_id, p_full_name, p_phone)`: cadastra visitante (se disponível) e confirma presença.
- Fallback para ambientes sem a tabela `visitors`:
  - `public_checkin_visitor_members(p_event_id, p_full_name, p_phone)`: cria visitante em `members` com `status='visitante'` e registra presença em `event_attendance`.
- As chamadas RPC usam `schema: "public"` e possuem um fallback que chama diretamente o endpoint REST (`/rest/v1/rpc/<função>`) quando ocorre 404/PGRST202.
- Presenças são registradas em `event_attendance` e, para visitantes, o telefone é salvo em `visitor_phone`.

## Alterações Principais
- Página de Check-in Público:
  - Helper e fallback RPC adicionados em `src/pages/PublicCheckin.tsx:14-35`.
  - Uso do helper nas ações:
    - Membros: `src/pages/PublicCheckin.tsx:90-106`
    - Visitantes: `src/pages/PublicCheckin.tsx:122-136`
- Funções SQL no Supabase:
  - Definições e permissões em `supabase/migrations/20251208_public_checkin.sql:1-23` e `supabase/migrations/20251208_public_checkin.sql:24-48`.
  - Fallback adicional em `supabase/migrations/20251209_public_checkin_visitor_members.sql:1-41`.
- Vite server de desenvolvimento:
  - Configuração em `vite.config.ts:8-11` (host `::`, port `8080`). Vite muda automaticamente para outra porta se a `8080` estiver ocupada.

## Fluxo de Dados
1. Usuário acessa `/checkin/:event_id`.
2. Página busca `events` e `churches` para contexto: `src/pages/PublicCheckin.tsx:28-47` e `src/pages/PublicCheckin.tsx:60-66`.
3. Ao confirmar:
   - Membro: chama `public_checkin_member` com `p_event_id` e `p_phone`.
   - Visitante: chama `public_checkin_visitor` com `p_event_id`, `p_full_name` e `p_phone`.
4. Caso PostgREST retorne 404/PGRST202, o helper aciona o `fetch` direto para o endpoint REST da função (com `apikey` e `Authorization` usando a anon key), e replica a lógica.

## Funções e Permissões
- `public_checkin_member(uuid, text)`
  - Valida evento, normaliza telefone, encontra membro por `church_id` e `phone`, insere em `event_attendance`.
  - `GRANT EXECUTE` para `anon`.
- `public_checkin_visitor(uuid, text, text)`
  - Valida evento e telefone; se visitante não existir para a igreja, insere em `visitors`; insere em `event_attendance` com `visitor_phone`.
  - `GRANT EXECUTE` para `anon`.
- Recomendação operacional:
  - Garantir `USAGE` no schema `public` para `anon` e recarregar cache do PostgREST:
    - `GRANT USAGE ON SCHEMA public TO anon;`
    - `NOTIFY pgrst, 'reload schema';`

## Variáveis de Ambiente
- Necessárias no cliente (`.env.local`):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- São lidas pelo cliente em `src/integrations/supabase/client.ts:4-16` e pelo fallback em `src/pages/PublicCheckin.tsx:14-15`.

## Execução Local
- Dev server: `npm run dev`.
  - Vite escolhe porta disponível automaticamente; exemplo recente: `http://localhost:5175/`.
- Preview de produção: `npm run preview` (executa build e inicia servidor de preview).

## Testes Funcionais
- Membro:
  - Acesse `/checkin/<event_id válido>`.
  - Informe telefone de membro cadastrado; confirme presença.
  - Resultado esperado: mensagem de sucesso; registro em `event_attendance` com `member_id` preenchido.
- Visitante:
  - Informe nome e telefone; confirme.
  - Resultado esperado:
    - Com `visitors`: cria visitante e registra em `event_attendance` com `visitor_phone`.
    - Sem `visitors`: cria em `members` (`status='visitante'`) e registra em `event_attendance` (telefone disponível apenas no fluxo de `public_checkin_visitor`).

## Tratamento de Erros
- Mensagens específicas no cliente com base no texto do erro:
  - `member_not_found`: sugere cadastro como visitante.
  - `invalid_phone`: telefone inválido.
  - `event_not_found`: evento inexistente.
  - Demais: erro genérico de confirmação.
- Implementação em `src/pages/PublicCheckin.tsx:90-111` e `src/pages/PublicCheckin.tsx:122-141`.

## Troubleshooting
- RPC retorna 404/PGRST202:
  - Execute `NOTIFY pgrst, 'reload schema';`.
  - Verifique `GRANT USAGE ON SCHEMA public TO anon;` e `GRANT EXECUTE` com a assinatura correta.
  - Confirme que `public` está em “Exposed schemas” nas configurações da API.
  - O fallback `fetch` já contorna o 404 em produção e desenvolvimento.
- Ambiente sem sessão (público):
  - O fallback usa `apikey` e `Authorization` com a anon key; isso fornece o papel `anon` sem exigir login.

## Racional de Projeto
- Usamos funções `SECURITY DEFINER` para executar operações atômicas sob permissões controladas, contornando RLS onde necessário.
- Mantivemos o fluxo público simples (somente nome/telefone) e robusto contra cache desatualizado do PostgREST via fallback REST.
- Evitamos dependência de login para check-in público; o papel `anon` tem apenas o mínimo necessário (`EXECUTE` nas funções, sem acesso direto às tabelas).

## Referências de Código
- `src/pages/PublicCheckin.tsx`
- `supabase/migrations/20251208_public_checkin.sql`
- `supabase/migrations/20251209_public_checkin_visitor_members.sql`
- `src/integrations/supabase/client.ts`
- `vite.config.ts`

## Resumo operacional (da página PublicCheckin)
- Propósito: confirmar presença pública via nome/telefone ou telefone de membro.
- Rota: `/checkin/:event_id`.
- Integrações: Supabase client; RPC `public_checkin_member` e `public_checkin_visitor`.
- Fluxo: carrega evento/igreja; cabeçalho; ações de registro para membro e visitante.
- Fallback: usa `schema: "public"` e, em 404/PGRST202, chama `/rest/v1/rpc/<função>` com `apikey`.
- Mensagens: `member_not_found`, `invalid_phone`, `event_not_found`, genérico.
- UI/UX: sucesso com CTA para site da igreja.
