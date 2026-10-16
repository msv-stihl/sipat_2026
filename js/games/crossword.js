// NÍVEL 6 – CRUZADINHA (Muito Difícil - 230 Pontos)
class CrosswordGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.rows = 14;
    this.cols = 13;
    this.maxPoints = 230;

    this.wordsDef = [
      {
        id: '1H',
        num: 1,
        dir: 'H',
        word: 'ACIDENTEZERO',
        clue: 'Meta primordial de segurança da Manserv onde nenhuma lesão ou incidente é aceitável.',
        row: 2,
        col: 1
      },
      {
        id: '1V',
        num: 1,
        dir: 'V',
        word: 'CUIDADOATIVO',
        clue: 'Princípio comportamental de cuidar de si, cuidar do colega e permitir ser cuidado.',
        row: 2,
        col: 2
      },
      {
        id: '2H',
        num: 2,
        dir: 'H',
        word: 'AUDITORIA',
        clue: 'Inspeção metódica das instalações e processos para certificar a conformidade das NRs.',
        row: 5,
        col: 0
      },
      {
        id: '2V',
        num: 2,
        dir: 'V',
        word: 'SIPAT',
        clue: 'Sigla da Semana Interna de Prevenção de Acidentes do Trabalho.',
        row: 4,
        col: 3
      },
      {
        id: '3H',
        num: 3,
        dir: 'H',
        word: 'ALERTA',
        clue: 'Estado de vigilância constante do colaborador para antecipar perigos operacionais.',
        row: 9,
        col: 2
      },
      {
        id: '3V',
        num: 3,
        dir: 'V',
        word: 'BRIGADA',
        clue: 'Equipe treinada para agir rapidamente em primeiros socorros e combate a incêndio.',
        row: 1,
        col: 11
      },
      {
        id: '4H',
        num: 4,
        dir: 'H',
        word: 'LAUDO',
        clue: 'Documento técnico e pericial conclusivo de segurança e saúde ocupacional.',
        row: 6,
        col: 8
      }
    ];

    this.userGrid = {}; // 'r,c' -> letter
    this.activeWordId = '1H';
    this.activeCell = { r: 2, c: 1 };
    this.isVerified = false;
    this.hiddenInput = null;
  }

  init() {
    this.removeHiddenInput();
    this.userGrid = {};
    this.activeWordId = '1H';
    this.activeCell = { r: 2, c: 1 };
    this.isVerified = false;
    this.render();
  }

  // Build map of valid cells: 'r,c' -> { expected: char, numberLabel: 1..4, words: ['1H', ...] }
  getValidCellsMap() {
    const map = {};

    for (const w of this.wordsDef) {
      for (let i = 0; i < w.word.length; i++) {
        const r = w.dir === 'H' ? w.row : w.row + i;
        const c = w.dir === 'H' ? w.col + i : w.col;
        const key = `${r},${c}`;

        if (!map[key]) {
          map[key] = {
            expected: w.word[i],
            number: i === 0 ? w.num : null,
            words: [w.id]
          };
        } else {
          map[key].words.push(w.id);
          if (i === 0 && !map[key].number) {
            map[key].number = w.num;
          }
        }
      }
    }

    return map;
  }

  calcScore() {
    const validCells = this.getValidCellsMap();
    let correctCount = 0;
    const totalCells = Object.keys(validCells).length;

    for (const [key, info] of Object.entries(validCells)) {
      if ((this.userGrid[key] || '').toUpperCase() === info.expected) {
        correctCount++;
      }
    }

    return Math.round((correctCount / totalCells) * this.maxPoints);
  }

  isFullyCompleted() {
    const validCells = this.getValidCellsMap();
    for (const [key, info] of Object.entries(validCells)) {
      if ((this.userGrid[key] || '').toUpperCase() !== info.expected) {
        return false;
      }
    }
    return true;
  }

  render() {
    if (!this.container) return;

    const validCells = this.getValidCellsMap();
    const activeWord = this.wordsDef.find(w => w.id === this.activeWordId) || this.wordsDef[0];
    const score = this.calcScore();

    this.container.innerHTML = `
      <div class="game-wrapper crossword-layout">
        <div class="game-intro">
          <div class="game-badge">NÍVEL 6 • MUITO DIFÍCIL</div>
          <h2>Cruzadinha SIPAT Manserv</h2>
          <p class="game-desc">
            Resolva as <strong>7 palavras cruzadas</strong> sobre procedimentos e normas de segurança. Toque nas pistas ou nas casas para preencher!
          </p>
          <div class="game-stats-bar">
            <span>Pista Ativa: <strong>${activeWord.num} ${activeWord.dir === 'H' ? 'Horizontal' : 'Vertical'}</strong></span>
            <span>Pontuação Atual: <strong>${score} / ${this.maxPoints} pts</strong></span>
          </div>
        </div>

        <div class="cw-active-clue-bar">
          <span class="clue-badge">${activeWord.num} ${activeWord.dir === 'H' ? 'Horizontal' : 'Vertical'}</span>
          <span class="clue-text">${activeWord.clue} (${activeWord.word.length} letras)</span>
        </div>

        <div class="cw-board-wrapper">
          <div class="cw-grid" style="grid-template-columns: repeat(${this.cols}, 1fr)">
            ${Array.from({ length: this.rows }).map((_, r) =>
              Array.from({ length: this.cols }).map((_, c) => {
                const key = `${r},${c}`;
                const cellInfo = validCells[key];

                if (!cellInfo) {
                  return `<div class="cw-cell-blocked"></div>`;
                }

                const val = this.userGrid[key] || '';
                const isActive = this.activeCell?.r === r && this.activeCell?.c === c;
                const isInActiveWord = cellInfo.words.includes(this.activeWordId);
                let cellClass = 'cw-cell';
                if (isActive) cellClass += ' cell-active';
                else if (isInActiveWord) cellClass += ' cell-word-highlight';

                if (this.isVerified) {
                  cellClass += val.toUpperCase() === cellInfo.expected ? ' cell-correct' : ' cell-wrong';
                }

                return `
                  <button type="button" class="${cellClass}" data-r="${r}" data-c="${c}" id="cw-cell-${r}-${c}">
                    ${cellInfo.number ? `<span class="cw-num">${cellInfo.number}</span>` : ''}
                    <span class="cw-val">${val}</span>
                  </button>
                `;
              }).join('')
            ).join('')}
          </div>
        </div>

        <div class="cw-keyboard-and-clues">
          <!-- Mobile Virtual Keyboard -->
          <div class="cw-virtual-kb">
            <div class="cw-kb-row">
              ${'QWERTYUIOP'.split('').map(l => `<button class="cw-kb-btn" data-key="${l}">${l}</button>`).join('')}
            </div>
            <div class="cw-kb-row">
              ${'ASDFGHJKL'.split('').map(l => `<button class="cw-kb-btn" data-key="${l}">${l}</button>`).join('')}
            </div>
            <div class="cw-kb-row">
              ${'ZXCVBNM'.split('').map(l => `<button class="cw-kb-btn" data-key="${l}">${l}</button>`).join('')}
              <button class="cw-kb-btn kb-action" data-key="BACKSPACE">⌫</button>
            </div>
          </div>

          <div class="cw-clues-container">
            <div class="cw-clues-col">
              <h4>Horizontais:</h4>
              <div class="cw-clue-list">
                ${this.wordsDef.filter(w => w.dir === 'H').map(w => `
                  <div class="cw-clue-item ${this.activeWordId === w.id ? 'active' : ''}" data-word-id="${w.id}">
                    <span class="clue-num">${w.num}.</span>
                    <span class="clue-txt">${w.clue} (${w.word.length}L)</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="cw-clues-col">
              <h4>Verticais:</h4>
              <div class="cw-clue-list">
                ${this.wordsDef.filter(w => w.dir === 'V').map(w => `
                  <div class="cw-clue-item ${this.activeWordId === w.id ? 'active' : ''}" data-word-id="${w.id}">
                    <span class="clue-num">${w.num}.</span>
                    <span class="clue-txt">${w.clue} (${w.word.length}L)</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="game-action-footer">
          <button type="button" class="btn btn-secondary" onclick="window.app?.showHub()">
            ← Voltar ao Hub
          </button>
          <button type="button" class="btn btn-secondary" id="cw-btn-clear">
            Limpar Letras
          </button>
          <button type="button" class="btn btn-primary btn-highlight" id="cw-btn-verify">
            Verificar e Concluir Nível 6 ✓
          </button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const validCells = this.getValidCellsMap();

    // Cell clicks
    const cells = this.container.querySelectorAll('.cw-cell');
    cells.forEach(c => {
      c.addEventListener('click', () => {
        const r = parseInt(c.dataset.r, 10);
        const col = parseInt(c.dataset.c, 10);
        const key = `${r},${col}`;
        const info = validCells[key];
        if (!info) return;

        window.sounds?.playClick();
        this.activeCell = { r, c: col };

        // Toggle direction if already in the word
        if (info.words.length > 1 && info.words.includes(this.activeWordId)) {
          this.activeWordId = info.words.find(w => w !== this.activeWordId);
        } else if (info.words.length > 0 && !info.words.includes(this.activeWordId)) {
          this.activeWordId = info.words[0];
        }

        this.enableMobileKeyboard();
        this.render();
      });
    });

    // Clue clicks
    const clueItems = this.container.querySelectorAll('.cw-clue-item');
    clueItems.forEach(item => {
      item.addEventListener('click', () => {
        window.sounds?.playClick();
        const wordId = item.dataset.wordId;
        const w = this.wordsDef.find(x => x.id === wordId);
        if (w) {
          this.activeWordId = wordId;
          this.activeCell = { r: w.row, c: w.col };
          this.enableMobileKeyboard();
          this.render();
        }
      });
    });

    // Virtual Keyboard
    const kbBtns = this.container.querySelectorAll('.cw-kb-btn');
    kbBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        this.handleKeyPress(key);
      });
    });

    // Physical Keyboard (desktop ou celular com o input oculto focado)
    const keyHandler = (e) => {
      // Only process when crossword is in DOM
      if (!document.getElementById('cw-btn-verify')) return;
      // Eventos vindos do input oculto já são tratados no próprio input
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

      if (e.key === 'Backspace') {
        this.handleKeyPress('BACKSPACE');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        this.handleKeyPress(e.key.toUpperCase());
      }
    };
    window.onkeydown = keyHandler;

    const clearBtn = document.getElementById('cw-btn-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.userGrid = {};
        this.isVerified = false;
        this.render();
      });
    }

    const verifyBtn = document.getElementById('cw-btn-verify');
    if (verifyBtn) {
      verifyBtn.addEventListener('click', () => {
        this.verifyCrossword();
      });
    }
  }

  // Input invisível que abre o teclado nativo do celular ao selecionar uma palavra/casa
  enableMobileKeyboard() {
    if (!this.hiddenInput || !this.hiddenInput.isConnected) {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'cw-hidden-input';
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('autocorrect', 'off');
      input.setAttribute('autocapitalize', 'characters');
      input.setAttribute('spellcheck', 'false');
      input.setAttribute('maxlength', '1');
      input.setAttribute('aria-hidden', 'true');
      input.setAttribute('tabindex', '-1');

      input.addEventListener('input', () => {
        if (!document.getElementById('cw-btn-verify')) return;
        const typed = input.value.toUpperCase().replace(/[^A-Z]/g, '');
        input.value = '';
        for (const char of typed) {
          this.handleKeyPress(char);
        }
        input.focus({ preventScroll: true });
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
          if (!input.value) {
            e.preventDefault();
            this.handleKeyPress('BACKSPACE');
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
        }
      });

      document.body.appendChild(input);
      this.hiddenInput = input;
    }

    try {
      this.hiddenInput.focus({ preventScroll: true });
    } catch (err) {
      this.hiddenInput.focus();
    }
  }

  removeHiddenInput() {
    document.querySelectorAll('.cw-hidden-input').forEach(el => {
      if (document.activeElement === el) el.blur();
      el.remove();
    });
    this.hiddenInput = null;
  }

  handleKeyPress(char) {
    if (!this.activeCell) return;
    const { r, c } = this.activeCell;
    const key = `${r},${c}`;
    const validCells = this.getValidCellsMap();
    if (!validCells[key]) return;

    if (char === 'BACKSPACE') {
      window.sounds?.playClick();
      delete this.userGrid[key];
      this.moveStep(-1);
    } else {
      window.sounds?.playClick();
      this.userGrid[key] = char;
      this.moveStep(1);
    }

    this.render();
  }

  moveStep(delta) {
    const currentWord = this.wordsDef.find(w => w.id === this.activeWordId);
    if (!currentWord || !this.activeCell) return;

    const { r, c } = this.activeCell;
    const nextR = currentWord.dir === 'H' ? r : r + delta;
    const nextC = currentWord.dir === 'H' ? c + delta : c;

    // Check if within bounds of word
    const idxInWord = currentWord.dir === 'H' ? nextC - currentWord.col : nextR - currentWord.row;
    if (idxInWord >= 0 && idxInWord < currentWord.word.length) {
      this.activeCell = { r: nextR, c: nextC };
    }
  }

  verifyCrossword() {
    this.isVerified = true;
    const isWon = this.isFullyCompleted();
    const score = this.calcScore();

    if (isWon) {
      window.sounds?.playLevelComplete();
      window.triggerConfetti?.(3000);
      window.gameState?.setGameScore('level6', this.maxPoints, true, {
        answers: this.userGrid
      });
      this.showCompleteModal();
    } else {
      if (score >= this.maxPoints * 0.5) {
        window.sounds?.playCorrect();
      } else {
        window.sounds?.playWrong();
      }
      window.gameState?.setGameScore('level6', score, false, {
        answers: this.userGrid
      });
      this.render();
    }
  }

  showCompleteModal() {
    const banner = document.createElement('div');
    banner.className = 'level-complete-modal-overlay';
    banner.innerHTML = `
      <div class="level-complete-card">
        <div class="complete-icon">👑</div>
        <h3>Magnífico! Cruzadinha Decifrada!</h3>
        <p>Você completou o Nível 6, o mais complexo de toda a jornada SIPAT Manserv!</p>
        <div class="points-reward-tag">+230 PONTOS CONQUISTADOS</div>
        <div class="modal-actions-row">
          <button class="btn btn-secondary" onclick="window.app?.showHub()">Voltar ao Hub de Jogos</button>
          <button class="btn btn-primary btn-highlight" onclick="window.app?.openSubmitModal()">
            Finalizar e Enviar Pontuação Geral 🚀
          </button>
        </div>
      </div>
    `;
    this.container.appendChild(banner);
  }
}

window.CrosswordGame = CrosswordGame;
