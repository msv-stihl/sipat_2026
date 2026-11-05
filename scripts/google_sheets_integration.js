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
 * - Bloqueio de múltiplas tentativas entre dispositivos (Verificação em Nuvem).
 * - Suporte a zeros à esquerda no RE (ex: 028885).
 * - Acesso genérico STIHL suporta múltiplos colaboradores independentes.
 * - Fornece dados para Ranking e verificação de RE instantânea.
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
    var existingRowValues = null;
    
    // Procura se o colaborador já possui uma linha na planilha para ATUALIZAR
    if (lastRow > 1) {
      var values = sheet.getRange(2, 1, lastRow - 1, 14).getValues();
      for (var i = 0; i < values.length; i++) {
        var rowRe = cleanRe(values[i][0]);
        var rowSession = String(values[i][13] || "").trim();
        
        if (isGeneric) {
          // STIHL é genérico: atualiza pelo ID da sessão
          if (rowRe === "STIHL" && rowSession === sessionId) {
            targetRow = i + 2;
            existingRowValues = values[i];
            break;
          }
        } else {
          // RE padrão: compara de forma normalizada (028885 == 28885)
          if (rowRe === normalizedRe) {
            targetRow = i + 2;
            existingRowValues = values[i];
            break;
          }
        }
      }
    }
    
    var timestamp = Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");
    
    // Preserva e mescla com a pontuação mais alta se já existir registro
    var finalL1 = Number(scores.level1 || 0);
    var finalL2 = Number(scores.level2 || 0);
    var finalL3 = Number(scores.level3 || 0);
    var finalL4 = Number(scores.level4 || 0);
    var finalL5 = Number(scores.level5 || 0);
    var finalL6 = Number(scores.level6 || 0);
    var finalTotal = Number(data.totalScore || 0);
    var finalCompleted = Number(data.completedCount || 0);
    var finalSession = sessionId;
    
    if (existingRowValues) {
      finalL1 = Math.max(Number(existingRowValues[3] || 0), finalL1);
      finalL2 = Math.max(Number(existingRowValues[4] || 0), finalL2);
      finalL3 = Math.max(Number(existingRowValues[5] || 0), finalL3);
      finalL4 = Math.max(Number(existingRowValues[6] || 0), finalL4);
      finalL5 = Math.max(Number(existingRowValues[7] || 0), finalL5);
      finalL6 = Math.max(Number(existingRowValues[8] || 0), finalL6);
      finalTotal = Math.max(Number(existingRowValues[9] || 0), finalTotal, finalL1 + finalL2 + finalL3 + finalL4 + finalL5 + finalL6);
      finalCompleted = Math.max(Number(existingRowValues[10] || 0), finalCompleted);
      finalSession = String(existingRowValues[13] || sessionId).trim();
    }
    
    var rowData = [
      "'" + rawRe, // Força texto com apóstrofo para manter os zeros à esquerda no Excel/Sheets
      data.name || (existingRowValues ? existingRowValues[1] : "Colaborador"),
      data.sector || (isGeneric ? "STIHL" : "Manserv"),
      finalL1,
      finalL2,
      finalL3,
      finalL4,
      finalL5,
      finalL6,
      finalTotal,
      finalCompleted,
      data.status || "completed",
      timestamp,
      finalSession
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
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var lastRow = sheet.getLastRow();
    
    // 1. Verificação de RE (checkRe)
    if (e && e.parameter && e.parameter.checkRe) {
      var targetRe = cleanRe(e.parameter.checkRe);
      var clientSessionId = String(e.parameter.sessionId || "").trim();
      var isGeneric = (targetRe === "STIHL");
      
      if (lastRow > 1) {
        var values = sheet.getRange(2, 1, lastRow - 1, 14).getValues();
        for (var i = 0; i < values.length; i++) {
          var rowRe = cleanRe(values[i][0]);
          var rowSession = String(values[i][13] || "").trim();
          
          if (isGeneric) {
            // STIHL é genérico: só coincide se for a mesma sessão
            if (rowRe === "STIHL" && rowSession && rowSession === clientSessionId) {
              return ContentService.createTextOutput(JSON.stringify({
                exists: true,
                isGeneric: true,
                isSameSession: true,
                player: {
                  re: String(values[i][0]).replace(/^'/, ""),
                  name: values[i][1],
                  sector: values[i][2],
                  scores: {
                    level1: Number(values[i][3] || 0),
                    level2: Number(values[i][4] || 0),
                    level3: Number(values[i][5] || 0),
                    level4: Number(values[i][6] || 0),
                    level5: Number(values[i][7] || 0),
                    level6: Number(values[i][8] || 0)
                  },
                  totalScore: Number(values[i][9] || 0),
                  completedCount: Number(values[i][10] || 0),
                  status: String(values[i][11] || ""),
                  submittedAt: String(values[i][12] || ""),
                  sessionId: rowSession
                }
              })).setMimeType(ContentService.MimeType.JSON);
            }
          } else {
            // RE padrão: confere por número/código (028885 == 28885)
            if (rowRe === targetRe) {
              var isSame = Boolean(clientSessionId && rowSession && rowSession === clientSessionId);
              return ContentService.createTextOutput(JSON.stringify({
                exists: true,
                isGeneric: false,
                isSameSession: isSame,
                player: {
                  re: String(values[i][0]).replace(/^'/, ""),
                  name: values[i][1],
                  sector: values[i][2],
                  scores: {
                    level1: Number(values[i][3] || 0),
                    level2: Number(values[i][4] || 0),
                    level3: Number(values[i][5] || 0),
                    level4: Number(values[i][6] || 0),
                    level5: Number(values[i][7] || 0),
                    level6: Number(values[i][8] || 0)
                  },
                  totalScore: Number(values[i][9] || 0),
                  completedCount: Number(values[i][10] || 0),
                  status: String(values[i][11] || ""),
                  submittedAt: String(values[i][12] || ""),
                  sessionId: rowSession
                }
              })).setMimeType(ContentService.MimeType.JSON);
            }
          }
        }
      }
      
      // RE não encontrado na planilha
      return ContentService.createTextOutput(JSON.stringify({
        exists: false,
        isGeneric: isGeneric
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. Ranking Geral (action=leaderboard)
    if (e && e.parameter && e.parameter.action === "leaderboard") {
      var players = [];
      if (lastRow > 1) {
        var rows = sheet.getRange(2, 1, lastRow - 1, 14).getValues();
        for (var j = 0; j < rows.length; j++) {
          var rRe = String(rows[j][0]).replace(/^'/, "").trim();
          if (!rRe) continue;
          players.push({
            re: rRe,
            name: String(rows[j][1] || "Colaborador"),
            sector: String(rows[j][2] || "Manserv"),
            scores: {
              level1: Number(rows[j][3] || 0),
              level2: Number(rows[j][4] || 0),
              level3: Number(rows[j][5] || 0),
              level4: Number(rows[j][6] || 0),
              level5: Number(rows[j][7] || 0),
              level6: Number(rows[j][8] || 0)
            },
            totalScore: Number(rows[j][9] || 0),
            completedCount: Number(rows[j][10] || 0),
            status: String(rows[j][11] || "completed"),
            submittedAt: String(rows[j][12] || "")
          });
        }
      }
      // Ordena por pontuação decrescente
      players.sort(function(a, b) {
        return (b.totalScore || 0) - (a.totalScore || 0);
      });
      // Adiciona o rank 1º, 2º...
      for (var k = 0; k < players.length; k++) {
        players[k].rank = k + 1;
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        count: players.length,
        leaderboard: players
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 3. Status padrão quando acessado via navegador
    return ContentService.createTextOutput("SIPAT Manserv 2026 Webhook Online!");
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
