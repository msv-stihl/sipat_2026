// NÍVEL 4 – TOMADA DE DECISÃO (180 Pontos)
class DecisionGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.baseSituations = [
      {
        id: 1,
        title: 'Situação 1: Condição Inesperada no Equipamento',
        scenario: 'Você chega para realizar uma atividade e percebe que a condição do equipamento não está conforme o planejado.',
        icon: '⚙️',
        options: [
          {
            key: 'A',
            text: 'Realizo a atividade mesmo assim.',
            isCorrect: false,
            outcome: 'Risco Alto! Prosseguir em condições não planejadas aumenta drasticamente a probabilidade de acidentes e quebra de componentes.'
          },
          {
            key: 'B',
            text: 'Improviso uma solução para terminar mais rápido.',
            isCorrect: false,
            outcome: 'Perigo! O improviso é um dos maiores causadores de incidentes graves na indústria. Procedimentos existem para proteger vidas.'
          },
          {
            key: 'C',
            text: 'Paro, verifico a condição e comunico/solicito orientação antes de prosseguir.',
            isCorrect: true,
            outcome: 'Atitude Correta! A regra de ouro é "Pare, Pense e Pratique". Comunicar a liderança assegura a revisão das medidas de controle.'
          },
          {
            key: 'D',
            text: 'Deixo para outro colaborador.',
            isCorrect: false,
            outcome: 'Inadequado. Transferir o problema sem relatar coloca outro colega de equipe sob risco sem aviso prévio.'
          }
        ],
        ruleApplied: 'Regra de Ouro Manserv: Pare e Avalie'
      },
      {
        id: 2,
        title: 'Situação 2: Colega em Atividade Insegura',
        scenario: 'Um colega está realizando uma atividade de forma insegura no setor.',
        icon: '👥',
        options: [
          {
            key: 'A',
            text: 'Não interfere, pois cada colaborador é responsável pela sua própria segurança.',
            isCorrect: false,
            outcome: 'Incorreto. A segurança é coletiva. Na Manserv praticamos o Cuidado Ativo: "Eu cuido de você, você cuida de mim".'
          },
          {
            key: 'B',
            text: 'Espera a atividade terminar e depois comenta com o colega sobre o risco.',
            isCorrect: false,
            outcome: 'Muito arriscado! O acidente pode acontecer a qualquer segundo antes da atividade terminar. A intervenção deve ser imediata.'
          },
          {
            key: 'C',
            text: 'Interrompe a situação de forma segura, orienta o colega sobre o risco e, se necessário, comunica a liderança.',
            isCorrect: true,
            outcome: 'Atitude Perfeita! Interromper com respeito e orientação fraterna salva vidas e fortalece o ambiente de trabalho seguro.'
          },
          {
            key: 'D',
            text: 'Apenas avisa o colega que ele está fazendo errado e segue com sua atividade.',
            isCorrect: false,
            outcome: 'Insuficiente. Não basta apontar o erro de passagem; é necessário certificar-se de que a condição insegura foi cessada.'
          }
        ],
        ruleApplied: 'Princípio do Cuidado Ativo'
      },
      {
        id: 3,
        title: 'Situação 3: Manutenção e Adaptação Não Prevista',
        scenario: 'Você está realizando uma manutenção em um equipamento e, durante o serviço, percebe uma condição diferente da que havia sido identificada inicialmente. Para continuar, seria necessário fazer uma adaptação que não está prevista no procedimento.',
        icon: '🔧',
        options: [
          {
            key: 'A',
            text: 'Faz uma pequena adaptação, desde que não altere o funcionamento do equipamento.',
            isCorrect: false,
            outcome: 'Risco Crítico! Pequenas adaptações não homologadas por engenharia ou segurança podem falhar sob carga e causar acidentes.'
          },
          {
            key: 'B',
            text: 'Pede a um colega mais experiente uma opinião e, se ele concordar, continua a atividade.',
            isCorrect: false,
            outcome: 'Incorreto. Mesmo colegas experientes não têm autoridade para alterar procedimentos formais de segurança sem análise técnica.'
          },
          {
            key: 'C',
            text: 'Interrompe a atividade, avalia a nova condição de risco e busca a orientação/autorização necessária antes de prosseguir.',
            isCorrect: true,
            outcome: 'Decisão Exemplar! O Direito de Recusa e a Gestão de Mudança garantem que qualquer nova condição seja avaliada tecnicamente.'
          },
          {
            key: 'D',
            text: 'Continua a atividade com mais atenção, pois interrompê-la pode atrasar a programação.',
            isCorrect: false,
            outcome: 'Inadmissível. Nenhum cronograma ou prazo justifica colocar a integridade física em risco.'
          }
        ],
        ruleApplied: 'Direito de Recusa e Gestão de Mudança'
      }
    ];

    this.situations = [];
    this.currentIdx = 0;
    this.decisions = {}; // id -> { selectedKey: 'A', isCorrect: bool }
    this.maxPoints = 180;
    this.pointsPerSituation = 60; // 3 * 60 = 180 pts
  }

  shuffleOptions() {
    const letters = ['A', 'B', 'C', 'D'];
    this.situations = this.baseSituations.map(bs => {
      const shuffledOptions = bs.options.map(o => ({ ...o }));
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      }

      const newOptions = shuffledOptions.map((opt, idx) => ({
        ...opt,
        key: letters[idx]
      }));

      return {
        ...bs,
        options: newOptions
      };
    });
  }

  init() {
    this.currentIdx = 0;
    this.decisions = {};
    this.shuffleOptions();
    this.render();
  }

  getCurrentScore() {
    let score = 0;
    for (const sit of this.situations) {
      if (this.decisions[sit.id]?.isCorrect) {
        score += this.pointsPerSituation;
      }
    }
    return score;
  }

  isAllCompleted() {
    return this.situations.every(s => this.decisions[s.id]?.isCorrect);
  }

  render() {
    if (!this.container) return;

    const sit = this.situations[this.currentIdx];
    const currentDecision = this.decisions[sit.id];
    const currentScore = this.getCurrentScore();

    this.container.innerHTML = `
      <div class="game-wrapper decision-layout">
        <div class="game-intro">
          <div class="game-badge">NÍVEL 4 • MÉDIO / AVANÇADO</div>
          <h2>Tomada de Decisão em Campo</h2>
          <p class="game-desc">
            Coloque em prática as <strong>Regras que Salvam Vidas</strong> da Manserv em 3 situações reais de campo. Cada decisão correta vale 60 pontos!
          </p>
          <div class="game-stats-bar">
            <span>Cenário: <strong>${this.currentIdx + 1} de ${this.situations.length}</strong></span>
            <span>Decisões Seguras: <strong>${Object.values(this.decisions).filter(d => d.isCorrect).length} / ${this.situations.length}</strong></span>
            <span>Pontuação: <strong>${currentScore} / ${this.maxPoints} pts</strong></span>
          </div>
        </div>

        <div class="decision-stepper">
          ${this.situations.map((item, idx) => {
            const dec = this.decisions[item.id];
            let dotClass = 'stepper-dot';
            if (this.currentIdx === idx) dotClass += ' active';
            if (dec?.isCorrect) dotClass += ' answered';
            else if (dec && !dec.isCorrect) dotClass += ' error-dot';

            return `
              <button type="button" class="${dotClass}" data-idx="${idx}">
                ${idx + 1}
              </button>
            `;
          }).join('')}
        </div>

        <div class="decision-card">
          <div class="decision-header">
            <span class="decision-icon">${sit.icon}</span>
            <div>
              <span class="scenario-tag">${sit.title}</span>
              <h3 class="scenario-text">${sit.scenario}</h3>
            </div>
          </div>

          <div class="decision-options-list">
            ${sit.options.map(opt => {
              const isSelected = currentDecision?.selectedKey === opt.key;
              let optClass = 'decision-option-btn';
              if (isSelected) {
                optClass += opt.isCorrect ? ' opt-correct' : ' opt-wrong';
              }

              return `
                <button type="button" class="${optClass}" data-key="${opt.key}" ${currentDecision?.isCorrect ? 'disabled' : ''}>
                  <div class="opt-left">
                    <span class="opt-badge">${opt.key}</span>
                    <span class="opt-text-desc">${opt.text}</span>
                  </div>
                  ${isSelected ? `<span class="opt-icon-feedback">${opt.isCorrect ? '✓' : '✕'}</span>` : ''}
                </button>
              `;
            }).join('')}
          </div>

          ${currentDecision ? `
            <div class="decision-outcome-box ${currentDecision.isCorrect ? 'box-success' : 'box-danger'}">
              <div class="outcome-header">
                <strong>${currentDecision.isCorrect ? '✓ Decisão Segura (+60 pts)' : '⚠️ Decisão Perigosa (Tente novamente)'}</strong>
                <span class="rule-tag">${sit.ruleApplied}</span>
              </div>
              <p class="outcome-desc">${sit.options.find(o => o.key === currentDecision.selectedKey)?.outcome}</p>
            </div>
          ` : ''}
        </div>

        <div class="decision-nav-row">
          <button type="button" class="btn btn-secondary" id="dec-btn-prev" ${this.currentIdx === 0 ? 'disabled' : ''}>
            ← Cenário Anterior
          </button>

          ${this.currentIdx < this.situations.length - 1 ? `
            <button type="button" class="btn btn-primary" id="dec-btn-next">
              Próximo Cenário →
            </button>
          ` : `
            <button type="button" class="btn btn-primary btn-highlight" id="dec-btn-finish" ${!this.isAllCompleted() ? 'disabled title="Acerte todos os cenários para concluir"' : ''}>
              Concluir Nível 4 🎉
            </button>
          `}
        </div>

        <div class="game-action-footer">
          <button type="button" class="btn btn-secondary" onclick="window.app?.showHub()">
            ← Voltar ao Hub
          </button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const sit = this.situations[this.currentIdx];

    const optButtons = this.container.querySelectorAll('.decision-option-btn');
    optButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const selectedOpt = sit.options.find(o => o.key === key);
        if (!selectedOpt) return;

        this.decisions[sit.id] = {
          selectedKey: key,
          isCorrect: selectedOpt.isCorrect
        };

        if (selectedOpt.isCorrect) {
          window.sounds?.playCorrect();
        } else {
          window.sounds?.playWrong();
        }

        const score = this.getCurrentScore();
        window.gameState?.setGameScore('level4', score, this.isAllCompleted(), {
          decisions: this.decisions
        });

        this.render();
      });
    });

    const stepperDots = this.container.querySelectorAll('.stepper-dot');
    stepperDots.forEach(d => {
      d.addEventListener('click', () => {
        window.sounds?.playClick();
        this.currentIdx = parseInt(d.dataset.idx, 10);
        this.render();
      });
    });

    const prevBtn = document.getElementById('dec-btn-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        window.sounds?.playClick();
        if (this.currentIdx > 0) {
          this.currentIdx--;
          this.render();
        }
      });
    }

    const nextBtn = document.getElementById('dec-btn-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        window.sounds?.playClick();
        if (this.currentIdx < this.situations.length - 1) {
          this.currentIdx++;
          this.render();
        }
      });
    }

    const finishBtn = document.getElementById('dec-btn-finish');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        this.handleLevelFinished();
      });
    }
  }

  handleLevelFinished() {
    window.sounds?.playLevelComplete();
    window.triggerConfetti?.(3000);

    const total = this.getCurrentScore();
    window.gameState?.setGameScore('level4', total, true, {
      decisions: this.decisions
    });

    const banner = document.createElement('div');
    banner.className = 'level-complete-modal-overlay';
    banner.innerHTML = `
      <div class="level-complete-card">
        <div class="complete-icon">🌟</div>
        <h3>Sensacional! Nível 4 Concluído!</h3>
        <p>Você tomou as melhores decisões nos 3 cenários operacionais e garantiu a segurança de todos!</p>
        <div class="points-reward-tag">+${total} PONTOS CONQUISTADOS</div>
        <div class="modal-actions-row">
          <button class="btn btn-secondary" onclick="window.app?.showHub()">Voltar ao Hub de Jogos</button>
          <button class="btn btn-primary" onclick="window.app?.openGame('level5')">Jogar Nível 5 (Encontre os Riscos) →</button>
        </div>
      </div>
    `;
    this.container.appendChild(banner);
  }
}

window.DecisionGame = DecisionGame;
