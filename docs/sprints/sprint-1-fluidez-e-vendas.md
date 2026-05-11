# Sprint 1: Fluidez, Vendas e Interface Base

## Objetivos
- Modularizar componentes críticos do frontend.
- Conectar módulos de Vendas (Kanban, Tickets, Todolist) de forma fluida.

## Tarefas Técnicas Detalhadas

### 1. Desmembramento de Componentes (React)
**Contexto:** O código atual possui arquivos muito extensos, difíceis de manter e que causam re-renderizações desnecessárias.
- **`TicketsManagerTabs/index.js`**: 
  - Localizar a lógica e UI de busca avançada (filtros por tag, fila, usuário, data).
  - Criar componente `AdvancedSearchModal` ou `AdvancedSearchFilters`.
  - Passar as funções de `handleSearch` e estados via props ou Context.
- **`Kanban/index.js`**:
  - Extrair cards de KPI (Total de Tickets, Valor em Pipeline) para um componente `KanbanKPIs`.
  - Extrair barra de filtros superior para `KanbanFilters`.
  - Extrair modal de criação/edição de negócio para `TicketDealModal`.
- **Hooks e Performance**: Garantir que esses novos componentes sejam *Functional Components* utilizando `useState`, `useEffect`, `useMemo` e usar `React Query` (já instalado na v3) para cachear a lista de filas, tags e usuários, evitando recarregamentos ao abrir modais.

### 2. Integração Kanban, Tickets e Todolist
**Contexto:** Atualmente, tarefas estão isoladas. Precisam fazer parte do fluxo de CRM.
- **Backend (Banco de Dados)**:
  - Adicionar colunas `ticketId` (int, nullable), `contactId` (int, nullable), e `dealId` (int, nullable) na tabela `Todos` (Todolist).
  - Atualizar os models e controllers correspondentes no backend.
- **Frontend (UI do Chat/Ticket)**:
  - Injetar no cabeçalho (TicketHeader) botões visíveis: `[ + Tarefa ]` e `[ + Oportunidade ]`.
  - Ao clicar em `[ + Tarefa ]`, abrir o modal do Todolist já com o ID do ticket pré-preenchido no estado.
- **Notificações**:
  - Implementar verificação em background (node-cron) para avisar sobre tarefas vencendo. Enviar notificação via Web Socket (`socket.emit`).

### 3. Agendamentos e Tags (Kanban View)
- Atualizar o layout da tela de Agendamentos para um grid mais moderno (utilizando a biblioteca `react-big-calendar` que já está no package.json, porém com customização CSS robusta).
- Adicionar opção "Visualizar como Kanban" na página de Tags (agrupando tickets por tag).
- **Automação Nativa Básica**: Adicionar flag booleana na tag (ex: `isArchival`). Se o usuário aplicar essa tag, o ticket é resolvido/arquivado automaticamente.

### 4. Dashboard CRM (Vendas)
- Construir `SalesDashboard.js`.
- Indicadores: Total Vendido, Tickets em Negociação (Pipeline), Taxa de Conversão.
- Gráficos (Chart.js): Funil de Vendas e Fechamentos por Atendente.
- Exportação nativa `xlsx`.