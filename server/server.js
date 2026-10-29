const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const app = express();
let PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

const DB_PATH = path.join(__dirname, '..', 'data', 'database.json');
const CONFIG_PATH = path.join(__dirname, '..', 'data', 'config.json');
const XLSX_PATH = path.join(__dirname, '..', 'data', 'lista_nomes.xlsx');
const EMPLOYEES_JSON_PATH = path.join(__dirname, '..', 'data', 'employees.json');
let cachedEmployees = null;

// Load and cache authorized employees from lista_nomes.xlsx
function loadAuthorizedEmployees(forceReload = false) {
  if (cachedEmployees && !forceReload) {
    return cachedEmployees;
  }

  const employees = [];
  if (fs.existsSync(XLSX_PATH)) {
    try {
      const wb = xlsx.readFile(XLSX_PATH);
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

      if (rawRows && rawRows.length > 1) {
        // Skip header row: ["RE", "FUNCIONÁRIO"]
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row[0] == null) continue;
          const rawRe = String(row[0]).trim();
          const rawName = String(row[1] || '').trim();
          if (!rawRe) continue;

          employees.push({
            re: rawRe,
            name: rawName || 'Colaborador Manserv'
          });
        }
      }
    } catch (err) {
      console.error('Error reading lista_nomes.xlsx:', err.message);
    }
  } else {
    console.warn('lista_nomes.xlsx not found at', XLSX_PATH);
  }

  // Fallback to employees.json if xlsx had issues or was empty
  if (employees.length === 0 && fs.existsSync(EMPLOYEES_JSON_PATH)) {
    try {
      const raw = fs.readFileSync(EMPLOYEES_JSON_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) employees.push(...parsed);
    } catch (e) {
      console.warn('Could not read employees.json fallback:', e.message);
    }
  }

  // Save/sync to employees.json for static client availability
  if (employees.length > 0) {
    try {
      fs.writeFileSync(EMPLOYEES_JSON_PATH, JSON.stringify(employees, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not sync employees.json:', e.message);
    }
  }

  cachedEmployees = employees;
  console.log(`📋 Lista de colaboradores carregada: ${employees.length} registros autorizados.`);
  return employees;
}

// Normalize RE for resilient matching
function normalizeRe(re) {
  if (!re) return '';
  return String(re).trim().toUpperCase();
}

// Check if RE is generic (allows multiple participants)
function isGenericRe(re) {
  return normalizeRe(re) === 'STIHL';
}

// Find employee in authorized list by exact, padded, or numeric match
function findEmployee(inputRe) {
  if (!inputRe) return null;
  const clean = normalizeRe(inputRe);
  const emps = loadAuthorizedEmployees();

  // 1. Direct match (e.g. "009120" or "STIHL")
  let match = emps.find(e => normalizeRe(e.re) === clean);
  if (match) return match;

  // 2. Numeric padding to 6 digits (e.g. "9120" -> "009120")
  if (/^\d+$/.test(clean)) {
    const padded = clean.padStart(6, '0');
    match = emps.find(e => normalizeRe(e.re) === padded);
    if (match) return match;

    // 3. Numeric equivalence
    const num = parseInt(clean, 10);
    match = emps.find(e => /^\d+$/.test(e.re) && parseInt(e.re, 10) === num);
    if (match) return match;
  }

  return null;
}

// Initialize database if it doesn't exist
function initDb() {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2), 'utf-8');
  }

  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(
      CONFIG_PATH,
      JSON.stringify(
        {
          webhookUrl: '',
          eventName: 'SIPAT MANSERV 2026',
          maxPoints: 1000
        },
        null,
        2
      ),
      'utf-8'
    );
  }

  loadAuthorizedEmployees(true);
}

initDb();

function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database:', err);
    return [];
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
  }
}

function readConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { webhookUrl: '' };
  }
}

function writeConfig(data) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

// Forward to external webhook if configured (e.g. Google Sheets)
async function forwardToWebhook(payload) {
  const config = readConfig();
  if (!config.webhookUrl) return;

  try {
    fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.warn('Webhook dispatch failed:', err.message));
  } catch (err) {
    console.warn('Webhook dispatch error:', err.message);
  }
}

// Deadline: 09/11/2026 às 00:00 (GMT-3)
const EVENT_DEADLINE = new Date('2026-11-09T00:00:00-03:00');
const EVENT_DEADLINE_MS = EVENT_DEADLINE.getTime();

function isEventClosed() {
  return Date.now() >= EVENT_DEADLINE_MS;
}

// GET /api/event-status - Return deadline and current event state
app.get('/api/event-status', (req, res) => {
  res.json({
    deadline: '2026-11-09T00:00:00-03:00',
    deadlineFormatted: '09/11/2026 00:00 GMT-3',
    deadlineMs: EVENT_DEADLINE_MS,
    isClosed: isEventClosed(),
    now: new Date().toISOString()
  });
});

// GET /api/employees - Return list of authorized employees
app.get('/api/employees', (req, res) => {
  const list = loadAuthorizedEmployees();
  res.json({ count: list.length, employees: list });
});

// POST /api/check-re - Validate RE against lista_nomes.xlsx & enforce single-attempt policy (except STIHL)
app.post('/api/check-re', (req, res) => {
  const { re, sessionId } = req.body;
  const cleanInput = (re || '').trim();

  if (!cleanInput) {
    return res.status(400).json({
      authorized: false,
      error: 'Por favor, informe seu RE para acessar a SIPAT 2026.'
    });
  }

  // 1. Check against lista_nomes.xlsx
  const employee = findEmployee(cleanInput);
  if (!employee) {
    return res.status(403).json({
      authorized: false,
      error: 'Acesso não autorizado: O RE informado não foi encontrado na lista oficial de colaboradores da SIPAT Manserv 2026. Verifique o número digitado.'
    });
  }

  const db = readDb();
  const clientSessionId = (sessionId || '').trim();
  const isGeneric = isGenericRe(employee.re);

  // Check if event deadline has passed (09/11/2026 00:00 GMT-3)
  if (isEventClosed()) {
    const existing = db.find(p => {
      if (isGeneric) {
        return clientSessionId && isGenericRe(p.re) && p.sessionId === clientSessionId;
      }
      return (
        normalizeRe(p.re) === normalizeRe(employee.re) ||
        (findEmployee(p.re)?.re === employee.re)
      );
    });

    if (existing) {
      return res.json({
        authorized: true,
        isContinuing: true,
        isClosed: true,
        re: employee.re,
        name: employee.name,
        sessionId: existing.sessionId,
        player: existing,
        message: 'O período de participação nos jogos foi encerrado em 09/11/2026 às 00:00 (GMT-3). Seus dados e pontuação estão disponíveis para consulta.'
      });
    }

    return res.status(403).json({
      authorized: false,
      closed: true,
      error: 'O período de participação nos jogos da SIPAT Manserv 2026 foi encerrado em 09/11/2026 às 00:00 (GMT-3). Novos cadastros e jogos estão bloqueados.'
    });
  }

  // Special handling for generic RE (STIHL): allows multiple users simultaneously
  if (isGeneric) {
    const existingGeneric = clientSessionId 
      ? db.find(p => isGenericRe(p.re) && p.sessionId === clientSessionId)
      : null;

    if (existingGeneric) {
      const isCompleted = Boolean(existingGeneric.isSubmitted || existingGeneric.status === 'completed');
      return res.json({
        authorized: true,
        isContinuing: true,
        isGeneric: true,
        isCompleted,
        re: employee.re,
        name: employee.name,
        sessionId: existingGeneric.sessionId,
        player: existingGeneric,
        message: isCompleted
          ? 'Você já concluiu sua participação na SIPAT Manserv 2026 como Colaborador STIHL!'
          : 'Sessão STIHL retomada com sucesso! Continue acumulando pontos nos desafios.'
      });
    }

    // New independent player using generic STIHL RE
    const newSessionId = clientSessionId || ('sess_stihl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
    const newPlayer = {
      id: 'manserv_stihl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      re: employee.re,
      email: employee.re,
      name: employee.name,
      sector: 'STIHL',
      sessionId: newSessionId,
      isGeneric: true,
      scores: {
        level1: 0,
        level2: 0,
        level3: 0,
        level4: 0,
        level5: 0,
        level6: 0
      },
      totalScore: 0,
      maxPossible: 1000,
      completedCount: 0,
      status: 'in_progress',
      isSubmitted: false,
      firstPlayedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'Desconhecido'
    };

    db.push(newPlayer);
    writeDb(db);

    return res.json({
      authorized: true,
      isNew: true,
      isGeneric: true,
      re: employee.re,
      name: employee.name,
      sessionId: newSessionId,
      player: newPlayer,
      message: `Bem-vindo(a)! Acesso genérico STIHL iniciado com sucesso.`
    });
  }

  // Standard RE single-attempt check
  const existingIdx = db.findIndex(p => {
    if (!p.re) return false;
    const match = findEmployee(p.re);
    return (match && match.re === employee.re) || normalizeRe(p.re) === normalizeRe(employee.re);
  });

  if (existingIdx >= 0) {
    const existing = db[existingIdx];

    // Check if the current client is the SAME user continuing their session
    const isSameSession = Boolean(
      clientSessionId &&
      existing.sessionId &&
      existing.sessionId === clientSessionId
    );

    if (isSameSession) {
      // User is continuing their registered session
      const isCompleted = Boolean(existing.isSubmitted || existing.status === 'completed');
      return res.json({
        authorized: true,
        isContinuing: true,
        isCompleted,
        re: employee.re,
        name: employee.name,
        sessionId: existing.sessionId,
        player: existing,
        message: isCompleted
          ? 'Você já concluiu sua participação na SIPAT Manserv 2026! Confira seus resultados.'
          : 'Sessão retomada com sucesso! Continue acumulando pontos nos desafios.'
      });
    } else {
      // Different session or unregistered device trying to use an already registered RE
      return res.status(409).json({
        authorized: false,
        alreadyRegistered: true,
        re: employee.re,
        name: employee.name,
        error: `Acesso bloqueado: O RE ${employee.re} (${employee.name}) já foi registrado neste ou em outro dispositivo. Não é permitida mais de uma tentativa por colaborador.`
      });
    }
  }

  // New valid registration for standard RE
  const newSessionId = clientSessionId || ('sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
  const newPlayer = {
    id: 'manserv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    re: employee.re,
    email: employee.re,
    name: employee.name,
    sector: 'Manserv',
    sessionId: newSessionId,
    scores: {
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0,
      level5: 0,
      level6: 0
    },
    totalScore: 0,
    maxPossible: 1000,
    completedCount: 0,
    status: 'in_progress',
    isSubmitted: false,
    firstPlayedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    userAgent: req.headers['user-agent'] || 'Desconhecido'
  };

  db.push(newPlayer);
  writeDb(db);

  res.json({
    authorized: true,
    isNew: true,
    re: employee.re,
    name: employee.name,
    sessionId: newSessionId,
    player: newPlayer,
    message: `Bem-vindo(a), ${employee.name}! Seu RE foi autorizado com sucesso.`
  });
});

// GET /api/player/:identifier - Fetch existing progress by RE or email
app.get('/api/player/:identifier', (req, res) => {
  const identifier = (req.params.identifier || '').trim();
  const sessionId = (req.query.sessionId || '').trim();
  if (!identifier) return res.status(400).json({ error: 'RE inválido' });

  const employee = findEmployee(identifier);
  const targetRe = employee ? employee.re : identifier;
  const isGeneric = isGenericRe(targetRe);

  const db = readDb();
  const playerRecord = db.find(p => {
    if (!p.re) return false;
    if (isGeneric) {
      return isGenericRe(p.re) && (!sessionId || p.sessionId === sessionId);
    }
    return (
      (normalizeRe(p.re) === normalizeRe(targetRe) || (employee && findEmployee(p.re)?.re === employee.re)) ||
      (p.email && p.email.toLowerCase() === identifier.toLowerCase())
    );
  });

  if (playerRecord) {
    if (employee && !playerRecord.name) {
      playerRecord.name = employee.name;
    }
    res.json({ found: true, player: playerRecord, employee });
  } else {
    res.json({ found: false, employee: employee || null });
  }
});

// POST /api/save-score - Save or update score by RE
app.post('/api/save-score', (req, res) => {
  const { re, email, name, sector, scores, totalScore, completedCount, status, sessionId, isFinalSubmission } = req.body;
  const cleanInput = (re || email || '').trim();

  if (!cleanInput) {
    return res.status(400).json({ error: 'RE do colaborador é obrigatório' });
  }

  // Check if event deadline has passed (09/11/2026 00:00 GMT-3)
  if (isEventClosed()) {
    return res.status(403).json({
      success: false,
      closed: true,
      error: 'O acesso aos jogos e o envio de pontuações foram encerrados em 09/11/2026 às 00:00 (GMT-3).'
    });
  }

  // Verify RE in lista_nomes.xlsx
  const employee = findEmployee(cleanInput);
  const officialRe = employee ? employee.re : cleanInput;
  const officialName = employee ? employee.name : (name || 'Colaborador Manserv').trim();
  const isGeneric = isGenericRe(cleanInput) || isGenericRe(officialRe);

  const db = readDb();
  const existingIdx = db.findIndex(p => {
    if (!p.re) return false;
    if (isGeneric) {
      // For generic RE (STIHL), match the user's specific sessionId
      return isGenericRe(p.re) && sessionId && p.sessionId === sessionId;
    }
    return (
      (normalizeRe(p.re) === normalizeRe(officialRe) || (employee && findEmployee(p.re)?.re === employee.re)) ||
      (p.email && p.email.toLowerCase() === cleanInput.toLowerCase())
    );
  });

  const cleanScores = {
    level1: Number(scores?.level1 || 0),
    level2: Number(scores?.level2 || 0),
    level3: Number(scores?.level3 || 0),
    level4: Number(scores?.level4 || 0),
    level5: Number(scores?.level5 || 0),
    level6: Number(scores?.level6 || 0)
  };

  const calculatedTotal = Object.values(cleanScores).reduce((acc, curr) => acc + curr, 0);

  // Attempt & Session verification
  if (existingIdx >= 0) {
    const existing = db[existingIdx];
    // If sessionId provided and doesn't match
    if (!isGeneric && sessionId && existing.sessionId && existing.sessionId !== sessionId) {
      return res.status(403).json({
        error: 'Sessão inválida para este colaborador. Tentativa não autorizada.'
      });
    }

    // Preserve highest scores
    const mergedScores = {
      level1: Math.max(existing.scores?.level1 || 0, cleanScores.level1),
      level2: Math.max(existing.scores?.level2 || 0, cleanScores.level2),
      level3: Math.max(existing.scores?.level3 || 0, cleanScores.level3),
      level4: Math.max(existing.scores?.level4 || 0, cleanScores.level4),
      level5: Math.max(existing.scores?.level5 || 0, cleanScores.level5),
      level6: Math.max(existing.scores?.level6 || 0, cleanScores.level6)
    };
    const mergedTotal = Object.values(mergedScores).reduce((acc, curr) => acc + curr, 0);

    const isDone = isFinalSubmission || status === 'completed' || completedCount >= 6 || existing.status === 'completed';

    const record = {
      ...existing,
      re: officialRe,
      email: officialRe,
      name: officialName,
      sector: isGeneric ? 'STIHL' : (sector || existing.sector || 'Manserv').trim(),
      scores: mergedScores,
      totalScore: mergedTotal,
      completedCount: Math.max(Number(completedCount || 0), existing.completedCount || 0),
      status: isDone ? 'completed' : 'in_progress',
      isSubmitted: isDone,
      submittedAt: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || existing.userAgent || 'Desconhecido'
    };

    db[existingIdx] = record;
    writeDb(db);
    forwardToWebhook(record);

    return res.json({
      success: true,
      message: 'Pontuação sincronizada com sucesso no banco de dados da Manserv!',
      data: record
    });
  } else {
    // Brand new record
    const record = {
      id: isGeneric 
        ? ('manserv_stihl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5))
        : ('manserv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)),
      re: officialRe,
      email: officialRe,
      name: officialName,
      sector: isGeneric ? 'STIHL' : (sector || 'Manserv').trim(),
      sessionId: sessionId || ('sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)),
      isGeneric: Boolean(isGeneric),
      scores: cleanScores,
      totalScore: calculatedTotal,
      maxPossible: 1000,
      completedCount: Number(completedCount || 0),
      status: isFinalSubmission || completedCount >= 6 ? 'completed' : 'in_progress',
      isSubmitted: Boolean(isFinalSubmission || completedCount >= 6),
      submittedAt: new Date().toISOString(),
      firstPlayedAt: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'Desconhecido'
    };

    db.push(record);
    writeDb(db);
    forwardToWebhook(record);

    return res.json({
      success: true,
      message: 'Pontuação salva com sucesso no banco de dados da Manserv!',
      data: record
    });
  }
});

// POST /api/admin/reset-player - Allow admin to release/reset an RE
app.post('/api/admin/reset-player', (req, res) => {
  const { re, sessionId } = req.body;
  if (!re) return res.status(400).json({ error: 'RE é obrigatório para reset' });

  const db = readDb();
  const employee = findEmployee(re);
  const targetRe = employee ? employee.re : normalizeRe(re);
  const isGeneric = isGenericRe(targetRe);

  const initialLen = db.length;
  const filtered = db.filter(p => {
    if (!p.re) return true;
    if (isGeneric) {
      if (sessionId) {
        return !(isGenericRe(p.re) && p.sessionId === sessionId);
      }
      return !isGenericRe(p.re);
    }
    const match = findEmployee(p.re);
    return !(normalizeRe(p.re) === targetRe || (match && match.re === targetRe));
  });

  if (filtered.length !== initialLen) {
    writeDb(filtered);
    return res.json({ success: true, message: `RE ${targetRe} liberado com sucesso para novo registro.` });
  }

  res.status(404).json({ error: 'RE não encontrado no banco de dados.' });
});

// GET /api/leaderboard - Top rankings
app.get('/api/leaderboard', (req, res) => {
  const db = readDb();
  const sorted = [...db]
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return new Date(a.submittedAt) - new Date(b.submittedAt);
    })
    .slice(0, 50)
    .map((p, idx) => ({
      rank: idx + 1,
      name: p.name || 'Colaborador Manserv',
      re: p.re || p.email,
      sector: p.sector,
      totalScore: p.totalScore,
      completedCount: p.completedCount,
      submittedAt: p.submittedAt
    }));

  res.json(sorted);
});

// GET /api/results - Full results for admin
app.get('/api/results', (req, res) => {
  const db = readDb();
  const totalParticipants = db.length;
  const avgScore = totalParticipants
    ? Math.round(db.reduce((acc, p) => acc + (p.totalScore || 0), 0) / totalParticipants)
    : 0;
  const completedFull = db.filter(p => p.completedCount === 6 || p.status === 'completed').length;

  res.json({
    summary: {
      totalParticipants,
      avgScore,
      completedFull,
      completionRate: totalParticipants ? Math.round((completedFull / totalParticipants) * 100) : 0
    },
    players: db
  });
});

// GET /api/export-csv - Downloadable CSV with Nome column
app.get('/api/export-csv', (req, res) => {
  const db = readDb();
  const headers = [
    'ID',
    'RE',
    'Nome_Colaborador',
    'Setor',
    'Nivel_1_Caca_Palavras',
    'Nivel_2_Forca',
    'Nivel_3_Questionario',
    'Nivel_4_Tomada_Decisao',
    'Nivel_5_Encontre_Riscos',
    'Nivel_6_Cruzadinha',
    'Pontuacao_Total',
    'Jogos_Concluidos',
    'Status',
    'Data_Primeiro_Acesso',
    'Data_Ultimo_Envio'
  ];

  const rows = db.map(p => [
    `"${p.id || ''}"`,
    `"${p.re || p.email || ''}"`,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    `"${p.sector || (isGenericRe(p.re) ? 'STIHL' : 'Manserv')}"`,
    p.scores?.level1 || 0,
    p.scores?.level2 || 0,
    p.scores?.level3 || 0,
    p.scores?.level4 || 0,
    p.scores?.level5 || 0,
    p.scores?.level6 || 0,
    p.totalScore || 0,
    p.completedCount || 0,
    `"${p.status || ''}"`,
    `"${p.firstPlayedAt || ''}"`,
    `"${p.submittedAt || ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="sipat_manserv_2026_resultados.csv"');
  res.send(csvContent);
});

// GET/POST Webhook and Admin Config
app.get('/api/config', (req, res) => {
  const cfg = readConfig();
  res.json({
    ...cfg,
    deadline: '2026-11-09T00:00:00-03:00',
    deadlineFormatted: '09/11/2026 00:00 GMT-3',
    deadlineMs: EVENT_DEADLINE_MS,
    isClosed: isEventClosed()
  });
});

app.post('/api/config', (req, res) => {
  const { webhookUrl } = req.body;
  const cfg = readConfig();
  cfg.webhookUrl = webhookUrl || '';
  writeConfig(cfg);
  res.json({ success: true, config: cfg });
});

function startServer(portToTry) {
  const server = app.listen(portToTry, () => {
    PORT = portToTry;
    console.log(`=========================================`);
    console.log(`🚀 SIPAT MANSERV 2026 Game Server Ativo!`);
    console.log(`🌐 Acesse em: http://localhost:${PORT}`);
    console.log(`📁 Banco de dados: ${DB_PATH}`);
    console.log(`=========================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Porta ${portToTry} ocupada, tentando ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
