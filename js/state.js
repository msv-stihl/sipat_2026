// Global State Management for SIPAT MANSERV 2026
const STATE_STORAGE_KEY = 'manserv_sipat_2026_state_v1';

class GameState {
  constructor() {
    this.maxPoints = {
      level1: 100, // Caça-Palavras
      level2: 120, // Forca
      level3: 150, // Questionário
      level4: 180, // Tomada de Decisão
      level5: 220, // Encontre os Riscos
      level6: 230  // Cruzadinha
    };
    // Sum = 100 + 120 + 150 + 180 + 220 + 230 = 1000 pts

    this.player = {
      re: '',
      email: '',
      name: '',
      sector: '',
      sessionId: ''
    };

    this.scores = {
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0,
      level5: 0,
      level6: 0
    };

    this.completed = {
      level1: false,
      level2: false,
      level3: false,
      level4: false,
      level5: false,
      level6: false
    };

    this.gameDetails = {
      level1: null,
      level2: null,
      level3: null,
      level4: null,
      level5: null,
      level6: null
    };

    this.isSubmitted = false;
    this.lastSubmittedAt = null;

    this.listeners = [];
    this.load();
  }

  getSessionId() {
    let sid = this.player.sessionId || localStorage.getItem('sipat_session_id');
    if (!sid) {
      sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('sipat_session_id', sid);
    }
    this.player.sessionId = sid;
    return sid;
  }

  load() {
    try {
      const raw = localStorage.getItem(STATE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.player) this.player = { ...this.player, ...parsed.player };
        if (parsed.scores) this.scores = { ...this.scores, ...parsed.scores };
        if (parsed.completed) this.completed = { ...this.completed, ...parsed.completed };
        if (parsed.gameDetails) this.gameDetails = { ...this.gameDetails, ...parsed.gameDetails };
        if (parsed.isSubmitted !== undefined) this.isSubmitted = parsed.isSubmitted;
        if (parsed.lastSubmittedAt) this.lastSubmittedAt = parsed.lastSubmittedAt;
      }
      if (!this.player.sessionId) {
        this.player.sessionId = localStorage.getItem('sipat_session_id') || '';
      }
    } catch (e) {
      console.warn('Failed to load local state:', e);
    }
  }

  save() {
    try {
      const data = {
        player: this.player,
        scores: this.scores,
        completed: this.completed,
        gameDetails: this.gameDetails,
        isSubmitted: this.isSubmitted,
        lastSubmittedAt: this.lastSubmittedAt
      };
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(data));
      if (this.player.sessionId) {
        localStorage.setItem('sipat_session_id', this.player.sessionId);
      }
      this.notify();
    } catch (e) {
      console.warn('Failed to save local state:', e);
    }
  }

  setPlayer(re, name = '', sessionId = '') {
    this.player.re = (re || '').trim();
    this.player.email = this.player.re; // mantido para compatibilidade
    this.player.name = (name || this.player.name || '').trim();
    this.player.sector = 'Manserv';
    this.player.sessionId = sessionId || this.player.sessionId || this.getSessionId();
    this.save();
  }

  clearPlayer() {
    this.player = {
      re: '',
      email: '',
      name: '',
      sector: '',
      sessionId: ''
    };
    this.save();
  }

  hasValidPlayer() {
    // Acesso autorizado apenas se tiver RE e Nome verificados
    return Boolean(this.player.re && this.player.name && this.player.re.trim().length > 0);
  }

  setGameScore(levelKey, score, isCompleted = false, details = null) {
    const max = this.maxPoints[levelKey] || 0;
    const clampedScore = Math.min(max, Math.max(0, Math.round(score)));

    // Keep highest score or updated
    this.scores[levelKey] = clampedScore;
    if (isCompleted) {
      this.completed[levelKey] = true;
    }
    if (details) {
      this.gameDetails[levelKey] = details;
    }

    this.save();

    // Auto-sync in background if player is registered
    if (this.hasValidPlayer()) {
      this.syncWithBackend(false);
    }
  }

  getTotalScore() {
    return Object.values(this.scores).reduce((a, b) => a + (Number(b) || 0), 0);
  }

  getCompletedCount() {
    return Object.values(this.completed).filter(Boolean).length;
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    for (const cb of this.listeners) {
      try {
        cb(this);
      } catch (err) {
        console.error('State listener error:', err);
      }
    }
  }

  saveLocalRecord(record) {
    try {
      const history = JSON.parse(localStorage.getItem('sipat_history') || '[]');
      const cleanRec = { ...record, submittedAt: record.submittedAt || new Date().toISOString() };
      const idx = history.findIndex(p => p.re === cleanRec.re);
      if (idx >= 0) history[idx] = cleanRec;
      else history.push(cleanRec);
      localStorage.setItem('sipat_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Local history error:', e);
    }
  }

  async syncWithBackend(isFinalSubmission = false) {
    if (!this.hasValidPlayer()) return { success: false, error: 'RE não informado ou não autorizado' };

    const payload = {
      re: this.player.re || this.player.email,
      email: this.player.re || this.player.email,
      name: this.player.name,
      sector: this.player.sector || 'Manserv',
      sessionId: this.getSessionId(),
      isFinalSubmission: Boolean(isFinalSubmission),
      scores: this.scores,
      totalScore: this.getTotalScore(),
      completedCount: this.getCompletedCount(),
      status: isFinalSubmission ? 'completed' : (this.getCompletedCount() >= 6 ? 'completed' : 'in_progress'),
      submittedAt: new Date().toISOString()
    };

    // Always keep a local copy in browser
    this.saveLocalRecord(payload);

    // Direct client webhook dispatch if configured (e.g. Google Sheets on GitHub Pages)
    const customWebhook = localStorage.getItem('sipat_webhook_url');
    if (customWebhook && isFinalSubmission) {
      try {
        fetch(customWebhook, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});
      } catch (e) {}
    }

    try {
      const res = await fetch('/api/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        if (isFinalSubmission) {
          this.isSubmitted = true;
          this.lastSubmittedAt = new Date().toISOString();
          this.save();
        }
        return { success: true, data: result };
      }
    } catch (err) {
      // Running on static GitHub Pages or server offline
    }

    if (isFinalSubmission) {
      this.isSubmitted = true;
      this.lastSubmittedAt = new Date().toISOString();
      this.save();
    }
    return { success: true, localOnly: true, message: 'Salvo com sucesso!' };
  }

  // Authorize RE against lista_nomes.xlsx & enforce single-attempt
  async checkAndAuthorizeRe(inputRe) {
    const clean = (inputRe || '').trim();
    if (!clean) {
      return { authorized: false, error: 'Por favor, informe seu RE para acessar a SIPAT 2026.' };
    }

    const sessionId = this.getSessionId();

    try {
      const res = await fetch('/api/check-re', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ re: clean, sessionId })
      });

      const data = await res.json();
      if (res.ok && data.authorized) {
        this.setPlayer(data.re, data.name, data.sessionId || sessionId);
        if (data.player && data.player.scores) {
          for (const key of Object.keys(this.scores)) {
            if (data.player.scores[key] !== undefined) {
              this.scores[key] = Math.max(this.scores[key] || 0, data.player.scores[key]);
              if (this.scores[key] >= (this.maxPoints[key] || 0) * 0.7 || data.player.completedCount >= 6) {
                this.completed[key] = true;
              }
            }
          }
        }
        if (data.isCompleted) {
          this.isSubmitted = true;
        }
        this.save();
        return data;
      } else {
        return {
          authorized: false,
          error: data.error || 'Acesso não autorizado para este RE.'
        };
      }
    } catch (netErr) {
      // Static host fallback (e.g. GitHub Pages)
      return await this.fallbackValidateRe(clean, sessionId);
    }
  }

  // Static/offline fallback validator reading data/employees.json
  async fallbackValidateRe(cleanRe, sessionId) {
    try {
      const res = await fetch('data/employees.json');
      if (res.ok) {
        const list = await res.json();
        const norm = cleanRe.toUpperCase();
        let match = list.find(e => (e.re || '').toUpperCase() === norm);
        if (!match && /^\d+$/.test(norm)) {
          const padded = norm.padStart(6, '0');
          match = list.find(e => (e.re || '').toUpperCase() === padded);
          if (!match) {
            const num = parseInt(norm, 10);
            match = list.find(e => /^\d+$/.test(e.re) && parseInt(e.re, 10) === num);
          }
        }

        if (!match) {
          return {
            authorized: false,
            error: 'Acesso não autorizado: O RE informado não foi encontrado na lista oficial de colaboradores da SIPAT Manserv 2026.'
          };
        }

        const isGeneric = (match.re || '').toUpperCase() === 'STIHL';
        const history = JSON.parse(localStorage.getItem('sipat_history') || '[]');

        if (isGeneric) {
          const existingSession = history.find(p => (p.re || '').toUpperCase() === 'STIHL' && p.sessionId === sessionId);
          if (existingSession) {
            this.setPlayer(match.re, match.name, sessionId);
            if (existingSession.scores) {
              for (const k of Object.keys(this.scores)) {
                if (existingSession.scores[k] !== undefined) {
                  this.scores[k] = Math.max(this.scores[k] || 0, existingSession.scores[k]);
                }
              }
            }
            this.save();
            return {
              authorized: true,
              isContinuing: true,
              isGeneric: true,
              re: match.re,
              name: match.name,
              sessionId
            };
          }

          // New independent STIHL participant
          this.setPlayer(match.re, match.name, sessionId);
          return {
            authorized: true,
            isNew: true,
            isGeneric: true,
            re: match.re,
            name: match.name,
            sessionId,
            message: `Bem-vindo(a)! Acesso genérico STIHL iniciado com sucesso.`
          };
        }

        const existing = history.find(p => p.re && p.re.toUpperCase() === match.re.toUpperCase());

        if (existing) {
          if (existing.sessionId && existing.sessionId === sessionId) {
            this.setPlayer(match.re, match.name, sessionId);
            if (existing.scores) {
              for (const k of Object.keys(this.scores)) {
                if (existing.scores[k] !== undefined) {
                  this.scores[k] = Math.max(this.scores[k] || 0, existing.scores[k]);
                }
              }
            }
            this.save();
            return {
              authorized: true,
              isContinuing: true,
              re: match.re,
              name: match.name,
              sessionId
            };
          } else {
            return {
              authorized: false,
              alreadyRegistered: true,
              error: `Acesso bloqueado: O RE ${match.re} (${match.name}) já foi registrado neste ou em outro dispositivo. Não é permitida mais de uma tentativa por colaborador.`
            };
          }
        }

        // New registration
        this.setPlayer(match.re, match.name, sessionId);
        return {
          authorized: true,
          isNew: true,
          re: match.re,
          name: match.name,
          sessionId,
          message: `Bem-vindo(a), ${match.name}!`
        };
      }
    } catch (e) {
      console.warn('Fallback validation error:', e);
    }

    return {
      authorized: false,
      error: 'Não foi possível validar o RE. Por favor, verifique a conexão com o servidor da Manserv.'
    };
  }

  async checkExistingPlayer(identifier) {
    return this.checkAndAuthorizeRe(identifier);
  }
}

window.gameState = new GameState();
