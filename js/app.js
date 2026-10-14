// Main Application Controller for SIPAT MANSERV 2026
class SipatApp {
  constructor() {
    this.currentGameKey = null;
    this.gameInstances = {};
    this.init();
  }

  init() {
    this.bindGlobalEvents();
    this.subscribeState();
    this.checkUserRegistration();
    this.updateHubUI();
  }

  bindGlobalEvents() {
    // Sound toggle
    const soundBtn = document.getElementById('btn-toggle-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const isMuted = window.sounds?.toggleMute();
        soundBtn.textContent = isMuted ? '🔇' : '🔊';
        soundBtn.title = isMuted ? 'Ativar Sons' : 'Desativar Sons';
      });
    }

    // Header buttons
    document.getElementById('btn-header-submit')?.addEventListener('click', () => {
      this.openSubmitModal();
    });

    document.getElementById('btn-header-leaderboard')?.addEventListener('click', () => {
      this.openLeaderboardModal();
    });

    document.getElementById('btn-header-admin')?.addEventListener('click', () => {
      this.openAdminModal();
    });

    document.getElementById('btn-edit-profile')?.addEventListener('click', () => {
      this.openRegistrationModal(true);
    });

    // Mobile bottom bar submit
    document.getElementById('btn-mobile-submit')?.addEventListener('click', () => {
      this.openSubmitModal();
    });

    // Hub Game Cards Play Buttons
    const levelCards = document.querySelectorAll('.game-card[data-level]');
    levelCards.forEach(card => {
      const levelKey = card.dataset.level;
      const playBtn = card.querySelector('.btn-card-action');
      if (playBtn) {
        playBtn.addEventListener('click', () => {
          this.openGame(levelKey);
        });
      }
      card.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          this.openGame(levelKey);
        }
      });
    });

    // Return to Hub button in game screen header
    document.getElementById('btn-return-hub')?.addEventListener('click', () => {
      this.showHub();
    });

    // Registration Form submit
    const regForm = document.getElementById('registration-form');
    if (regForm) {
      regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegistrationSubmit();
      });
    }

    // Submit Score Confirmation Form
    document.getElementById('btn-confirm-final-send')?.addEventListener('click', () => {
      this.handleFinalScoreSubmission();
    });

    // Webhook form in admin
    const webhookForm = document.getElementById('admin-webhook-form');
    if (webhookForm) {
      webhookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveWebhookUrl();
      });
    }
  }

  subscribeState() {
    window.gameState?.subscribe(() => {
      this.updateHubUI();
    });
  }

  checkUserRegistration() {
    if (!window.gameState?.hasValidPlayer()) {
      this.openRegistrationModal(false);
    } else {
      this.updateProfileDisplay();
    }
  }

  openRegistrationModal(isEditing = false) {
    const modal = document.getElementById('registration-modal');
    if (!modal) return;

    const reInput = document.getElementById('reg-re');
    const nameInput = document.getElementById('reg-name');
    const sectorInput = document.getElementById('reg-sector');

    if (reInput) reInput.value = window.gameState?.player.re || window.gameState?.player.email || '';
    if (nameInput) nameInput.value = window.gameState?.player.name || '';
    if (sectorInput) sectorInput.value = window.gameState?.player.sector || '';

    const cancelBtn = document.getElementById('reg-btn-cancel');
    if (cancelBtn) {
      cancelBtn.style.display = isEditing ? 'inline-block' : 'none';
      cancelBtn.onclick = () => modal.close();
    }

    modal.showModal();
  }

  async handleRegistrationSubmit() {
    const re = document.getElementById('reg-re')?.value.trim();
    const name = document.getElementById('reg-name')?.value.trim();
    const sector = document.getElementById('reg-sector')?.value.trim();

    if (!re) {
      alert('Por favor, informe seu RE para registrar seus pontos.');
      return;
    }

    window.gameState?.setPlayer(re, name, sector);

    // Check if player already had saved progress in database
    await window.gameState?.checkExistingPlayer(re);

    document.getElementById('registration-modal')?.close();
    this.updateProfileDisplay();
    this.updateHubUI();
    window.sounds?.playCorrect();
  }

  updateProfileDisplay() {
    const player = window.gameState?.player;
    const nameEl = document.getElementById('profile-display-name');
    const reEl = document.getElementById('profile-display-re');

    const id = player?.re || player?.email;
    if (nameEl) nameEl.textContent = player?.name || (id ? `RE: ${id}` : 'Colaborador');
    if (reEl) reEl.textContent = id ? `RE: ${id}` : 'Informe seu RE';
  }

  updateHubUI() {
    const totalScore = window.gameState?.getTotalScore() || 0;
    const completedCount = window.gameState?.getCompletedCount() || 0;
    const maxScore = 1000;

    // Header score badges
    const scoreValEl = document.getElementById('header-total-score');
    if (scoreValEl) scoreValEl.textContent = `${totalScore} / ${maxScore}`;

    const scoreProgressEl = document.getElementById('header-score-progress-bar');
    if (scoreProgressEl) {
      const pct = Math.min(100, Math.round((totalScore / maxScore) * 100));
      scoreProgressEl.style.width = `${pct}%`;
    }

    const completedBadge = document.getElementById('header-completed-badge');
    if (completedBadge) {
      completedBadge.textContent = `${completedCount} de 6 Jogos`;
    }

    // Mobile bar
    const mobileScore = document.getElementById('mobile-total-score');
    if (mobileScore) mobileScore.textContent = `${totalScore} pts`;

    // Update each game card on hub
    const cards = document.querySelectorAll('.game-card[data-level]');
    cards.forEach(card => {
      const levelKey = card.dataset.level;
      const score = window.gameState?.scores[levelKey] || 0;
      const max = window.gameState?.maxPoints[levelKey] || 0;
      const isDone = window.gameState?.completed[levelKey];

      const scoreEl = card.querySelector('.card-score-value');
      if (scoreEl) scoreEl.textContent = `${score} / ${max} pts`;

      const statusTag = card.querySelector('.card-status-pill');
      if (statusTag) {
        if (isDone) {
          statusTag.className = 'card-status-pill status-completed';
          statusTag.textContent = '✓ Concluído';
        } else if (score > 0) {
          statusTag.className = 'card-status-pill status-in-progress';
          statusTag.textContent = 'Em Andamento';
        } else {
          statusTag.className = 'card-status-pill status-pending';
          statusTag.textContent = 'Disponível';
        }
      }

      const barEl = card.querySelector('.card-progress-bar-fill');
      if (barEl) {
        const pct = Math.min(100, Math.round((score / max) * 100));
        barEl.style.width = `${pct}%`;
      }

      const actionBtn = card.querySelector('.btn-card-action');
      if (actionBtn) {
        actionBtn.textContent = isDone ? 'Revisar / Jogar ↻' : (score > 0 ? 'Continuar ▶' : 'Jogar Agora ▶');
      }
    });

    this.updateProfileDisplay();
  }

  showHub() {
    window.sounds?.playClick();
    this.currentGameKey = null;

    document.getElementById('hub-view')?.classList.remove('hidden');
    document.getElementById('game-screen-view')?.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.updateHubUI();
  }

  openGame(levelKey) {
    if (!window.gameState?.hasValidPlayer()) {
      this.openRegistrationModal(false);
      return;
    }

    window.sounds?.playClick();
    this.currentGameKey = levelKey;

    document.getElementById('hub-view')?.classList.add('hidden');
    const gameScreen = document.getElementById('game-screen-view');
    gameScreen?.classList.remove('hidden');

    const gameContainer = document.getElementById('active-game-container');
    if (!gameContainer) return;
    gameContainer.innerHTML = '';

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Initialize specific game
    switch (levelKey) {
      case 'level1':
        new window.WordSearchGame('active-game-container').init();
        break;
      case 'level2':
        new window.HangmanGame('active-game-container').init();
        break;
      case 'level3':
        new window.QuizGame('active-game-container').init();
        break;
      case 'level4':
        new window.DecisionGame('active-game-container').init();
        break;
      case 'level5':
        new window.HazardHunterGame('active-game-container').init();
        break;
      case 'level6':
        new window.CrosswordGame('active-game-container').init();
        break;
      default:
        console.error('Unknown game level:', levelKey);
        this.showHub();
    }
  }

  openSubmitModal() {
    window.sounds?.playClick();
    const modal = document.getElementById('submit-results-modal');
    if (!modal) return;

    const player = window.gameState?.player;
    const scores = window.gameState?.scores;
    const maxPoints = window.gameState?.maxPoints;
    const total = window.gameState?.getTotalScore();
    const completedCount = window.gameState?.getCompletedCount();

    document.getElementById('summary-re').textContent = player?.re || player?.email || 'Não informado';
    document.getElementById('summary-name').textContent = player?.name || 'Colaborador';
    document.getElementById('summary-sector').textContent = player?.sector || 'Geral';
    document.getElementById('summary-total-score').textContent = `${total} / 1000 pontos`;
    document.getElementById('summary-games-done').textContent = `${completedCount} de 6 Jogos Realizados`;

    const levelRows = [
      { key: 'level1', name: 'Nível 1 – Caça-Palavras', max: maxPoints.level1 },
      { key: 'level2', name: 'Nível 2 – Forca', max: maxPoints.level2 },
      { key: 'level3', name: 'Nível 3 – Questionário', max: maxPoints.level3 },
      { key: 'level4', name: 'Nível 4 – Tomada de Decisão', max: maxPoints.level4 },
      { key: 'level5', name: 'Nível 5 – Encontre os Riscos', max: maxPoints.level5 },
      { key: 'level6', name: 'Nível 6 – Cruzadinha', max: maxPoints.level6 }
    ];

    const tbody = document.getElementById('summary-breakdown-tbody');
    if (tbody) {
      tbody.innerHTML = levelRows.map(lvl => {
        const score = scores[lvl.key] || 0;
        const isDone = window.gameState?.completed[lvl.key];
        return `
          <tr>
            <td><strong>${lvl.name}</strong></td>
            <td>${isDone ? '<span class="text-success">Concluído</span>' : (score > 0 ? '<span class="text-warning">Em Andamento</span>' : '<span class="text-dim">Pendente</span>')}</td>
            <td class="text-right"><strong>${score}</strong> / ${lvl.max} pts</td>
          </tr>
        `;
      }).join('');
    }

    const feedbackNotice = document.getElementById('submit-notice-text');
    if (feedbackNotice) {
      if (completedCount < 6) {
        feedbackNotice.innerHTML = `ℹ️ <em>Aviso: Você realizou ${completedCount} de 6 jogos. Não é obrigatório terminar todos; sua pontuação de ${total} pontos será registrada com sucesso! Você poderá retornar depois para somar mais pontos.</em>`;
      } else {
        feedbackNotice.innerHTML = `🎉 <em>Sensacional! Você completou os 6 níveis da SIPAT Manserv 2026 com ${total} pontos!</em>`;
      }
    }

    modal.showModal();
  }

  async handleFinalScoreSubmission() {
    const btn = document.getElementById('btn-confirm-final-send');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Enviando para o Banco de Dados...';
    }

    const res = await window.gameState?.syncWithBackend(true);

    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Confirmar Envio para o Banco de Dados 🚀';
    }

    document.getElementById('submit-results-modal')?.close();

    window.sounds?.playLevelComplete();
    window.triggerConfetti?.(3500);

    // Show celebration & certificate modal
    this.openCertificateModal();
  }

  openCertificateModal() {
    const modal = document.getElementById('certificate-modal');
    if (!modal) return;

    const player = window.gameState?.player;
    const total = window.gameState?.getTotalScore();
    const id = player?.re || player?.email;

    document.getElementById('cert-player-name').textContent = player?.name || (id ? `RE: ${id}` : 'Colaborador');
    document.getElementById('cert-player-sector').textContent = player?.sector || 'Manserv Industrial';
    document.getElementById('cert-score').textContent = `${total} PONTOS`;
    document.getElementById('cert-date').textContent = new Date().toLocaleDateString('pt-BR');

    modal.showModal();
  }

  async openLeaderboardModal() {
    window.sounds?.playClick();
    const modal = document.getElementById('leaderboard-modal');
    if (!modal) return;

    modal.showModal();

    const tbody = document.getElementById('leaderboard-tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Carregando ranking...</td></tr>`;
    }

    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();

      if (!data || data.length === 0) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Nenhum colaborador registrado ainda. Seja o primeiro!</td></tr>`;
        return;
      }

      if (tbody) {
        const playerIdent = (window.gameState?.player.re || window.gameState?.player.email || '').toLowerCase();
        tbody.innerHTML = data.map(item => {
          let rankBadge = `${item.rank}º`;
          if (item.rank === 1) rankBadge = '🥇 1º';
          else if (item.rank === 2) rankBadge = '🥈 2º';
          else if (item.rank === 3) rankBadge = '🥉 3º';

          const itemIdent = (item.re || item.email || '').toLowerCase();
          const isCurrent = Boolean(playerIdent && itemIdent === playerIdent);

          return `
            <tr class="${isCurrent ? 'current-player-row' : ''}">
              <td><strong>${rankBadge}</strong></td>
              <td>${item.name || 'Colaborador'} <small style="color:var(--color-primary); font-weight:700;">(RE: ${item.re || '-'})</small> ${isCurrent ? '<span class="you-badge">(Você)</span>' : ''}</td>
              <td>${item.sector || '-'}</td>
              <td>${item.completedCount}/6</td>
              <td class="text-right"><strong class="text-orange">${item.totalScore} pts</strong></td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      // Fallback for GitHub Pages or offline: read local history
      const localHistory = JSON.parse(localStorage.getItem('sipat_history') || '[]');
      if (localHistory.length > 0 && tbody) {
        const sorted = [...localHistory].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
        const playerIdent = (window.gameState?.player.re || window.gameState?.player.email || '').toLowerCase();
        tbody.innerHTML = sorted.map((item, idx) => {
          const itemIdent = (item.re || item.email || '').toLowerCase();
          const isCurrent = Boolean(playerIdent && itemIdent === playerIdent);
          return `
            <tr class="${isCurrent ? 'current-player-row' : ''}">
              <td><strong>${idx + 1}º</strong></td>
              <td>${item.name || 'Colaborador'} <small style="color:var(--color-primary); font-weight:700;">(RE: ${item.re || '-'})</small> ${isCurrent ? '<span class="you-badge">(Você)</span>' : ''}</td>
              <td>${item.sector || '-'}</td>
              <td>${item.completedCount || 0}/6</td>
              <td class="text-right"><strong class="text-orange">${item.totalScore || 0} pts</strong></td>
            </tr>
          `;
        }).join('');
      } else if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Você é o primeiro participante! Complete um jogo para registrar sua pontuação.</td></tr>`;
      }
    }
  }

  async openAdminModal() {
    window.sounds?.playClick();
    const modal = document.getElementById('admin-modal');
    if (!modal) return;

    modal.showModal();
    this.refreshAdminData();

    // Attach client CSV export handler for GitHub Pages
    const exportBtn = document.getElementById('btn-export-csv');
    if (exportBtn) {
      exportBtn.onclick = (e) => {
        // If on GitHub Pages or static host, trigger browser CSV export directly
        if (window.location.hostname.includes('github.io') || window.location.protocol === 'file:') {
          e.preventDefault();
          this.exportClientCsv();
        }
      };
    }
  }

  exportClientCsv() {
    const history = JSON.parse(localStorage.getItem('sipat_history') || '[]');
    const headers = [
      'ID', 'Nome', 'RE', 'Setor/Unidade',
      'Nivel_1_Caca_Palavras', 'Nivel_2_Forca', 'Nivel_3_Questionario',
      'Nivel_4_Tomada_Decisao', 'Nivel_5_Encontre_Riscos', 'Nivel_6_Cruzadinha',
      'Pontuacao_Total', 'Jogos_Concluidos', 'Status', 'Data_Envio'
    ];

    const rows = history.map(p => [
      `"${p.id || 'local_' + p.re}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.re || p.email || ''}"`,
      `"${(p.sector || '').replace(/"/g, '""')}"`,
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
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sipat_manserv_2026_resultados.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async refreshAdminData() {
    let loadedFromServer = false;

    try {
      const res = await fetch('/api/results');
      if (res.ok) {
        const data = await res.json();
        loadedFromServer = true;

        document.getElementById('admin-total-players').textContent = data.summary.totalParticipants || 0;
        document.getElementById('admin-avg-score').textContent = `${data.summary.avgScore || 0} pts`;
        document.getElementById('admin-completion-rate').textContent = `${data.summary.completionRate || 0}%`;

        const tbody = document.getElementById('admin-players-tbody');
        if (tbody) {
          tbody.innerHTML = (data.players || []).map(p => `
            <tr>
              <td><strong>${p.name || '-'}</strong></td>
              <td><strong>${p.re || p.email || '-'}</strong></td>
              <td>${p.sector || '-'}</td>
              <td>${p.completedCount}/6</td>
              <td><strong>${p.totalScore} pts</strong></td>
              <td><small>${new Date(p.submittedAt).toLocaleString('pt-BR')}</small></td>
            </tr>
          `).join('');
        }
      }
    } catch (err) {
      // Server not reachable
    }

    // Fallback calculation for GitHub Pages / static hosting
    if (!loadedFromServer) {
      const history = JSON.parse(localStorage.getItem('sipat_history') || '[]');
      const total = history.length;
      const avg = total ? Math.round(history.reduce((a, b) => a + (b.totalScore || 0), 0) / total) : 0;
      const completed = history.filter(p => p.completedCount >= 6).length;

      document.getElementById('admin-total-players').textContent = total;
      document.getElementById('admin-avg-score').textContent = `${avg} pts`;
      document.getElementById('admin-completion-rate').textContent = total ? `${Math.round((completed / total) * 100)}%` : '0%';

      const tbody = document.getElementById('admin-players-tbody');
      if (tbody) {
        tbody.innerHTML = history.map(p => `
          <tr>
            <td><strong>${p.name || '-'}</strong></td>
            <td><strong>${p.re || p.email || '-'}</strong></td>
            <td>${p.sector || '-'}</td>
            <td>${p.completedCount || 0}/6</td>
            <td><strong>${p.totalScore || 0} pts</strong></td>
            <td><small>${new Date(p.submittedAt || Date.now()).toLocaleString('pt-BR')}</small></td>
          </tr>
        `).join('');
      }
    }

    // Load config webhook (server or localStorage)
    const input = document.getElementById('admin-webhook-url');
    if (input) {
      const localWebhook = localStorage.getItem('sipat_webhook_url') || '';
      input.value = localWebhook;

      try {
        const cfgRes = await fetch('/api/config');
        if (cfgRes.ok) {
          const cfg = await cfgRes.json();
          if (cfg.webhookUrl) input.value = cfg.webhookUrl;
        }
      } catch (err) {}
    }
  }

  async saveWebhookUrl() {
    const input = document.getElementById('admin-webhook-url');
    const url = input?.value.trim() || '';

    // Always save in localStorage for GitHub Pages
    localStorage.setItem('sipat_webhook_url', url);

    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: url })
      });
    } catch {}

    alert('URL de Webhook configurada com sucesso! As pontuações serão encaminhadas.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new SipatApp();
});
