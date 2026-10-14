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
      email: '',
      name: '',
      sector: ''
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
      this.notify();
    } catch (e) {
      console.warn('Failed to save local state:', e);
    }
  }

  setPlayer(email, name, sector) {
    this.player.email = (email || '').trim().toLowerCase();
    this.player.name = (name || '').trim();
    this.player.sector = (sector || '').trim();
    this.save();
  }

  hasValidPlayer() {
    return Boolean(this.player.email && this.player.email.includes('@'));
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

    // Auto-sync in background if player email is present
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

  async syncWithBackend(isFinalSubmission = false) {
    if (!this.hasValidPlayer()) return { success: false, error: 'Email não informado' };

    const payload = {
      email: this.player.email,
      name: this.player.name,
      sector: this.player.sector,
      scores: this.scores,
      totalScore: this.getTotalScore(),
      completedCount: this.getCompletedCount(),
      status: isFinalSubmission ? 'submitted' : (this.getCompletedCount() >= 6 ? 'completed' : 'in_progress')
    };

    try {
      const res = await fetch('/api/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Falha ao salvar no servidor');
      }

      const result = await res.json();
      if (isFinalSubmission) {
        this.isSubmitted = true;
        this.lastSubmittedAt = new Date().toISOString();
        this.save();
      }
      return { success: true, data: result };
    } catch (err) {
      console.warn('Backend sync failed, state preserved locally:', err);
      if (isFinalSubmission) {
        this.isSubmitted = true;
        this.lastSubmittedAt = new Date().toISOString();
        this.save();
      }
      return { success: true, localOnly: true, message: 'Salvo no navegador (offline)' };
    }
  }

  async checkExistingPlayer(email) {
    if (!email) return null;
    try {
      const res = await fetch(`/api/player/${encodeURIComponent(email.trim().toLowerCase())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.found && data.player) {
          const p = data.player;
          this.player.email = p.email;
          this.player.name = p.name || this.player.name;
          this.player.sector = p.sector || this.player.sector;
          if (p.scores) {
            // merge taking highest
            for (const key of Object.keys(this.scores)) {
              if (p.scores[key] !== undefined) {
                this.scores[key] = Math.max(this.scores[key], p.scores[key]);
                if (this.scores[key] >= this.maxPoints[key] * 0.7) {
                  this.completed[key] = true;
                }
              }
            }
          }
          this.save();
          return p;
        }
      }
    } catch (err) {
      console.warn('Could not check existing player:', err);
    }
    return null;
  }
}

window.gameState = new GameState();
