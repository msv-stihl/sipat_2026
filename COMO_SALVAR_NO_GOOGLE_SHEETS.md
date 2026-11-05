# 📊 Como Salvar as Respostas da SIPAT no Google Sheets

Como o site está publicado no **GitHub Pages** (hospedagem gratuita na nuvem), os celulares e computadores de todos os colaboradores acessam uma versão estática. Para que as respostas de todos os participantes caiam **automaticamente em uma planilha sua em tempo real**, usamos o Google Sheets.

---

## 🚀 Passo a Passo (Leva apenas 1 minuto)

### 1. Criar a Planilha no Google Drive
1. Acesse o [Google Drive](https://drive.google.com/) ou [Google Sheets](https://sheets.google.com/).
2. Crie uma **Planilha em branco**.
3. Dê o nome que preferir (ex: `SIPAT Manserv 2026 - Respostas`).

---

### 2. Adicionar o Script de Recebimento
1. No menu superior da planilha, clique em: **Extensões** > **Apps Script**.
2. Apague qualquer código existente no editor.
3. Abra o arquivo [`scripts/google_sheets_integration.js`](./scripts/google_sheets_integration.js), copie todo o conteúdo e cole no editor.
4. Clique no ícone de **Salvar** (ícone de disquete) ou pressione `Ctrl + S`.

---

### 3. Publicar o Webhook (App da Web)
1. No canto superior direito da tela do Apps Script, clique no botão azul **Implantar** (ou *Deploy*) > **Nova implantação**.
2. Na engrenagem ao lado de *Selecionar tipo*, escolha **App da Web** (*Web app*).
3. Preencha as configurações:
   - **Descrição:** `SIPAT 2026`
   - **Executar como:** `Eu (seu e-mail)`
   - **Quem pode acessar:** `Qualquer pessoa` *(ESSENCIAL: para que os celulares dos colaboradores consigam enviar as respostas)*.
4. Clique no botão azul **Implantar**.
5. Se o Google solicitar autorização, clique em **Revisar permissões**, selecione sua conta e autorize.
6. Copie a **URL do app da Web** gerada (ela termina em `/exec`).

---

### 4. Conectar ao Site da SIPAT
Você tem duas formas simples de conectar:

- **Opção A (Pelo Painel Admin):**
  1. No site da SIPAT, faça login com o RE de Administrador (`028885`).
  2. Clique no botão **⚙️ Admin** no topo.
  3. Cole a URL no campo **Planilha Google Sheets** e clique em **Salvar Conexão**.

- **Opção B (Direto no Repositório):**
  1. Abra o arquivo `data/config.json`.
  2. Cole a URL no campo `"webhookUrl"`:
     ```json
     {
       "webhookUrl": "https://script.google.com/macros/s/SUA_URL_AQUI/exec",
       "eventName": "SIPAT MANSERV 2026",
       "maxPoints": 1000
     }
     ```
  3. Salve e envie para o GitHub (`git commit` e `git push`).

---

## 🎯 O que acontece a partir daí?
- Toda vez que qualquer colaborador jogar qualquer um dos 6 jogos ou clicar em "Salvar Pontuação", uma linha com o **RE**, **Nome**, **Setor**, **Notas de cada jogo** e **Total** será preenchida ou atualizada automaticamente na planilha.
- Você pode acompanhar tudo ao vivo pelo seu celular ou computador!

