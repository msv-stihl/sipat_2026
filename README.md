# 🚀 SIPAT MANSERV 2026 • Missão Segurança Total (1.000 Pontos)

Website gamificado desenvolvido sob medida para a **SIPAT MANSERV 2026** com 6 desafios interativos sobre segurança do trabalho, saúde ocupacional e cultura de prevenção.

---

## 🎨 Identidade Visual & Cores Oficiais Manserv
- **Laranja Vibrante Manserv:** `#FF460A`
- **Preto Profundo:** `#111111`
- **Cinza Chumbo (Superfícies):** `#232323`
- **Cinza Claro (Textos e Detalhes):** `#EDEDED`
- **Branco Puro (Destaques e Títulos):** `#FFFFFF`

---

## 🎮 Distribuição dos 1.000 Pontos nos 6 Jogos

Os jogos podem ser realizados **em qualquer ordem** e a pontuação pode ser salva/enviada para o banco de dados **a qualquer momento** (não é obrigatório terminar todos para enviar):

| Nível | Jogo | Dificuldade | Pontuação Máxima | Descrição e Regras |
| :--- | :--- | :--- | :---: | :--- |
| **Nível 1** | **Caça-Palavras** | Fácil | **100 pts** | 6 palavras da cultura de segurança Manserv escondidas no diagrama (`MANSERV`, `SEGURANCA`, `PREVENCAO`, `CUIDADO`, `ALERTA`, `EPI`). Seleção por toque/arraste. |
| **Nível 2** | **Jogo da Forca** | Fácil / Médio | **120 pts** | 3 rodadas de 40 pts cada. Termos cruciais da SIPAT com dicas contextualizadas e boneco com EPIs Manserv em SVG. |
| **Nível 3** | **Questionário** | Médio | **150 pts** | 5 perguntas sobre comportamento seguro no dia a dia. **Regra obrigatória:** o colaborador precisa acertar no mínimo **4 das 5 perguntas** para ser aprovado (30 pts por questão). Gabarito comentado ao final. |
| **Nível 4** | **Tomada de Decisão** | Médio / Avançado | **180 pts** | 3 cenários operacionais reais (60 pts cada). Simulação dos desfechos de cada escolha e aplicação das Regras de Ouro e do Direito de Recusa Manserv. |
| **Nível 5** | **Encontre os Riscos** | Difícil | **220 pts** | Cenário industrial em alta definição com **5 riscos ocultos**. O colaborador tem **exatamente 8 chances** (cliques/toques na tela) para encontrar os 5 riscos (44 pts por risco). Desenvolvido com foco em telas de celular. |
| **Nível 6** | **Cruzadinha SIPAT** | Muito Difícil | **230 pts** | Diagrama com **7 palavras cruzadas entrelaçadas** com conceitos de NRs, ergonomia, LOTO e auditoria. Teclado virtual e físico integrados. |
| **TOTAL** | **Jornada Completa** | — | **1.000 pts** | **Pontuação Máxima Possível** |

---

## 💾 Banco de Dados & Armazenamento

1. **Persistência Local (Offline-First):**
   - Todos os dados, progresso e pontuações parciais são salvos automaticamente no `localStorage` do navegador do colaborador, garantindo que ele nunca perca o progresso caso feche o celular ou recarregue a página.

2. **Banco de Dados Centralizado no Servidor:**
   - As submissões são gravadas em `data/database.json`.
   - Cada registro contém: `id`, `email`, `name`, `sector`, detalhamento das pontuações de cada nível (`level1` a `level6`), `totalScore`, `completedCount`, `submittedAt` e status.

3. **Integração com Planilhas Google / Webhook:**
   - No painel administrativo (`/api/config`), é possível cadastrar uma URL de Webhook (ex: Google Apps Script, Zapier, Power Automate). Todas as pontuações submetidas são automaticamente disparadas em tempo real para a sua planilha corporativa!

4. **Exportação de Resultados em Excel/CSV:**
   - O painel conta com um botão direto de download do arquivo `sipat_manserv_2026_resultados.csv` formatado com cabeçalhos completos para análise pelo time de EHS e Recursos Humanos.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js instalado (v18+)

### Iniciar o Servidor
No diretório do projeto, execute:
```bash
npm start
```

O servidor iniciará automaticamente e estará acessível em:
```
http://localhost:3001
```
*(Caso a porta esteja em uso, o servidor possui fallback automático para encontrar uma porta livre).*

---

## 📱 Recursos Especiais
- **Identificação com Validação:** Solicitação de e-mail corporativo, nome e setor antes do jogo ou editável no cabeçalho.
- **Efeitos Sonoros Sintetizados (Web Audio API):** Áudios interativos instantâneos para acertos, erros, descobertas de risco e fanfarras de vitória sem necessidade de arquivos externos de áudio.
- **Efeito Confete:** Animação de celebração com partículas nas cores Manserv ao bater metas e concluir níveis.
- **Certificado Digital de Participação:** Emissão de certificado oficial personalizado com o nome do colaborador, data e pontuação final conquistada.
- **Placar de Líderes (Leaderboard):** Ranking em tempo real dos melhores participantes com medalhas para o top 3.
