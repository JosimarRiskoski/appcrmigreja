# GraceHub - Sistema de Gestão para Igrejas

Sistema SaaS completo de gestão eclesiástica, projetado para modernizar e simplificar a administração de igrejas.

## 🙏 Sobre o Projeto

GraceHub é uma plataforma completa que unifica todas as necessidades administrativas de uma igreja em um único lugar:

- **Gestão de Membros** - Cadastro completo com histórico e acompanhamento
- **Eventos & Check-in** - Organize cultos, eventos e controle presença
- **Ministérios** - Gerencie equipes e escalas de serviço
- **Financeiro** - Controle de entradas, saídas e relatórios (Plano Avançado+)
- **Pedidos de Oração** - Acompanhamento e gestão de pedidos
- **Central de Mídia** - Armazene fotos, vídeos e documentos
- **Site Institucional** - Até 3 modelos de site profissional
- **App Mobile** - App exclusivo para membros (Plano Premium)

## 💎 Planos Disponíveis

### Trial (7 dias gratuitos)
- Acesso completo ao sistema
- 1 modelo de site
- Teste sem compromisso

### Essencial - R$ 79/mês
- Todos os módulos básicos
- 1 modelo de site
- Gestão completa de membros e eventos

### Avançado - R$ 149/mês
- Tudo do Essencial +
- Módulo financeiro
- 2 modelos de site
- Transmissões ao vivo

### Premium - R$ 249/mês
- Tudo do Avançado +
- **App Mobile exclusivo**
- 3 modelos de site
- Suporte prioritário
- Automações avançadas

## 🚀 Tecnologias

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase
- **Autenticação**: Supabase Auth
- **Banco de Dados**: PostgreSQL (via Supabase)
- **Deployment**: Lovable Platform

## 🏗️ Estrutura do Projeto

```
src/
├── components/
│   ├── layout/         # Layout components (Sidebar, TopBar)
│   └── ui/             # shadcn/ui components
├── pages/
│   ├── Auth.tsx        # Login e registro
│   ├── Onboarding.tsx  # Configuração inicial da igreja
│   ├── Dashboard.tsx   # Painel principal
│   └── Membros.tsx     # Gestão de membros
├── integrations/
│   └── supabase/       # Cliente e tipos do Supabase
└── App.tsx             # Rotas principais
```

## 🗄️ Estrutura do Banco de Dados

### Principais Tabelas:

- **churches** - Dados das igrejas cadastradas
- **profiles** - Perfis de usuários (extends auth.users)
- **members** - Cadastro de membros da igreja
- **events** - Eventos e cultos
- **ministries** - Ministérios e departamentos
- **prayer_requests** - Pedidos de oração
- **event_attendance** - Check-in em eventos

## 🔐 Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Autenticação via Supabase Auth
- Políticas de acesso baseadas em roles (admin, líder, membro)
- Dados isolados por igreja (church_id)

## 📱 Features Implementadas

✅ Sistema de autenticação completo  
✅ Onboarding com criação de igreja  
✅ Dashboard com métricas  
✅ Gestão de membros  
✅ Sistema de planos e trial de 7 dias  
✅ Menu lateral completo  
✅ Design system profissional  

## 🔜 Roadmap

### Fase 2
- Gestão de Visitantes
- Aniversariantes do mês
- Eventos com check-in
- Ministérios completo

### Fase 3
- Módulo financeiro
- Central de mídia
- Site builder

### Fase 4
- App mobile (Premium)
- Integrações (Google, YouTube)
- Automações com n8n

## 🎨 Design System

O GraceHub utiliza uma paleta de cores serena e confiável:

- **Primary**: Azul profundo (#3b82f6) - Confiança e espiritualidade
- **Secondary**: Âmbar (#f59e0b) - Energia e fé
- **Accent**: Roxo suave (#7c3aed) - Sofisticação

## 🛠️ Como Rodar Localmente

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📄 Licença

Projeto proprietário - GraceHub © 2025

---

**GraceHub** - Transformando a gestão eclesiástica com tecnologia moderna.
