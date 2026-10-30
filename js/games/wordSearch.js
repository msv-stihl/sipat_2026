// NÍVEL 1 – CAÇA-PALAVRAS (Fácil - 100 Pontos)
class WordSearchGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.words = ['MANSERV', 'SEGURANCA', 'PREVENCAO', 'CUIDADO', 'ALERTA', 'EPI'];
    this.gridSize = 10;
    this.grid = [];
    this.foundWords = [];
    this.selectedCells = [];
    this.isPointerDown = false;
    this.dragMoved = false;
    this.startCell = null;
    this.pendingTap = null;
    this.onPointerMove = null;
    this.onPointerUp = null;
    this.wordLocations = {}; // word -> array of {r, c}
    this.maxPoints = 100;
  }

  init() {
    this.foundWords = [];
    this.selectedCells = [];
    this.isPointerDown = false;
    this.dragMoved = false;
    this.startCell = null;
    this.pendingTap = null;
    this.generateGrid();
    this.render();
  }

  generateGrid() {
    // Empty grid
    this.grid = Array.from({ length: this.gridSize }, () =>
      Array(this.gridSize).fill('')
    );
    this.wordLocations = {};

    const directions = [
      { r: 0, c: 1 },  // horizontal right
      { r: 1, c: 0 },  // vertical down
      { r: 1, c: 1 },  // diagonal down-right
      { r: 0, c: -1 }, // horizontal left
      { r: -1, c: 0 }  // vertical up
    ];

    // Place each word
    for (const word of this.words) {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 200) {
        attempts++;
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const startR = Math.floor(Math.random() * this.gridSize);
        const startC = Math.floor(Math.random() * this.gridSize);

        const endR = startR + dir.r * (word.length - 1);
        const endC = startC + dir.c * (word.length - 1);

        if (endR >= 0 && endR < this.gridSize && endC >= 0 && endC < this.gridSize) {
          // Check collision
          let canPlace = true;
          for (let i = 0; i < word.length; i++) {
            const r = startR + dir.r * i;
            const c = startC + dir.c * i;
            const currentLetter = this.grid[r][c];
            if (currentLetter !== '' && currentLetter !== word[i]) {
              canPlace = false;
              break;
            }
          }

          if (canPlace) {
            const coords = [];
            for (let i = 0; i < word.length; i++) {
              const r = startR + dir.r * i;
              const c = startC + dir.c * i;
              this.grid[r][c] = word[i];
              coords.push({ r, c });
            }
            this.wordLocations[word] = coords;
            placed = true;
          }
        }
      }

      // Fallback simple placement if random attempts failed
      if (!placed) {
        // Place horizontally if possible
        for (let r = 0; r < this.gridSize; r++) {
          for (let c = 0; c <= this.gridSize - word.length; c++) {
            let fits = true;
            for (let i = 0; i < word.length; i++) {
              if (this.grid[r][c + i] !== '' && this.grid[r][c + i] !== word[i]) {
                fits = false;
                break;
              }
            }
            if (fits) {
              const coords = [];
              for (let i = 0; i < word.length; i++) {
                this.grid[r][c + i] = word[i];
                coords.push({ r, c: c + i });
              }
              this.wordLocations[word] = coords;
              placed = true;
              break;
            }
          }
          if (placed) break;
        }
      }
    }

    // Fill empty cells with random letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (!this.grid[r][c]) {
          this.grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="game-wrapper wordsearch-layout">
        <div class="game-intro">
          <div class="game-intro-header">
            <div class="game-intro-icon-box">
              <img src="assets/icons/level1.png" alt="Caça-Palavras" />
            </div>
            <div>
              <div class="game-badge">NÍVEL 1 • FÁCIL</div>
              <h2>Caça-Palavras da Prevenção</h2>
            </div>
          </div>
          <p class="game-desc">
            Encontre as <strong>6 palavras</strong> essenciais para a cultura de segurança Manserv escondidas no diagrama. Arraste ou toque na primeira e última letra da palavra!
          </p>
          <div class="game-stats-bar">
            <span>Encontradas: <strong id="ws-found-count">${this.foundWords.length} / ${this.words.length}</strong></span>
            <span>Pontuação: <strong id="ws-score-display">${this.calcCurrentScore()} / ${this.maxPoints} pts</strong></span>
          </div>
        </div>

        <div class="ws-gameplay-area">
          <div class="ws-grid-container">
            <div class="ws-grid" id="ws-grid-board" style="grid-template-columns: repeat(${this.gridSize}, 1fr)">
              ${this.grid.map((row, r) =>
                row.map((letter, c) => `
                  <button type="button" class="ws-cell" data-r="${r}" data-c="${c}" id="ws-cell-${r}-${c}">
                    ${letter}
                  </button>
                `).join('')
              ).join('')}
            </div>
          </div>

          <div class="ws-words-panel">
            <h3>Palavras a Encontrar:</h3>
            <div class="ws-word-tags">
              ${this.words.map(w => `
                <div class="ws-word-chip ${this.foundWords.includes(w) ? 'found' : ''}" id="chip-${w}">
                  <span class="chip-status">${this.foundWords.includes(w) ? '✓' : '○'}</span>
                  <span class="chip-text">${w}</span>
                </div>
              `).join('')}
            </div>

            <div class="game-hints-box">
              <span class="hint-icon">💡</span>
              <p>Dica: As palavras podem estar na horizontal, vertical ou diagonal.</p>
            </div>
          </div>
        </div>

        <div class="game-action-footer">
          <button type="button" class="btn btn-secondary" id="ws-btn-reset">
            Reiniciar Caça-Palavras
          </button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const board = document.getElementById('ws-grid-board');
    if (!board) return;

    // Remove listeners de uma renderização anterior
    if (this.onPointerMove) window.removeEventListener('pointermove', this.onPointerMove);
    if (this.onPointerUp) {
      window.removeEventListener('pointerup', this.onPointerUp);
      window.removeEventListener('pointercancel', this.onPointerUp);
    }

    board.addEventListener('pointerdown', (e) => {
      const cell = e.target.closest('.ws-cell');
      if (!cell) return;
      e.preventDefault();
      window.sounds?.playClick();

      const r = parseInt(cell.dataset.r, 10);
      const c = parseInt(cell.dataset.c, 10);

      // Modo toque: o 1º toque marca o início e o 2º toque fecha a palavra
      if (this.pendingTap && (this.pendingTap.r !== r || this.pendingTap.c !== c)) {
        const start = this.pendingTap;
        this.pendingTap = null;
        this.isPointerDown = false;
        this.startCell = null;
        this.selectRange(start, { r, c });
        this.checkSelectedWord();
        return;
      }

      this.isPointerDown = true;
      this.dragMoved = false;
      this.startCell = { r, c };
      this.pendingTap = { r, c };

      // Captura o ponteiro para receber os movimentos/levantamento fora do tabuleiro
      try {
        board.setPointerCapture(e.pointerId);
      } catch (err) {}

      this.selectRange(this.startCell, this.startCell);
    });

    // Em telas de toque o pointerenter não dispara nas outras células durante o arraste,
    // por isso localizamos a célula sob o dedo a cada movimento.
    this.onPointerMove = (e) => {
      if (!this.isPointerDown || !this.startCell) return;

      const cell = this.getCellAt(e.clientX, e.clientY);
      if (!cell) return;

      const r = parseInt(cell.dataset.r, 10);
      const c = parseInt(cell.dataset.c, 10);
      if (r === this.startCell.r && c === this.startCell.c) return;

      this.dragMoved = true;
      this.selectRange(this.startCell, { r, c });
    };

    this.onPointerUp = () => {
      if (!this.isPointerDown) return;
      this.isPointerDown = false;

      if (this.dragMoved) {
        this.pendingTap = null;
        this.startCell = null;
        this.checkSelectedWord();
      }
    };

    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);

    const resetBtn = document.getElementById('ws-btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.init();
      });
    }
  }

  getCellAt(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el || !el.closest) return null;
    return el.closest('.ws-cell');
  }

  selectRange(start, end) {
    // Clear previous temporary selection highlight
    const board = document.getElementById('ws-grid-board');
    if (!board) return;
    board.querySelectorAll('.ws-cell.selecting').forEach(el => el.classList.remove('selecting'));

    const dr = end.r - start.r;
    const dc = end.c - start.c;
    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

    // Validate straight line: horizontal, vertical, or 45-degree diagonal
    const isHoriz = dr === 0 && dc !== 0;
    const isVert = dc === 0 && dr !== 0;
    const isDiag = Math.abs(dr) === Math.abs(dc) && dr !== 0;
    const isSingle = dr === 0 && dc === 0;

    if (!isHoriz && !isVert && !isDiag && !isSingle) {
      this.selectedCells = [{ r: start.r, c: start.c }];
    } else {
      const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1;
      this.selectedCells = [];
      for (let i = 0; i < len; i++) {
        const r = start.r + stepR * i;
        const c = start.c + stepC * i;
        this.selectedCells.push({ r, c });
      }
    }

    for (const { r, c } of this.selectedCells) {
      const el = document.getElementById(`ws-cell-${r}-${c}`);
      if (el) el.classList.add('selecting');
    }
  }

  checkSelectedWord() {
    if (!this.selectedCells || this.selectedCells.length === 0) return;

    let selectedWord = this.selectedCells.map(({ r, c }) => this.grid[r][c]).join('');
    let reversedWord = selectedWord.split('').reverse().join('');

    let matchedWord = null;
    if (this.words.includes(selectedWord)) matchedWord = selectedWord;
    else if (this.words.includes(reversedWord)) matchedWord = reversedWord;

    if (matchedWord && !this.foundWords.includes(matchedWord)) {
      this.foundWords.push(matchedWord);
      window.sounds?.playCorrect();

      // Permanently mark these cells as found
      for (const { r, c } of this.selectedCells) {
        const el = document.getElementById(`ws-cell-${r}-${c}`);
        if (el) {
          el.classList.add('found');
          el.classList.remove('selecting');
        }
      }

      // Update word chip
      const chip = document.getElementById(`chip-${matchedWord}`);
      if (chip) {
        chip.classList.add('found');
        const st = chip.querySelector('.chip-status');
        if (st) st.textContent = '✓';
      }

      this.updateCounters();

      // Check win condition
      if (this.foundWords.length === this.words.length) {
        this.handleGameCompleted();
      }
    } else {
      // Clear selection styling
      const board = document.getElementById('ws-grid-board');
      if (board) {
        board.querySelectorAll('.ws-cell.selecting').forEach(el => el.classList.remove('selecting'));
      }
    }

    this.selectedCells = [];
    this.startCell = null;
  }

  calcCurrentScore() {
    return Math.round((this.foundWords.length / this.words.length) * this.maxPoints);
  }

  updateCounters() {
    const foundEl = document.getElementById('ws-found-count');
    if (foundEl) foundEl.textContent = `${this.foundWords.length} / ${this.words.length}`;

    const score = this.calcCurrentScore();
    const scoreEl = document.getElementById('ws-score-display');
    if (scoreEl) scoreEl.textContent = `${score} / ${this.maxPoints} pts`;

    // Update global state progress
    window.gameState?.setGameScore('level1', score, this.foundWords.length === this.words.length, {
      foundWords: this.foundWords
    });
  }

  handleGameCompleted() {
    window.sounds?.playLevelComplete();
    window.triggerConfetti?.(3000);

    window.gameState?.setGameScore('level1', this.maxPoints, true, {
      foundWords: this.foundWords
    });

    const board = document.getElementById('ws-grid-board');
    if (board) {
      const banner = document.createElement('div');
      banner.className = 'level-complete-modal-overlay';
      banner.innerHTML = `
        <div class="level-complete-card">
          <div class="complete-icon">🎉</div>
          <h3>Parabéns! Nível 1 Concluído!</h3>
          <p>Você encontrou todas as palavras da cultura de segurança Manserv!</p>
          <div class="points-reward-tag">+100 PONTOS CONQUISTADOS</div>
          <div class="modal-actions-row">
            <button class="btn btn-secondary" onclick="window.app?.showHub()">Voltar ao Hub de Jogos</button>
            <button class="btn btn-primary" onclick="window.app?.openGame('level2')">Jogar Nível 2 (Forca) →</button>
          </div>
        </div>
      `;
      this.container.appendChild(banner);
    }
  }
}

window.WordSearchGame = WordSearchGame;
