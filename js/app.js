// Main Application Controller for SIPAT MANSERV 2026
class SipatApp {
  constructor() {
    this.currentGameKey = null;
    this.gameInstances = {};
    // Prazo final: 09/11/2026 às 00:00 (GMT-3)
    this.DEADLINE_MS = new Date('2026-11-09T00:00:00-03:00').getTime();
    this.timerInterval = null;
    this.init();
  }

  init() {
    this.bindGlobalEvents();
    this.subscribeState();
    this.startEventTimer();
    this.checkUserRegistration();
    this.updateHubUI();
  }

  isEventExpired() {
    return Date.now() >= this.DEADLINE_MS;
  }

  startEventTimer() {
    const update = () => {
      const now = Date.now();
      const diff = this.DEADLINE_MS - now;

      const activeDisplay = document.getElementById('timer-active-display');
      const expiredDisplay = document.getElementById('timer-expired-display');
      const expiredNotice = document.getElementById('games-expired-notice');
      const daysEl = document.getElementById('timer-days');
      const hoursEl = document.getElementById('timer-hours');
      const minsEl = document.getElementById('timer-mins');
      const secsEl = document.getElementById('timer-secs');

      if (diff <= 0) {
        if (daysEl) daysEl.textContent = '00';
        if (hoursEl) hoursEl.textContent = '00';
        if (minsEl) minsEl.textContent = '00';
        if (secsEl) secsEl.textContent = '00';

        if (activeDisplay) activeDisplay.classList.add('hidden');
        if (expiredDisplay) expiredDisplay.classList.remove('hidden');
        if (expiredNotice) expiredNotice.classList.remove('hidden');

        // Retorna para o hub se um jogo estiver em andamento no momento do encerramento
        if (this.currentGameKey) {
          alert('🔒 O período de jogos da SIPAT Manserv foi encerrado em 09/11/2026 às 00:00 (GMT-3). O acesso aos jogos foi bloqueado.');
          this.showHub();
        }

        this.updateHubUI();
        return;
      }

      if (activeDisplay) activeDisplay.classList.remove('hidden');
      if (expiredDisplay) expiredDisplay.classList.add('hidden');
      if (expiredNotice) expiredNotice.classList.add('hidden');

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;

      if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');
    };

    update();
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(update, 1000);
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
      this.handleProfileClick();
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

  async checkUserRegistration() {
    if (!window.gameState?.hasValidPlayer()) {
      this.openRegistrationModal(false);
    } else {
      // Re-verify existing session with backend to ensure attempt lock
      const currentRe = window.gameState.player.re;
      const res = await window.gameState.checkAndAuthorizeRe(currentRe);
      if (!res.authorized) {
        window.gameState.clearPlayer();
        this.openRegistrationModal(false, res.error);
      } else {
        if (res.name) {
          window.gameState.player.name = res.name;
          window.gameState.save();
        }
        this.updateProfileDisplay();
        this.updateHubUI();
      }
    }
  }

  openRegistrationModal(isEditing = false, errorMsg = '') {
    const modal = document.getElementById('registration-modal');
    if (!modal) return;

    const errorBox = document.getElementById('reg-error-box');
    const successBox = document.getElementById('reg-success-box');
    if (errorBox) {
      if (errorMsg) {
        errorBox.innerHTML = `⚠️ <strong>${errorMsg}</strong>`;
        errorBox.classList.remove('hidden');
      } else {
        errorBox.classList.add('hidden');
      }
    }
    if (successBox) successBox.classList.add('hidden');

    const reInput = document.getElementById('reg-re');
    if (reInput) {
      reInput.value = window.gameState?.player.re || '';
      setTimeout(() => reInput.focus(), 150);
    }

    const cancelBtn = document.getElementById('reg-btn-cancel');
    if (cancelBtn) {
      cancelBtn.style.display = isEditing && window.gameState?.hasValidPlayer() ? 'inline-block' : 'none';
      cancelBtn.onclick = () => modal.close();
    }

    // Prevent closing without registration
    modal.oncancel = (e) => {
      if (!window.gameState?.hasValidPlayer()) {
        e.preventDefault();
      }
    };

    if (!modal.open) {
      modal.showModal();
    }
  }

  async handleRegistrationSubmit() {
    const input = document.getElementById('reg-re');
    const submitBtn = document.getElementById('reg-btn-submit');
    const errorBox = document.getElementById('reg-error-box');
    const successBox = document.getElementById('reg-success-box');

    const re = (input?.value || '').trim();
    if (!re) {
      if (errorBox) {
        errorBox.innerHTML = '⚠️ <strong>Por favor, informe seu RE para acessar a SIPAT 2026.</strong>';
        errorBox.classList.remove('hidden');
      }
      return;
    }

    if (errorBox) errorBox.classList.add('hidden');
    if (successBox) successBox.classList.add('hidden');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verificando lista autorizada... ⏳';
    }

    const check = await window.gameState?.checkAndAuthorizeRe(re);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Verificar e Iniciar Missão SIPAT ▶';
    }

    if (!check?.authorized) {
      window.sounds?.playWrong?.();
      if (errorBox) {
        errorBox.innerHTML = `⚠️ <strong>${check?.error || 'Acesso não autorizado para este RE.'}</strong>`;
        errorBox.classList.remove('hidden');
      }
      return;
    }

    // Authorized!
    window.sounds?.playCorrect?.();
    if (successBox) {
      successBox.innerHTML = `✅ <strong>Acesso Autorizado!</strong><br>Bem-vindo(a), <strong>${check.name}</strong>.<br><small>Iniciando sua missão na SIPAT Manserv...</small>`;
      successBox.classList.remove('hidden');
    }

    setTimeout(() => {
      document.getElementById('registration-modal')?.close();
      if (successBox) successBox.classList.add('hidden');
      this.updateProfileDisplay();
      this.updateHubUI();

      if (check.isCompleted) {
        alert(`Olá, ${check.name}! Você já concluiu sua participação na SIPAT 2026 com ${window.gameState.getTotalScore()} pontos. Confira seu certificado e o ranking!`);
      }
    }, 600);
  }

  handleProfileClick() {
    if (!window.gameState?.hasValidPlayer()) {
      this.openRegistrationModal(false);
      return;
    }

    const player = window.gameState.player;
    const infoModal = document.getElementById('profile-info-modal');
    if (infoModal) {
      const nameEl = document.getElementById('info-employee-name');
      const reEl = document.getElementById('info-employee-re');
      const avatarEl = document.getElementById('info-avatar-badge');

      if (nameEl) nameEl.textContent = player.name || 'Colaborador Manserv';
      if (reEl) reEl.textContent = `RE: ${player.re}`;
      if (avatarEl) {
        const parts = (player.name || '').trim().split(' ').filter(Boolean);
        if (parts.length >= 2) {
          avatarEl.textContent = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        } else if (parts.length === 1) {
          avatarEl.textContent = parts[0].slice(0, 2).toUpperCase();
        } else {
          avatarEl.textContent = '👤';
        }
      }

      infoModal.showModal();
    }
  }

  updateProfileDisplay() {
    const player = window.gameState?.player;
    const nameEl = document.getElementById('profile-display-name');
    const reEl = document.getElementById('profile-display-re');
    const avatarEl = document.getElementById('profile-avatar');

    if (window.gameState?.hasValidPlayer()) {
      if (nameEl) {
        nameEl.textContent = player.name || 'Colaborador Manserv';
        nameEl.title = `${player.name} (RE: ${player.re})`;
      }
      if (reEl) {
        reEl.textContent = `RE: ${player.re}`;
        reEl.title = `RE: ${player.re} • Autorizado ✓`;
      }
      if (avatarEl) {
        const parts = (player.name || '').trim().split(' ').filter(Boolean);
        if (parts.length >= 2) {
          avatarEl.textContent = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        } else if (parts.length === 1) {
          avatarEl.textContent = parts[0].slice(0, 2).toUpperCase();
        } else {
          avatarEl.textContent = '👤';
        }
      }
    } else {
      if (nameEl) nameEl.textContent = 'Identificação';
      if (reEl) reEl.textContent = 'Informe seu RE';
      if (avatarEl) avatarEl.textContent = '👤';
    }
  }

  updateHubUI() {
    const totalScore = window.gameState?.getTotalScore() || 0;
    const completedCount = window.gameState?.getCompletedCount() || 0;
    const maxScore = 1000;
    const isExpired = this.isEventExpired();

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
        if (isExpired) {
          statusTag.className = 'card-status-pill status-completed';
          statusTag.textContent = '🔒 Encerrado';
        } else if (isDone) {
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
        if (isExpired) {
          actionBtn.textContent = '🔒 Encerrado';
          actionBtn.disabled = true;
          actionBtn.classList.add('btn-disabled');
        } else {
          actionBtn.disabled = false;
          actionBtn.classList.remove('btn-disabled');
          actionBtn.textContent = isDone ? 'Revisar / Jogar ↻' : (score > 0 ? 'Continuar ▶' : 'Jogar Agora ▶');
        }
      }

      if (isExpired) {
        card.classList.add('card-disabled');
        card.style.cursor = 'not-allowed';
      } else {
        card.classList.remove('card-disabled');
        card.style.cursor = 'pointer';
      }
    });

    // Submission buttons
    const heroBtn = document.getElementById('hero-btn-submit');
    const headerBtn = document.getElementById('btn-header-submit');
    const mobileBtn = document.getElementById('btn-mobile-submit');

    if (isExpired) {
      if (heroBtn) {
        heroBtn.disabled = true;
        heroBtn.textContent = 'Período Encerrado 🔒';
        heroBtn.classList.add('btn-disabled');
      }
      if (headerBtn) {
        headerBtn.disabled = true;
        headerBtn.textContent = 'Encerrado 🔒';
        headerBtn.classList.add('btn-disabled');
      }
      if (mobileBtn) {
        mobileBtn.disabled = true;
        mobileBtn.textContent = 'Encerrado 🔒';
        mobileBtn.classList.add('btn-disabled');
      }
    }

    this.updateProfileDisplay();
  }

  showHub() {
    window.sounds?.playClick();
    this.currentGameKey = null;
    this.clearCrosswordKeyboard();

    document.getElementById('hub-view')?.classList.remove('hidden');
    document.getElementById('game-screen-view')?.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.updateHubUI();
  }

  clearCrosswordKeyboard() {
    document.querySelectorAll('.cw-hidden-input').forEach(el => el.remove());
  }

  openGame(levelKey) {
    if (this.isEventExpired()) {
      alert('🔒 O período de participação nos jogos da SIPAT Manserv 2026 foi encerrado em 09/11/2026 às 00:00 (GMT-3). O acesso aos jogos está bloqueado.');
      return;
    }

    if (!window.gameState?.hasValidPlayer()) {
      this.openRegistrationModal(false);
      return;
    }

    window.sounds?.playClick();
    this.currentGameKey = levelKey;
    this.clearCrosswordKeyboard();

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
    if (this.isEventExpired()) {
      alert('🔒 O período para envio de pontuações nos jogos da SIPAT Manserv 2026 foi encerrado em 09/11/2026 às 00:00 (GMT-3).');
      return;
    }

    window.sounds?.playClick();
    const modal = document.getElementById('submit-results-modal');
    if (!modal) return;

    const player = window.gameState?.player;
    const scores = window.gameState?.scores;
    const maxPoints = window.gameState?.maxPoints;
    const total = window.gameState?.getTotalScore();
    const completedCount = window.gameState?.getCompletedCount();

    const summaryRe = document.getElementById('summary-re');
    if (summaryRe) {
      summaryRe.textContent = player?.name ? `${player.name} (RE: ${player.re})` : (player?.re || 'Não informado');
    }

    const summaryScore = document.getElementById('summary-total-score');
    if (summaryScore) summaryScore.textContent = `${total} / 1000 pontos`;

    const summaryGames = document.getElementById('summary-games-done');
    if (summaryGames) summaryGames.textContent = `${completedCount} de 6 Jogos Realizados`;

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

    const certName = document.getElementById('cert-player-name');
    if (certName) {
      certName.innerHTML = player?.name 
        ? `${player.name} <br><small style="font-size: 0.85rem; color: var(--color-primary); font-weight: 600;">RE: ${player.re}</small>`
        : (id ? `RE: ${id}` : 'Colaborador Manserv');
    }

    const certScore = document.getElementById('cert-score');
    if (certScore) certScore.textContent = `${total} PONTOS`;

    const certDate = document.getElementById('cert-date');
    if (certDate) certDate.textContent = new Date().toLocaleDateString('pt-BR');

    modal.showModal();
  }

  async openLeaderboardModal() {
    window.sounds?.playClick();
    const modal = document.getElementById('leaderboard-modal');
    if (!modal) return;

    modal.showModal();

    const tbody = document.getElementById('leaderboard-tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px;">Carregando ranking...</td></tr>`;
    }

    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();

      if (!data || data.length === 0) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px;">Nenhum colaborador registrado ainda. Seja o primeiro!</td></tr>`;
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
              <td>
                <strong>${item.name || 'Colaborador'}</strong>
                <br><small style="color: var(--color-primary); font-weight: 600;">RE: ${item.re || '-'}</small>
                ${isCurrent ? ' <span class="you-badge">(Você)</span>' : ''}
              </td>
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
              <td>
                <strong>${item.name || 'Colaborador'}</strong>
                <br><small style="color: var(--color-primary); font-weight: 600;">RE: ${item.re || '-'}</small>
                ${isCurrent ? ' <span class="you-badge">(Você)</span>' : ''}
              </td>
              <td>${item.completedCount || 0}/6</td>
              <td class="text-right"><strong class="text-orange">${item.totalScore || 0} pts</strong></td>
            </tr>
          `;
        }).join('');
      } else if (tbody) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px;">Você é o primeiro participante! Complete um jogo para registrar sua pontuação.</td></tr>`;
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
      'RE',
      'Nome_Colaborador',
      'Setor',
      'Nivel_1_Caca_Palavras', 'Nivel_2_Forca', 'Nivel_3_Questionario',
      'Nivel_4_Tomada_Decisao', 'Nivel_5_Encontre_Riscos', 'Nivel_6_Cruzadinha',
      'Pontuacao_Total', 'Jogos_Concluidos', 'Status', 'Data_Envio'
    ];

    const rows = history.map(p => [
      `"${p.re || p.email || ''}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.sector || (String(p.re).toUpperCase() === 'STIHL' ? 'STIHL' : 'Manserv')}"`,
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

  async resetPlayer(re) {
    if (!re) return;
    if (!confirm(`Tem certeza que deseja liberar o RE ${re} para um novo registro? Isso permitirá que o colaborador inicie uma nova tentativa.`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/reset-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ re })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'RE liberado com sucesso!');
        this.refreshAdminData();
      } else {
        alert(data.error || 'Erro ao liberar RE.');
      }
    } catch (err) {
      alert('Erro de conexão com o servidor ao liberar RE.');
    }
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
              <td>
                <strong>${p.name || 'Colaborador'}</strong>
                <br><small style="color: var(--color-primary); font-weight: 600;">RE: ${p.re || p.email || '-'}</small>
              </td>
              <td>${p.completedCount}/6</td>
              <td><strong class="text-orange">${p.totalScore} pts</strong></td>
              <td><small>${new Date(p.submittedAt).toLocaleString('pt-BR')}</small></td>
              <td>
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.app?.resetPlayer('${p.re}')" title="Liberar tentativa para este colaborador">
                  🔄 Resetar
                </button>
              </td>
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
            <td>
              <strong>${p.name || 'Colaborador'}</strong>
              <br><small style="color: var(--color-primary); font-weight: 600;">RE: ${p.re || p.email || '-'}</small>
            </td>
            <td>${p.completedCount || 0}/6</td>
            <td><strong class="text-orange">${p.totalScore || 0} pts</strong></td>
            <td><small>${new Date(p.submittedAt || Date.now()).toLocaleString('pt-BR')}</small></td>
            <td>-</td>
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
