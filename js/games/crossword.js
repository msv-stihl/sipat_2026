// NÍVEL 6 – CRUZADINHA (Muito Difícil - 230 Pontos)
class CrosswordGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.rows = 17;
    this.cols = 12;
    this.maxPoints = 230;

    // Palavras e coordenadas fiéis ao layout de grid do usuário
    this.wordsDef = [
      {
        id: '1H',
        num: 1,
        dir: 'H',
        word: 'PREVENCAO',
        display: 'PREVENÇÃO',
        clue: 'Conjunto de medidas adotadas para reduzir a probabilidade de ocorrências indesejadas.',
        row: 2,
        col: 3
      },
      {
        id: '2V',
        num: 2,
        dir: 'V',
        word: 'CONSCIENTIZACAO',
        display: 'CONSCIENTIZAÇÃO',
        clue: 'Processo que ajuda as pessoas a reconhecerem os riscos e compreenderem a importância de agir com segurança.',
        row: 2,
        col: 9
      },
      {
        id: '3V',
        num: 3,
        dir: 'V',
        word: 'INCIDENTE',
        display: 'INCIDENTE',
        clue: 'Ocorrência que poderia resultar ou que resultou em danos, dependendo de sua natureza e das consequências.',
        row: 6,
        col: 2
      },
      {
        id: '4H',
        num: 4,
        dir: 'H_REV', // Horizontal da direita para a esquerda (I -> S -> O -> L -> A -> M -> E -> N -> T -> O)
        word: 'ISOLAMENTO',
        display: 'ISOLAMENTO',
        clue: 'Medida que impede ou limita o acesso a uma área de risco.',
        row: 7,
        col: 9
      },
      {
        id: '5V',
        num: 5,
        dir: 'V',
        word: 'AVENTAL',
        display: 'AVENTAL',
        clue: 'Vestimenta de proteção utilizada para proteger o corpo contra riscos específicos.',
        row: 1,
        col: 6
      },
      {
        id: '6V',
        num: 6,
        dir: 'V',
        word: 'CORRIMAO',
        display: 'CORRIMÃO',
        clue: 'Estrutura que oferece apoio às mãos durante o deslocamento em escadas e rampas.',
        row: 6,
        col: 7
      },
      {
        id: '7V',
        num: 7,
        dir: 'V',
        word: 'PT',
        display: 'PT',
        clue: 'Sigla de um documento que autoriza formalmente determinadas atividades de risco, conforme procedimento estabelecido.',
        row: 6,
        col: 1
      }
    ];

    // Células de numeração em destaque laranja adjacentes às palavras (layout idêntico ao modelo)
    this.badgeCells = [
      { num: 1, r: 2, c: 2, wordId: '1H' },
      { num: 2, r: 1, c: 9, wordId: '2V' },
      { num: 3, r: 5, c: 2, wordId: '3V' },
      { num: 4, r: 7, c: 10, wordId: '4H' },
      { num: 5, r: 0, c: 6, wordId: '5V' },
      { num: 6, r: 5, c: 7, wordId: '6V' },
      { num: 7, r: 5, c: 1, wordId: '7V' }
    ];

    this.userGrid = {}; // 'r,c' -> letter
    this.activeWordId = '1H';
    this.activeCell = { r: 2, c: 3 };
    this.isVerified = false;
    this.hiddenInput = null;
  }

  init() {
    this.removeHiddenInput();
    this.userGrid = {};
    this.activeWordId = '1H';
    this.activeCell = { r: 2, c: 3 };
    this.isVerified = false;
    this.render();
  }

  // Mapeamento de células válidas: 'r,c' -> { expected: char, words: ['1H', ...] }
  getValidCellsMap() {
    const map = {};

    for (const w of this.wordsDef) {
      for (let i = 0; i < w.word.length; i++) {
        let r = w.row;
        let c = w.col;

        if (w.dir === 'H') {
          c = w.col + i;
        } else if (w.dir === 'H_REV') {
          c = w.col - i;
        } else if (w.dir === 'V') {
          r = w.row + i;
        }

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
          <div class="game-intro-header">
            <div class="game-intro-icon-box">
              <img src="assets/icons/level6.png" alt="Cruzadinha SIPAT" />
            </div>
            <div>
              <div class="game-badge">NÍVEL 6 • MUITO DIFÍCIL</div>
              <h2>Cruzadinha SIPAT Manserv</h2>
            </div>
          </div>
          <p class="game-desc">
            Resolva as <strong>7 palavras cruzadas</strong> sobre procedimentos e normas de segurança. Toque nas pistas, números ou casas para preencher!
          </p>
          <div class="game-stats-bar">
            <span>Pista Ativa: <strong>${activeWord.num} ${activeWord.dir.startsWith('H') ? 'Horizontal' : 'Vertical'}</strong></span>
            <span>Pontuação Atual: <strong>${score} / ${this.maxPoints} pts</strong></span>
          </div>
        </div>

        <div class="cw-active-clue-bar">
          <span class="clue-badge">${activeWord.num} ${activeWord.dir.startsWith('H') ? 'Horizontal' : 'Vertical'}</span>
          <span class="clue-text"><strong>${activeWord.display || activeWord.word}:</strong> ${activeWord.clue} (${activeWord.word.length} letras)</span>
        </div>

        <div class="cw-board-wrapper">
          <div class="cw-grid" style="grid-template-columns: repeat(${this.cols}, 1fr)">
            ${Array.from({ length: this.rows }).map((_, r) =>
              Array.from({ length: this.cols }).map((_, c) => {
                const key = `${r},${c}`;

                // Verifica se é uma das caixas laranjas de numeração (conforme layout do usuário)
                const badge = this.badgeCells.find(b => b.r === r && b.c === c);
                if (badge) {
                  const isBadgeActive = this.activeWordId === badge.wordId;
                  return `
                    <button type="button" class="cw-badge-cell ${isBadgeActive ? 'badge-active' : ''}" data-word-id="${badge.wordId}" id="cw-badge-${badge.num}" title="Selecionar Palavra ${badge.num}">
                      ${badge.num}
                    </button>
                  `;
                }

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
                ${this.wordsDef.filter(w => w.dir.startsWith('H')).map(w => `
                  <div class="cw-clue-item ${this.activeWordId === w.id ? 'active' : ''}" data-word-id="${w.id}">
                    <span class="clue-num">${w.num}.</span>
                    <span class="clue-txt"><strong>${w.display || w.word}:</strong> ${w.clue} (${w.word.length}L)</span>
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
                    <span class="clue-txt"><strong>${w.display || w.word}:</strong> ${w.clue} (${w.word.length}L)</span>
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

    // Cliques nas caixas laranjas de numeração
    const badgeBtns = this.container.querySelectorAll('.cw-badge-cell');
    badgeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const wordId = btn.dataset.wordId;
        const w = this.wordsDef.find(x => x.id === wordId);
        if (w) {
          window.sounds?.playClick();
          this.activeWordId = wordId;
          this.activeCell = { r: w.row, c: w.col };
          this.enableMobileKeyboard();
          this.render();
        }
      });
    });

    // Cliques nas casas de letras
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

        // Alterna direção caso a célula pertença a mais de uma palavra
        if (info.words.length > 1 && info.words.includes(this.activeWordId)) {
          this.activeWordId = info.words.find(w => w !== this.activeWordId);
        } else if (info.words.length > 0 && !info.words.includes(this.activeWordId)) {
          this.activeWordId = info.words[0];
        }

        this.enableMobileKeyboard();
        this.render();
      });
    });

    // Cliques nas dicas de texto
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

    // Teclado virtual na tela
    const kbBtns = this.container.querySelectorAll('.cw-kb-btn');
    kbBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        this.handleKeyPress(key);
      });
    });

    // Teclado físico desktop
    const keyHandler = (e) => {
      if (!document.getElementById('cw-btn-verify')) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

      if (e.key === 'Backspace') {
        this.handleKeyPress('BACKSPACE');
      } else if (e.key && e.key.length === 1) {
        // Normaliza caracteres com acentos (ex: ç -> C, ã -> A)
        const norm = e.key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
        if (/^[A-Z]$/.test(norm)) {
          this.handleKeyPress(norm);
        }
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

  // Input invisível para acionar o teclado nativo de celulares
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
        const norm = input.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
        const typed = norm.replace(/[^A-Z]/g, '');
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
    let nextR = r;
    let nextC = c;

    if (currentWord.dir === 'H') {
      nextC = c + delta;
    } else if (currentWord.dir === 'H_REV') {
      nextC = c - delta;
    } else if (currentWord.dir === 'V') {
      nextR = r + delta;
    }

    // Verifica limites dentro da palavra ativa
    let idxInWord = 0;
    if (currentWord.dir === 'H') {
      idxInWord = nextC - currentWord.col;
    } else if (currentWord.dir === 'H_REV') {
      idxInWord = currentWord.col - nextC;
    } else if (currentWord.dir === 'V') {
      idxInWord = nextR - currentWord.row;
    }

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
