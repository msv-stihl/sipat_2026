// NÍVEL 2 – FORCA (Fácil / Médio - 120 Pontos)
class HangmanGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.rounds = [
      {
        phrase: 'DIALOGO DIARIO DE SEGURANCA',
        displayHint: 'Prática de segurança realizada diariamente com a equipe antes do início do turno.',
        category: 'Procedimento Preventivo'
      },
      {
        phrase: 'EQUIPAMENTO DE PROTECAO INDIVIDUAL',
        displayHint: 'Dispositivo ou produto de uso pessoal destinado a proteger a integridade física.',
        category: 'Segurança Operacional'
      },
      {
        phrase: 'PERCEPCAO DE RISCO',
        displayHint: 'Capacidade de identificar perigos antes de agir e tomar a atitude segura.',
        category: 'Comportamento Seguro'
      }
    ];

    this.currentRoundIdx = 0;
    this.guessedLetters = new Set();
    this.wrongLetters = new Set();
    this.maxErrors = 6;
    this.roundScores = [0, 0, 0];
    this.maxPoints = 120;
    this.pointsPerRound = 40;
  }

  init() {
    this.currentRoundIdx = 0;
    this.roundScores = [0, 0, 0];
    this.startRound(0);
  }

  startRound(idx) {
    this.currentRoundIdx = idx;
    this.guessedLetters.clear();
    this.wrongLetters.clear();
    this.render();
  }

  getCurrentPhrase() {
    return this.rounds[this.currentRoundIdx].phrase;
  }

  getMaskedWords() {
    const phrase = this.getCurrentPhrase();
    return phrase.split(' ').map(word => {
      return word.split('').map(letter => {
        if (this.guessedLetters.has(letter)) {
          return letter;
        }
        return '_';
      }).join(' ');
    });
  }

  isRoundWon() {
    const phrase = this.getCurrentPhrase().replace(/ /g, '');
    for (const char of phrase) {
      if (!this.guessedLetters.has(char)) {
        return false;
      }
    }
    return true;
  }

  isRoundLost() {
    return this.wrongLetters.size >= this.maxErrors;
  }

  render() {
    if (!this.container) return;

    const currentRound = this.rounds[this.currentRoundIdx];
    const maskedWords = this.getMaskedWords();
    const errorsCount = this.wrongLetters.size;
    const isWon = this.isRoundWon();
    const isLost = this.isRoundLost();
    const isFinished = isWon || isLost;

    this.container.innerHTML = `
      <div class="game-wrapper hangman-layout">
        <div class="game-intro">
          <div class="game-badge">NÍVEL 2 • FÁCIL / MÉDIO</div>
          <h2>Jogo da Forca da Segurança</h2>
          <p class="game-desc">
            Descubra as <strong>3 expressões</strong> fundamentais para a SIPAT Manserv. Cada rodada correta vale 40 pontos!
          </p>
          <div class="game-stats-bar">
            <span>Rodada: <strong>${this.currentRoundIdx + 1} de ${this.rounds.length}</strong></span>
            <span>Chances Restantes: <strong>${this.maxErrors - errorsCount}</strong></span>
            <span>Pontos Acumulados: <strong>${this.getTotalScore()} / ${this.maxPoints} pts</strong></span>
          </div>
        </div>

        <div class="hangman-play-zone">
          <div class="hangman-visual-panel">
            <div class="hangman-svg-container">
              ${this.renderHangmanSvg(errorsCount)}
            </div>
            <div class="hangman-hint-card">
              <span class="hint-tag">${currentRound.category}</span>
              <p class="hint-text"><strong>Dica:</strong> ${currentRound.displayHint}</p>
            </div>
          </div>

          <div class="hangman-words-panel">
            <div class="masked-phrase-display">
              ${maskedWords.map(w => `<div class="masked-word">${w}</div>`).join('')}
            </div>

            ${isFinished ? this.renderRoundEndBanner(isWon, isLost, currentRound) : this.renderVirtualKeyboard()}
          </div>
        </div>

        <div class="game-action-footer">
          <button type="button" class="btn btn-secondary" onclick="window.app?.showHub()">
            ← Voltar ao Hub
          </button>
          <button type="button" class="btn btn-secondary" id="hm-btn-reset-round">
            Reiniciar Rodada
          </button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  renderRoundEndBanner(isWon, isLost, currentRound) {
    if (isWon) {
      const isLastRound = this.currentRoundIdx >= this.rounds.length - 1;
      return `
        <div class="round-feedback won">
          <div class="feedback-badge">✓ ACERTOU!</div>
          <p>Você descobriu a expressão: <strong>${currentRound.phrase}</strong></p>
          <div class="points-reward-tag">+40 PONTOS GANHOS</div>
          ${isLastRound ? `
            <button class="btn btn-primary" id="hm-btn-next-level">
              Concluir Nível 2 🎉
            </button>
          ` : `
            <button class="btn btn-primary" id="hm-btn-next-round">
              Próxima Rodada (${this.currentRoundIdx + 2}/${this.rounds.length}) →
            </button>
          `}
        </div>
      `;
    }

    if (isLost) {
      return `
        <div class="round-feedback lost">
          <div class="feedback-badge">✕ FIM DE CHANCES</div>
          <p>A expressão correta era: <strong>${currentRound.phrase}</strong></p>
          <button class="btn btn-secondary" id="hm-btn-retry">
            Tentar Novamente esta Rodada ↻
          </button>
        </div>
      `;
    }

    return '';
  }

  renderVirtualKeyboard() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return `
      <div class="virtual-keyboard">
        ${letters.map(letter => {
          const isGuessed = this.guessedLetters.has(letter);
          const isWrong = this.wrongLetters.has(letter);
          let btnClass = 'kb-key';
          if (isGuessed) btnClass += ' key-correct';
          else if (isWrong) btnClass += ' key-wrong';

          return `
            <button type="button" class="${btnClass}" data-letter="${letter}" ${isGuessed || isWrong ? 'disabled' : ''}>
              ${letter}
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  renderHangmanSvg(errors) {
    // Safety scaffolding & Manserv worker graphics
    return `
      <svg viewBox="0 0 200 220" class="hangman-svg" aria-label="Boneco da forca">
        <!-- Base and Scaffolding / Gantry in Industrial Orange & Steel -->
        <line x1="20" y1="200" x2="180" y2="200" stroke="#FF460A" stroke-width="6" stroke-linecap="round" />
        <line x1="50" y1="200" x2="50" y2="30" stroke="#555555" stroke-width="6" stroke-linecap="round" />
        <line x1="47" y1="30" x2="140" y2="30" stroke="#555555" stroke-width="6" stroke-linecap="round" />
        <line x1="50" y1="65" x2="85" y2="30" stroke="#FF460A" stroke-width="4" stroke-linecap="round" />
        
        <!-- Safety Lifeline / Rope -->
        <line x1="140" y1="30" x2="140" y2="60" stroke="#EDEDED" stroke-width="3" stroke-dasharray="2,2" />

        <!-- 1 Error: Head with Manserv Safety Helmet -->
        ${errors >= 1 ? `
          <circle cx="140" cy="75" r="14" fill="#FFE0B2" stroke="#232323" stroke-width="2" />
          <!-- Helmet -->
          <path d="M 124 74 Q 140 56 156 74 Z" fill="#FF460A" />
          <rect x="122" y="73" width="36" height="3" rx="1.5" fill="#FFFFFF" />
        ` : ''}

        <!-- 2 Errors: Body / Torso with High-Vis Safety Vest -->
        ${errors >= 2 ? `
          <line x1="140" y1="89" x2="140" y2="135" stroke="#111111" stroke-width="4" stroke-linecap="round" />
          <rect x="133" y="92" width="14" height="28" rx="3" fill="#FF460A" />
          <line x1="133" y1="102" x2="147" y2="102" stroke="#EDEDED" stroke-width="2" />
          <line x1="133" y1="112" x2="147" y2="112" stroke="#EDEDED" stroke-width="2" />
        ` : ''}

        <!-- 3 Errors: Left Arm with Glove -->
        ${errors >= 3 ? `
          <line x1="140" y1="96" x2="118" y2="118" stroke="#111111" stroke-width="4" stroke-linecap="round" />
          <circle cx="118" cy="118" r="4" fill="#FFB300" />
        ` : ''}

        <!-- 4 Errors: Right Arm with Glove -->
        ${errors >= 4 ? `
          <line x1="140" y1="96" x2="162" y2="118" stroke="#111111" stroke-width="4" stroke-linecap="round" />
          <circle cx="162" cy="118" r="4" fill="#FFB300" />
        ` : ''}

        <!-- 5 Errors: Left Leg with Safety Boot -->
        ${errors >= 5 ? `
          <line x1="140" y1="135" x2="124" y2="175" stroke="#232323" stroke-width="4" stroke-linecap="round" />
          <ellipse cx="120" cy="177" rx="6" ry="4" fill="#FF460A" />
        ` : ''}

        <!-- 6 Errors: Right Leg with Safety Boot (Lost) -->
        ${errors >= 6 ? `
          <line x1="140" y1="135" x2="156" y2="175" stroke="#232323" stroke-width="4" stroke-linecap="round" />
          <ellipse cx="160" cy="177" rx="6" ry="4" fill="#FF460A" />
        ` : ''}
      </svg>
    `;
  }

  attachEvents() {
    const keys = this.container.querySelectorAll('.kb-key');
    keys.forEach(k => {
      k.addEventListener('click', () => {
        const letter = k.dataset.letter;
        this.handleLetterChoice(letter);
      });
    });

    const resetBtn = document.getElementById('hm-btn-reset-round');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.startRound(this.currentRoundIdx);
      });
    }

    const nextRoundBtn = document.getElementById('hm-btn-next-round');
    if (nextRoundBtn) {
      nextRoundBtn.addEventListener('click', () => {
        this.startRound(this.currentRoundIdx + 1);
      });
    }

    const retryBtn = document.getElementById('hm-btn-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.startRound(this.currentRoundIdx);
      });
    }

    const nextLevelBtn = document.getElementById('hm-btn-next-level');
    if (nextLevelBtn) {
      nextLevelBtn.addEventListener('click', () => {
        this.handleGameFinished();
      });
    }
  }

  handleLetterChoice(letter) {
    if (this.isRoundWon() || this.isRoundLost()) return;
    if (this.guessedLetters.has(letter) || this.wrongLetters.has(letter)) return;

    const phrase = this.getCurrentPhrase();
    if (phrase.includes(letter)) {
      this.guessedLetters.add(letter);
      window.sounds?.playCorrect();
    } else {
      this.wrongLetters.add(letter);
      window.sounds?.playWrong();
    }

    // Check round win
    if (this.isRoundWon()) {
      this.roundScores[this.currentRoundIdx] = this.pointsPerRound;
      window.sounds?.playCorrect();
      this.updateGlobalState();

      if (this.currentRoundIdx === this.rounds.length - 1) {
        window.triggerConfetti?.(2000);
      }
    } else if (this.isRoundLost()) {
      window.sounds?.playWrong();
    }

    this.render();
  }

  getTotalScore() {
    return this.roundScores.reduce((a, b) => a + b, 0);
  }

  updateGlobalState() {
    const score = this.getTotalScore();
    const isCompleted = this.currentRoundIdx >= this.rounds.length - 1 && this.isRoundWon();
    window.gameState?.setGameScore('level2', score, isCompleted, {
      roundScores: this.roundScores
    });
  }

  handleGameFinished() {
    window.sounds?.playLevelComplete();
    window.triggerConfetti?.(3000);

    const total = this.getTotalScore();
    window.gameState?.setGameScore('level2', total, true, {
      roundScores: this.roundScores
    });

    const banner = document.createElement('div');
    banner.className = 'level-complete-modal-overlay';
    banner.innerHTML = `
      <div class="level-complete-card">
        <div class="complete-icon">🛡️</div>
        <h3>Excelente! Nível 2 Concluído!</h3>
        <p>Você demonstrou domínio dos conceitos preventivos essenciais da SIPAT!</p>
        <div class="points-reward-tag">+${total} PONTOS CONQUISTADOS</div>
        <div class="modal-actions-row">
          <button class="btn btn-secondary" onclick="window.app?.showHub()">Voltar ao Hub de Jogos</button>
          <button class="btn btn-primary" onclick="window.app?.openGame('level3')">Jogar Nível 3 (Questionário) →</button>
        </div>
      </div>
    `;
    this.container.appendChild(banner);
  }
}

window.HangmanGame = HangmanGame;
