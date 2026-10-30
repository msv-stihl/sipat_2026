// NÍVEL 5 – ENCONTRE OS RISCOS (Difícil - 220 Pontos)
class HazardHunterGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.maxChances = 8;
    this.chancesLeft = 8;
    this.maxPoints = 220;
    this.pointsPerRisk = 44; // 5 * 44 = 220 pts

    this.hazards = [
      {
        id: 'oil_spill',
        title: 'Vazamento de Óleo e Risco de Escorregão',
        category: 'Piso e Circulação',
        description: 'Poça escorregadia no caminho de pedestres sem contenção ou sinalização com cone.',
        // Coordinates in percentages (0 to 100)
        x: 18.5,
        y: 39.5,
        radius: 8.5
      },
      {
        id: 'electrical_panel',
        title: 'Painel Elétrico Aberto com Fios Expostos',
        category: 'Risco Elétrico',
        description: 'Quadro elétrico com tampa aberta e condutores energizados sem bloqueio LOTO.',
        x: 47.5,
        y: 36.5,
        radius: 7.5
      },
      {
        id: 'broken_ladder',
        title: 'Trabalho em Altura Inseguro na Escada',
        category: 'Trabalho em Altura',
        description: 'Colaborador no topo de escada móvel sem cinto tipo paraquedista e sem capacete.',
        x: 62.5,
        y: 35.0,
        radius: 8.5
      },
      {
        id: 'blocked_exit',
        title: 'Saída de Emergência Obstruída',
        category: 'Rota de Fuga',
        description: 'Paletes de madeira e caixas empilhadas bloqueando a porta de emergência.',
        x: 89.0,
        y: 24.5,
        radius: 8.0
      },
      {
        id: 'forklift_hazard',
        title: 'Carga Instável e Pedestre em Zona Cega',
        category: 'Movimentação de Cargas',
        description: 'Empilhadeira com caixas desbalanceadas e colaborador sem capacete na linha de fogo.',
        x: 80.5,
        y: 67.0,
        radius: 10.0
      }
    ];

    this.foundHazardIds = new Set();
    this.clicksHistory = []; // { x, y, isHit }
  }

  init() {
    this.chancesLeft = this.maxChances;
    this.foundHazardIds.clear();
    this.clicksHistory = [];
    this.render();
  }

  getCurrentScore() {
    return this.foundHazardIds.size * this.pointsPerRisk;
  }

  render() {
    if (!this.container) return;

    const currentScore = this.getCurrentScore();
    const isWon = this.foundHazardIds.size === this.hazards.length;
    const isLost = !isWon && this.chancesLeft <= 0;

    this.container.innerHTML = `
      <div class="game-wrapper hazard-layout">
        <div class="game-intro">
          <div class="game-intro-header">
            <div class="game-intro-icon-box">
              <img src="assets/icons/level5.png" alt="Encontre os Riscos" />
            </div>
            <div>
              <div class="game-badge">NÍVEL 5 • DIFÍCIL</div>
              <h2>Encontre os Riscos Operacionais</h2>
            </div>
          </div>
          <p class="game-desc">
            Toque diretamente na imagem para identificar os <strong>5 perigos ocultos</strong> na planta industrial. Você tem exatamente <strong>8 chances</strong> no total!
          </p>
          <div class="game-stats-bar">
            <span>Riscos Encontrados: <strong id="hh-found-count">${this.foundHazardIds.size} / ${this.hazards.length}</strong></span>
            <span>Chances Restantes: <strong id="hh-chances-count" class="${this.chancesLeft <= 2 ? 'text-danger' : ''}">${this.chancesLeft} de ${this.maxChances}</strong></span>
            <span>Pontuação: <strong>${currentScore} / ${this.maxPoints} pts</strong></span>
          </div>
        </div>

        <div class="hazard-gameplay-area">
          <div class="hazard-image-wrapper" id="hazard-image-box">
            <img 
              src="assets/sipat_workplace_hazards.jpg" 
              alt="Cenário industrial com 5 riscos de segurança" 
              class="hazard-main-img" 
              id="hazard-target-img"
              draggable="false"
            />

            <!-- Found hazard markers overlay -->
            <div class="hazard-markers-overlay" id="hazard-markers-overlay">
              ${this.hazards.filter(h => this.foundHazardIds.has(h.id)).map((h, idx) => `
                <div class="hazard-spot-pin" style="left: ${h.x}%; top: ${h.y}%;" title="${h.title}">
                  <span class="spot-pulse"></span>
                  <span class="spot-icon">⚠️</span>
                  <span class="spot-tag">#${idx + 1}</span>
                </div>
              `).join('')}

              <!-- Visual history of click ripples -->
              ${this.clicksHistory.map(click => `
                <div class="click-feedback-ping ${click.isHit ? 'ping-hit' : 'ping-miss'}" style="left: ${click.x}%; top: ${click.y}%;">
                  <span>${click.isHit ? '✓' : '✕'}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="hazard-checklist-panel">
            <h3>Checklist de Riscos a Encontrar:</h3>
            <div class="hazard-checklist-items">
              ${this.hazards.map((h, idx) => {
                const found = this.foundHazardIds.has(h.id);
                return `
                  <div class="hazard-card-item ${found ? 'item-found' : 'item-pending'}">
                    <div class="item-status-icon">${found ? '✓' : idx + 1}</div>
                    <div class="item-info">
                      <span class="item-title">${found ? h.title : 'Risco Desconhecido #' + (idx + 1)}</span>
                      <span class="item-desc">${found ? h.description : 'Procure com atenção na área da fábrica...'}</span>
                    </div>
                    ${found ? `<span class="item-pts">+44 pts</span>` : ''}
                  </div>
                `;
              }).join('')}
            </div>

            <div class="mobile-tip-box">
              <span>📱 Dica Celular:</span> Toque com precisão no local exato onde está o perigo.
            </div>
          </div>
        </div>

        ${isWon ? this.renderWinBanner() : ''}
        ${isLost ? this.renderLostBanner() : ''}

        <div class="game-action-footer">
          <button type="button" class="btn btn-secondary" onclick="window.app?.showHub()">
            ← Voltar ao Hub
          </button>
          <button type="button" class="btn btn-secondary" id="hh-btn-restart">
            Reiniciar Tentativa ↻
          </button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  renderWinBanner() {
    return `
      <div class="level-complete-modal-overlay">
        <div class="level-complete-card">
          <div class="complete-icon">🎯</div>
          <h3>Incrível! Todos os 5 Riscos Identificados!</h3>
          <p>Você demonstrou olhar clínico de auditor de segurança e completou o nível mais desafiador!</p>
          <div class="points-reward-tag">+220 PONTOS CONQUISTADOS</div>
          <div class="modal-actions-row">
            <button class="btn btn-secondary" onclick="window.app?.showHub()">Voltar ao Hub de Jogos</button>
            <button class="btn btn-primary" onclick="window.app?.openGame('level6')">Jogar Nível 6 (Cruzadinha) →</button>
          </div>
        </div>
      </div>
    `;
  }

  renderLostBanner() {
    return `
      <div class="level-complete-modal-overlay">
        <div class="level-complete-card">
          <div class="complete-icon">⌛</div>
          <h3>Chances Esgotadas!</h3>
          <p>Você utilizou as 8 chances e identificou <strong>${this.foundHazardIds.size} de 5 riscos</strong>.</p>
          <div class="points-reward-tag">${this.getCurrentScore()} / ${this.maxPoints} PONTOS OBTIDOS</div>
          <div class="modal-actions-row">
            <button class="btn btn-secondary" onclick="window.app?.showHub()">Voltar ao Hub</button>
            <button class="btn btn-primary" id="hh-btn-retry-lost">Tentar Novamente ↻</button>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const imgWrapper = document.getElementById('hazard-image-box');
    if (!imgWrapper) return;

    // Pointer click/tap handling on image
    imgWrapper.addEventListener('click', (e) => {
      this.handleImageClick(e, imgWrapper);
    });

    const restartBtn = document.getElementById('hh-btn-restart');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.init();
      });
    }

    const retryLostBtn = document.getElementById('hh-btn-retry-lost');
    if (retryLostBtn) {
      retryLostBtn.addEventListener('click', () => {
        this.init();
      });
    }
  }

  handleImageClick(e, container) {
    if (this.chancesLeft <= 0 || this.foundHazardIds.size === this.hazards.length) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const pctX = (clickX / rect.width) * 100;
    const pctY = (clickY / rect.height) * 100;

    // Consume 1 chance per click
    this.chancesLeft--;

    // Check if hit any un-found hazard
    let hitHazard = null;
    for (const h of this.hazards) {
      if (this.foundHazardIds.has(h.id)) continue;

      // Distance calculation in percentage space with aspect ratio adjustment
      const dx = pctX - h.x;
      const dy = (pctY - h.y) * (rect.height / rect.width);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= h.radius) {
        hitHazard = h;
        break;
      }
    }

    if (hitHazard) {
      this.foundHazardIds.add(hitHazard.id);
      this.clicksHistory.push({ x: pctX, y: pctY, isHit: true });
      window.sounds?.playHazardFound();

      const isWon = this.foundHazardIds.size === this.hazards.length;
      const score = this.getCurrentScore();
      window.gameState?.setGameScore('level5', score, isWon, {
        foundHazards: Array.from(this.foundHazardIds),
        chancesLeft: this.chancesLeft
      });

      if (isWon) {
        window.sounds?.playLevelComplete();
        window.triggerConfetti?.(3000);
      }
    } else {
      this.clicksHistory.push({ x: pctX, y: pctY, isHit: false });
      window.sounds?.playWrong();

      const score = this.getCurrentScore();
      window.gameState?.setGameScore('level5', score, false, {
        foundHazards: Array.from(this.foundHazardIds),
        chancesLeft: this.chancesLeft
      });
    }

    this.render();
  }
}

window.HazardHunterGame = HazardHunterGame;
