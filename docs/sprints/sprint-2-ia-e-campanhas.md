# Sprint 2: Inteligência Artificial, Campanhas e Motor de Envio

*Nota: O sistema já foi atualizado para o whaileys e a conexão está estável. O foco do backend agora não é a conexão, e sim as integrações ao redor dela.*

## Objetivos
- Integrar providers avançados de IA (Gemini).
- Tornar o sistema de Campanhas assíncrono e imune a travamentos.
- Proteção do banco com importação sob demanda.

## Tarefas Técnicas Detalhadas

### 1. Importação Inteligente sob Demanda
- Construir modal de importação (Data Início / Data Fim) disparado logo após a geração e leitura do QRCode (quando não houver mensagens recentes).
- Criar Worker no `bull` (backend) para iterar no histórico do WhatsApp e salvar no DB sem bloquear o *Event Loop* principal do Node.

### 2. Integração Google Gemini & IA Contextual
- Instalar dependências oficiais ou usar chamadas REST para API do Google Gemini.
- Mudar estrutura da tabela `Settings` ou `Companies` para aceitar `aiProvider` (OpenAI, Gemini).
- Alterar o `MessageListener` (ou o serviço que atende os bots) para passar as últimas 10-20 mensagens do Ticket no array de *history* do prompt da IA.
- Criar a página "Playground" (Testador de Prompt) no frontend, com um chat simulado que bate no endpoint de teste da IA antes de aplicar a automação aos clientes reais.

### 3. Otimização do Módulo de Campanhas
- Isolar completamente o envio de Campanhas usando filas do `Bull` e Redis.
- Validar se o número tem WhatsApp (`onWhatsApp`) ANTES de entrar na fila de disparo.
- Coletar relatórios de ack do *whaileys* (Enviado, Entregue = 2 ticks, Lido = tick azul) e salvar estatísticas na tabela da Campanha.