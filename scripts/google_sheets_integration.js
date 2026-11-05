/**
 * ============================================================================
 * INTEGRAÇÃO AUTOMÁTICA SIPAT MANSERV 2026 -> GOOGLE SHEETS
 * ============================================================================
 * 
 * Este script recebe as pontuações e respostas de cada colaborador enviadas do
 * site da SIPAT (computador ou celular) e registra ou atualiza na sua planilha!
 * 
 * VANTAGENS:
 * - Linha ÚNICA por colaborador: Se o mesmo RE enviar novamente, a linha dele é ATUALIZADA
 *   com a maior pontuação em vez de criar linhas duplicadas.
 * - Suporte a zeros à esquerda no RE (ex: 028885).
 * - Acesso genérico STIHL suporta múltiplos colaboradores independentes.
 */

function cleanRe(val) {
  if (val === null || val === undefined) return "";
  var s = String(val).trim().toUpperCase();
  s = s.replace(/^'/, ""); // Remove apóstrofo se houver
  // Se for numérico, remove zeros à esquerda para comparação 100% precisa (028885 == 28885)
  if (/^\d+$/.test(s)) {
    return s.replace(/^0+/, "") || "0";
  }
  return s;
}

function doPost(e) {
  // Trava para evitar concorrência simultânea escrevendo na mesma célula
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // aguarda até 10s para obter a trava
  } catch (t) {}

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
      
      var headerRange = sheet.getRange(1, 1, 1, 14);
      headerRange.setBackground("#FF460A");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);

      // Formata a coluna A (RE) como texto puro para nunca cortar os zeros à esquerda
      sheet.getRange("A:A").setNumberFormat("@");
    }
    
    // Extrai os dados enviados pelo site
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var scores = data.scores || {};
    var rawRe = String(data.re || data.email || "").trim();
    var normalizedRe = cleanRe(rawRe);
    var sessionId = String(data.sessionId || "").trim();
    var isGeneric = (normalizedRe === "STIHL");
    
    var lastRow = sheet.getLastRow();
    var targetRow = -1;
    
    // Procura se o colaborador já possui uma linha na planilha para ATUALIZAR
    if (lastRow > 1) {
      var values = sheet.getRange(2, 1, lastRow - 1, 14).getValues();
      for (var i = 0; i < values.length; i++) {
        var rowRe = cleanRe(values[i][0]);
        var rowSession = String(values[i][13]).trim();
        
        if (isGeneric) {
          // STIHL é genérico: atualiza pelo ID da sessão
          if (rowRe === "STIHL" && rowSession === sessionId) {
            targetRow = i + 2;
            break;
          }
        } else {
          // RE padrão: compara de forma normalizada (028885 == 28885)
          if (rowRe === normalizedRe) {
            targetRow = i + 2;
            break;
          }
        }
      }
    }
    
    var timestamp = Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");
    
    var rowData = [
      "'" + rawRe, // Força texto com apóstrofo para manter os zeros à esquerda no Excel/Sheets
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
      data.status || "completed",
      timestamp,
      sessionId
    ];
    
    if (targetRow > 0) {
      // Atualiza a linha existente do colaborador (sem criar novas linhas)
      sheet.getRange(targetRow, 1, 1, 14).setValues([rowData]);
    } else {
      // Adiciona uma única linha nova
      sheet.appendRow(rowData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ result: "success", re: rawRe, updatedRow: targetRow }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    try {
      lock.releaseLock();
    } catch (l) {}
  }
}

function doGet(e) {
  return ContentService.createTextOutput("SIPAT Manserv 2026 Webhook Online!");
}
