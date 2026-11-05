/**
 * ============================================================================
 * INTEGRAÇÃO AUTOMÁTICA SIPAT MANSERV 2026 -> GOOGLE SHEETS
 * ============================================================================
 * 
 * Este script recebe as pontuações e respostas de cada colaborador enviadas do
 * site da SIPAT (computador ou celular) e registra ou atualiza na sua planilha!
 * 
 * COMO USAR (Leva apenas 1 minuto):
 * 1. Abra o Google Drive e crie uma Planilha em branco (ex: "Resultados SIPAT Manserv 2026").
 * 2. No menu superior da planilha, clique em: Extensões > Apps Script.
 * 3. Apague todo o código que estiver lá e cole EXATAMENTE o código abaixo.
 * 4. Clique no botão azul no topo: "Implantar" (ou "Deploy") > "Nova implantação".
 * 5. Na engrenagem ao lado de "Selecionar tipo", escolha: "App da Web" (Web app).
 * 6. Configure:
 *    - Descrição: "SIPAT 2026"
 *    - Executar como: "Eu" (seu e-mail)
 *    - Quem pode acessar: "Qualquer pessoa" (Anyone) -> ESSENCIAL para os celulares salvarem!
 * 7. Clique em "Implantar". Autorize o acesso com sua conta Google.
 * 8. Copie a "URL do app da Web" gerada (termina com /exec).
 * 9. Cole essa URL no painel Admin do site (ou nos envie para colocar no data/config.json).
 * 
 * Pronto! Cada jogo concluído atualizará automaticamente a linha do colaborador na planilha!
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Cria cabeçalho automático se a planilha estiver vazia
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "RE",
        "Nome do Colaborador",
        "Setor",
        "Nível 1 (Caça-Palavras)",
        "Nível 2 (Forca)",
        "Nível 3 (Questionário)",
        "Nível 4 (Tomada de Decisão)",
        "Nível 5 (Encontre os Riscos)",
        "Nível 6 (Cruzadinha)",
        "Pontuação Total",
        "Jogos Concluídos",
        "Status",
        "Data / Hora Último Envio",
        "ID da Sessão"
      ]);
      
      // Estilização do cabeçalho oficial Manserv
      var headerRange = sheet.getRange(1, 1, 1, 14);
      headerRange.setBackground("#FF460A");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    // Extrai os dados enviados pelo site
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var scores = data.scores || {};
    var re = String(data.re || data.email || "").trim();
    var sessionId = String(data.sessionId || "").trim();
    var isGeneric = (re.toUpperCase() === "STIHL");
    
    var lastRow = sheet.getLastRow();
    var targetRow = -1;
    
    // Procura se o colaborador já possui uma linha na planilha (para atualizar em vez de duplicar)
    if (lastRow > 1) {
      var values = sheet.getRange(2, 1, lastRow - 1, 14).getValues();
      for (var i = 0; i < values.length; i++) {
        var rowRe = String(values[i][0]).trim();
        var rowSession = String(values[i][13]).trim();
        
        if (isGeneric) {
          // STIHL é genérico: atualiza pelo ID da sessão
          if (rowRe.toUpperCase() === "STIHL" && rowSession === sessionId) {
            targetRow = i + 2;
            break;
          }
        } else {
          // RE padrão: atualiza a linha do próprio RE
          if (rowRe.toUpperCase() === re.toUpperCase()) {
            targetRow = i + 2;
            break;
          }
        }
      }
    }
    
    var timestamp = Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");
    
    var rowData = [
      re,
      data.name || "Colaborador",
      data.sector || (isGeneric ? "STIHL" : "Manserv"),
      Number(scores.level1 || 0),
      Number(scores.level2 || 0),
      Number(scores.level3 || 0),
      Number(scores.level4 || 0),
      Number(scores.level5 || 0),
      Number(scores.level6 || 0),
      Number(data.totalScore || 0),
      Number(data.completedCount || 0),
      data.status || "in_progress",
      timestamp,
      sessionId
    ];
    
    if (targetRow > 0) {
      // Atualiza pontuações da linha existente
      sheet.getRange(targetRow, 1, 1, 14).setValues([rowData]);
    } else {
      // Adiciona novo colaborador
      sheet.appendRow(rowData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ result: "success", re: re }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("SIPAT Manserv 2026 Webhook Online!");
}
