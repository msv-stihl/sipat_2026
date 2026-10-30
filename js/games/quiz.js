// NÍVEL 3 – QUESTIONÁRIO (150 Pontos)
class QuizGame {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.baseQuestions = [
      {
        id: 1,
        question: 'Você identificou uma condição insegura durante sua atividade. O que deve fazer?',
        options: [
          { key: 'A', text: 'Ignorar, pois não aconteceu nenhum acidente' },
          { key: 'B', text: 'Continuar e avisar no final do turno' },
          { key: 'C', text: 'Comunicar a situação e tomar as medidas necessárias' },
          { key: 'D', text: 'Esperar outro colaborador resolver' }
        ],
        correct: 'C',
        explanation: 'Condições inseguras exigem comunicação imediata e paralisação/correção antes que gerem um quase-acidente ou lesão.'
      },
      {
        id: 2,
        question: 'Você está atrasado para concluir uma atividade e percebe que uma etapa do procedimento vai levar mais tempo. O que fazer?',
        options: [
          { key: 'A', text: 'Pular a etapa para ganhar tempo.' },
          { key: 'B', text: 'Fazer de qualquer jeito, desde que termine.' },
          { key: 'C', text: 'Seguir o procedimento, mesmo que leve mais tempo.' },
          { key: 'D', text: 'Pedir para um colega assumir a atividade sem explicar o motivo.' }
        ],
        correct: 'C',
        explanation: 'Na Manserv, a segurança precede a pressa. O procedimento operacional padrão (POP) garante que o trabalho seja feito sem riscos.'
      },
      {
        id: 3,
        question: 'Um colega diz: "Vou fazer rapidinho, nem precisa colocar o EPI." Qual seria a atitude mais segura?',
        options: [
          { key: 'A', text: 'Concordar, porque será rápido.' },
          { key: 'B', text: 'Deixar que ele decida sozinho.' },
          { key: 'C', text: 'Orientar que o EPI deve ser utilizado conforme o risco da atividade.' },
          { key: 'D', text: 'Só usar o EPI se o supervisor estiver por perto.' }
        ],
        correct: 'C',
        explanation: 'Praticar o Cuidado Ativo é intervir de forma fraterna e orientar que acidentes ocorrem em segundos, independente da rapidez da tarefa.'
      },
      {
        id: 4,
        question: 'Por que manter o local de trabalho organizado também é uma medida de segurança?',
        options: [
          { key: 'A', text: 'Apenas para deixar o ambiente mais bonito.' },
          { key: 'B', text: 'Porque facilita encontrar ferramentas e reduz riscos de acidentes.' },
          { key: 'C', text: 'Para evitar reclamações da liderança.' },
          { key: 'D', text: 'Porque é uma regra apenas para auditorias.' }
        ],
        correct: 'B',
        explanation: 'O programa 5S e a organização reduzem tropeços, quedas, obstrução de rotas de fuga e manuseio inadequado de materiais.'
      },
      {
        id: 5,
        question: 'Um colaborador diz: "Faço desse jeito há anos e nunca aconteceu nada." Essa afirmação significa que:',
        options: [
          { key: 'A', text: 'A atividade é segura.' },
          { key: 'B', text: 'O risco deixa de existir porque nunca houve acidente.' },
          { key: 'C', text: 'A experiência não elimina a necessidade de seguir os procedimentos de segurança.' },
          { key: 'D', text: 'Ele pode escolher qualquer forma de executar a atividade.' }
        ],
        correct: 'C',
        explanation: 'O excesso de confiança é uma armadilha comportamental comum. A ausência pretérita de acidente não anula o perigo presente.'
      }
    ];

    this.questions = [];
    this.currentIdx = 0;
    this.userAnswers = {}; // id -> 'A' | 'B' | 'C' | 'D'
    this.isSubmitted = false;
    this.maxPoints = 150;
    this.pointsPerQuestion = 30; // 5 * 30 = 150 pts
    this.passThreshold = 4; // Needs 4 of 5
  }

  shuffleOptions() {
    const letters = ['A', 'B', 'C', 'D'];
    this.questions = this.baseQuestions.map(bq => {
      const originalCorrectOpt = bq.options.find(o => o.key === bq.correct);
      const correctText = originalCorrectOpt ? originalCorrectOpt.text : '';

      const shuffledTexts = bq.options.map(o => o.text);
      for (let i = shuffledTexts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledTexts[i], shuffledTexts[j]] = [shuffledTexts[j], shuffledTexts[i]];
      }

      const newOptions = shuffledTexts.map((text, idx) => ({
        key: letters[idx],
        text
      }));

      const newCorrectOpt = newOptions.find(o => o.text === correctText);

      return {
        id: bq.id,
        question: bq.question,
        options: newOptions,
        correct: newCorrectOpt ? newCorrectOpt.key : 'A',
        explanation: bq.explanation
      };
    });
  }

  init() {
    this.currentIdx = 0;
    this.userAnswers = {};
    this.isSubmitted = false;
    this.shuffleOptions();
    this.render();
  }

  getCorrectCount() {
    let count = 0;
    for (const q of this.questions) {
      if (this.userAnswers[q.id] === q.correct) {
        count++;
      }
    }
    return count;
  }

  render() {
    if (!this.container) return;

    if (this.isSubmitted) {
      this.renderSummary();
      return;
    }

    const q = this.questions[this.currentIdx];
    const selectedAnswer = this.userAnswers[q.id];
    const answeredCount = Object.keys(this.userAnswers).length;

    this.container.innerHTML = `
      <div class="game-wrapper quiz-layout">
        <div class="game-intro">
          <div class="game-intro-header">
            <div class="game-intro-icon-box">
              <img src="assets/icons/level3.png" alt="Questionário" />
            </div>
            <div>
              <div class="game-badge">NÍVEL 3 • MÉDIO</div>
              <h2>Questionário de Segurança Operacional</h2>
            </div>
          </div>
          <p class="game-desc">
            Responda às 5 perguntas sobre segurança no dia a dia. <strong>Você precisa acertar pelo menos 4 das 5 perguntas para ser aprovado!</strong>
          </p>
          <div class="game-stats-bar">
            <span>Pergunta: <strong>${this.currentIdx + 1} de ${this.questions.length}</strong></span>
            <span>Respondidas: <strong>${answeredCount} / ${this.questions.length}</strong></span>
            <span>Meta de Aprovação: <strong>4 acertos (120+ pts)</strong></span>
          </div>
        </div>

        <div class="quiz-stepper">
          ${this.questions.map((item, idx) => `
            <button type="button" class="stepper-dot ${this.currentIdx === idx ? 'active' : ''} ${this.userAnswers[item.id] ? 'answered' : ''}" data-idx="${idx}">
              ${idx + 1}
            </button>
          `).join('')}
        </div>

        <div class="quiz-card">
          <div class="question-header">
            <span class="q-number">Questão ${this.currentIdx + 1}</span>
            <h3 class="q-text">${q.question}</h3>
          </div>

          <div class="quiz-options-list">
            ${q.options.map(opt => `
              <label class="quiz-option-label ${selectedAnswer === opt.key ? 'selected' : ''}" for="opt-${q.id}-${opt.key}">
                <input type="radio" name="question_${q.id}" id="opt-${q.id}-${opt.key}" value="${opt.key}" ${selectedAnswer === opt.key ? 'checked' : ''} />
                <span class="opt-letter">${opt.key}</span>
                <span class="opt-text">${opt.text}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="quiz-nav-row">
          <button type="button" class="btn btn-secondary" id="quiz-btn-prev" ${this.currentIdx === 0 ? 'disabled' : ''}>
            ← Anterior
          </button>

          ${this.currentIdx < this.questions.length - 1 ? `
            <button type="button" class="btn btn-primary" id="quiz-btn-next">
              Próxima →
            </button>
          ` : `
            <button type="button" class="btn btn-primary btn-highlight" id="quiz-btn-finish" ${answeredCount < this.questions.length ? 'disabled title="Responda todas as perguntas"' : ''}>
              Concluir e Avaliar Respostas ✓
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
    // Option clicks
    const labels = this.container.querySelectorAll('.quiz-option-label');
    labels.forEach(lbl => {
      lbl.addEventListener('click', () => {
        const input = lbl.querySelector('input');
        if (!input) return;
        window.sounds?.playClick();
        const q = this.questions[this.currentIdx];
        this.userAnswers[q.id] = input.value;
        this.render();
      });
    });

    // Stepper dots
    const dots = this.container.querySelectorAll('.stepper-dot');
    dots.forEach(d => {
      d.addEventListener('click', () => {
        window.sounds?.playClick();
        this.currentIdx = parseInt(d.dataset.idx, 10);
        this.render();
      });
    });

    const prevBtn = document.getElementById('quiz-btn-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        window.sounds?.playClick();
        if (this.currentIdx > 0) {
          this.currentIdx--;
          this.render();
        }
      });
    }

    const nextBtn = document.getElementById('quiz-btn-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        window.sounds?.playClick();
        if (this.currentIdx < this.questions.length - 1) {
          this.currentIdx++;
          this.render();
        }
      });
    }

    const finishBtn = document.getElementById('quiz-btn-finish');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        this.submitQuiz();
      });
    }
  }

  submitQuiz() {
    const correctCount = this.getCorrectCount();
    const passed = correctCount >= this.passThreshold;
    const earnedScore = correctCount * this.pointsPerQuestion;

    this.isSubmitted = true;

    if (passed) {
      window.sounds?.playLevelComplete();
      window.triggerConfetti?.(2500);
      window.gameState?.setGameScore('level3', earnedScore, true, {
        correctCount,
        answers: this.userAnswers
      });
    } else {
      window.sounds?.playWrong();
      window.gameState?.setGameScore('level3', earnedScore, false, {
        correctCount,
        answers: this.userAnswers
      });
    }

    this.render();
  }

  renderSummary() {
    const correctCount = this.getCorrectCount();
    const passed = correctCount >= this.passThreshold;
    const earnedScore = correctCount * this.pointsPerQuestion;

    this.container.innerHTML = `
      <div class="game-wrapper quiz-summary-layout">
        <div class="quiz-result-banner ${passed ? 'passed' : 'failed'}">
          <div class="result-icon">${passed ? '🏆' : '⚠️'}</div>
          <h2>${passed ? 'Nível Aprovado com Sucesso!' : 'Atenção: Meta Mínima Não Atingida'}</h2>
          <p>
            Você acertou <strong>${correctCount} de ${this.questions.length}</strong> perguntas.
            ${passed ? 'Parabéns pela dedicação aos padrões de segurança Manserv!' : 'O colaborador precisa acertar no mínimo 4 das 5 perguntas para avançar.'}
          </p>
          <div class="points-reward-tag">${earnedScore} / ${this.maxPoints} PONTOS CONQUISTADOS</div>
        </div>

        <div class="quiz-review-section">
          <h3>Gabarito Comentado:</h3>
          <div class="review-cards-list">
            ${this.questions.map((q, idx) => {
              const userAns = this.userAnswers[q.id];
              const isCorrect = userAns === q.correct;
              const correctOpt = q.options.find(o => o.key === q.correct);
              const userOpt = q.options.find(o => o.key === userAns);

              return `
                <div class="review-card ${isCorrect ? 'correct' : 'incorrect'}">
                  <div class="review-header">
                    <span class="review-q-num">Questão ${idx + 1}</span>
                    <span class="review-status-tag">${isCorrect ? '✓ Acertou (+30 pts)' : '✕ Errou (0 pts)'}</span>
                  </div>
                  <p class="review-question"><strong>${q.question}</strong></p>
                  
                  <div class="review-answers-box">
                    <p class="user-choice ${isCorrect ? 'text-success' : 'text-danger'}">
                      Sua resposta: <strong>${userAns}) ${userOpt?.text || ''}</strong>
                    </p>
                    ${!isCorrect ? `
                      <p class="correct-choice text-success">
                        Resposta correta: <strong>${q.correct}) ${correctOpt?.text || ''}</strong>
                      </p>
                    ` : ''}
                  </div>

                  <div class="review-explanation">
                    <strong>Explicação:</strong> ${q.explanation}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="quiz-summary-actions">
          ${passed ? `
            <button class="btn btn-secondary" onclick="window.app?.showHub()">Voltar ao Hub de Jogos</button>
            <button class="btn btn-primary" onclick="window.app?.openGame('level4')">Jogar Nível 4 (Tomada de Decisão) →</button>
          ` : `
            <button class="btn btn-secondary" onclick="window.app?.showHub()">Voltar ao Hub</button>
            <button class="btn btn-primary" id="quiz-btn-retry">Refazer Questionário ↻</button>
          `}
        </div>
      </div>
    `;

    const retryBtn = document.getElementById('quiz-btn-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.init();
      });
    }
  }
}

window.QuizGame = QuizGame;
