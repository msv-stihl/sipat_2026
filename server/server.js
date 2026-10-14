const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
let PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

const DB_PATH = path.join(__dirname, '..', 'data', 'database.json');
const CONFIG_PATH = path.join(__dirname, '..', 'data', 'config.json');

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

// GET /api/player/:identifier - Fetch existing progress by RE or email
app.get('/api/player/:identifier', (req, res) => {
  const identifier = (req.params.identifier || '').trim().toLowerCase();
  if (!identifier) return res.status(400).json({ error: 'RE inválido' });

  const db = readDb();
  const playerRecord = db.find(p => 
    (p.re && p.re.toLowerCase() === identifier) || 
    (p.email && p.email.toLowerCase() === identifier)
  );

  if (playerRecord) {
    res.json({ found: true, player: playerRecord });
  } else {
    res.json({ found: false });
  }
});

// POST /api/save-score - Save or update score by RE
app.post('/api/save-score', (req, res) => {
  const { re, email, name, sector, scores, totalScore, completedCount, status } = req.body;
  const cleanRe = (re || email || '').trim();

  if (!cleanRe) {
    return res.status(400).json({ error: 'RE do colaborador é obrigatório' });
  }

  const db = readDb();
  const existingIdx = db.findIndex(p => 
    (p.re && p.re.toLowerCase() === cleanRe.toLowerCase()) ||
    (p.email && p.email.toLowerCase() === cleanRe.toLowerCase())
  );

  const cleanScores = {
    level1: Number(scores?.level1 || 0),
    level2: Number(scores?.level2 || 0),
    level3: Number(scores?.level3 || 0),
    level4: Number(scores?.level4 || 0),
    level5: Number(scores?.level5 || 0),
    level6: Number(scores?.level6 || 0)
  };

  const calculatedTotal = Object.values(cleanScores).reduce((acc, curr) => acc + curr, 0);

  const record = {
    id: existingIdx >= 0 ? db[existingIdx].id : 'manserv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    re: cleanRe,
    email: cleanRe, // mantido para compatibilidade
    name: (name || 'Colaborador Manserv').trim(),
    sector: (sector || 'Geral').trim(),
    scores: cleanScores,
    totalScore: calculatedTotal,
    maxPossible: 1000,
    completedCount: Number(completedCount || 0),
    status: status || (completedCount >= 6 ? 'completed' : 'in_progress'),
    submittedAt: new Date().toISOString(),
    firstPlayedAt: existingIdx >= 0 ? db[existingIdx].firstPlayedAt : new Date().toISOString(),
    userAgent: req.headers['user-agent'] || 'Desconhecido'
  };

  if (existingIdx >= 0) {
    db[existingIdx] = record;
  } else {
    db.push(record);
  }

  writeDb(db);
  forwardToWebhook(record);

  res.json({
    success: true,
    message: 'Pontuação salva com sucesso no banco de dados da Manserv!',
    data: record
  });
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
      name: p.name,
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
  const completedFull = db.filter(p => p.completedCount === 6).length;

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

// GET /api/export-csv - Downloadable CSV
app.get('/api/export-csv', (req, res) => {
  const db = readDb();
  const headers = [
    'ID',
    'RE',
    'Nivel_1_Caca_Palavras',
    'Nivel_2_Forca',
    'Nivel_3_Questionario',
    'Nivel_4_Tomada_Decisao',
    'Nivel_5_Encontre_Riscos',
    'Nivel_6_Cruzadinha',
    'Pontuacao_Total',
    'Jogos_Concluidos',
    'Status',
    'Data_Ultimo_Envio'
  ];

  const rows = db.map(p => [
    `"${p.id || ''}"`,
    `"${p.re || p.email || ''}"`,
    p.scores?.level1 || 0,
    p.scores?.level2 || 0,
    p.scores?.level3 || 0,
    p.scores?.level4 || 0,
    p.scores?.level5 || 0,
    p.scores?.level6 || 0,
    p.totalScore || 0,
    p.completedCount || 0,
    `"${p.status || ''}"`,
    `"${p.submittedAt || ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="sipat_manserv_2026_resultados.csv"');
  res.send(csvContent);
});

// GET/POST Webhook and Admin Config
app.get('/api/config', (req, res) => {
  res.json(readConfig());
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
