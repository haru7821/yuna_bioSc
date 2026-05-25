// GLOBAL STATE OBJECT
const state = {
  activeTab: 'quiz',
  
  // Quiz State
  quizStatus: 'setup', // 'setup', 'active', 'result'
  selectedCategories: ['nervous', 'homeostasis', 'genetics'],
  questions: [],
  currentQuestionIndex: 0,
  userAnswers: [], // Array of { questionId, chosenIndex, isCorrect }
  elapsedTime: 0,
  timerInterval: null,
  wrongQuestionsList: [], // Wrong questions from current quiz session

  // 30-Day Challenge State
  completedDays: {}, // { dayNumber: score }
  activeChallengeDay: null, // null or day object (1-30)
  challengeQuizStatus: 'study', // 'study', 'quiz', 'result'
  challengeQuizIndex: 0,
  challengeAnswers: [],

  // Highscores and general stats
  stats: {
    totalQuizzes: 0,
    averageScore: 0,
    highScore: 0,
    bestGrade: 9
  }
};

// DYNAMIC TAB REGISTRATION (Future-proof)
const TABS = [
  { id: 'quiz', label: '퀴즈 학습', icon: 'help-circle' },
  { id: 'challenge', label: '30일 챌린지', icon: 'calendar' }
];

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
  loadData();
  renderSidebar();
  switchTab(state.activeTab);
  
  // Global Event Listeners
  document.getElementById('app-sidebar').addEventListener('click', handleSidebarClick);
});

// Load state from localStorage
function loadData() {
  const savedCompletedDays = localStorage.getItem('completedDays');
  if (savedCompletedDays) {
    state.completedDays = JSON.parse(savedCompletedDays);
  }

  const savedStats = localStorage.getItem('quizStats');
  if (savedStats) {
    state.stats = JSON.parse(savedStats);
  }
}

// Save state to localStorage
function saveData() {
  localStorage.setItem('completedDays', JSON.stringify(state.completedDays));
  localStorage.setItem('quizStats', JSON.stringify(state.stats));
}

// Render the Sidebar menu dynamically based on TABS array
function renderSidebar() {
  const sidebarNav = document.getElementById('sidebar-navigation');
  sidebarNav.innerHTML = '';

  TABS.forEach(tab => {
    const li = document.createElement('li');
    li.className = 'menu-item';
    li.innerHTML = `
      <button class="menu-button ${state.activeTab === tab.id ? 'active' : ''}" data-tab="${tab.id}">
        <i data-lucide="${tab.icon}"></i>
        <span>${tab.label}</span>
      </button>
    `;
    sidebarNav.appendChild(li);
  });
  
  // Re-create lucide icons for dynamic items
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Handle Sidebar Clicking
function handleSidebarClick(e) {
  const button = e.target.closest('.menu-button');
  if (!button) return;
  
  const tabId = button.getAttribute('data-tab');
  switchTab(tabId);
}

// Switch Tabs
function switchTab(tabId) {
  state.activeTab = tabId;
  
  // Update sidebar buttons
  document.querySelectorAll('.menu-button').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  // Hide all panels, show active
  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  
  const activePanel = document.getElementById(`${tabId}-view`);
  if (activePanel) {
    activePanel.classList.add('active');
  }

  // Trigger render functions
  if (tabId === 'quiz') {
    renderQuizView();
  } else if (tabId === 'challenge') {
    renderChallengeView();
  }
}

/* ==========================================
   QUIZ LEARNING SYSTEM (퀴즈 학습)
   ========================================== */

function renderQuizView() {
  const container = document.getElementById('quiz-view');
  
  if (state.quizStatus === 'setup') {
    // Generate Setup Screen
    container.innerHTML = `
      <div class="quiz-setup-container">
        <div class="dashboard-header">
          <h1 class="welcome-title">단원별 모의 퀴즈</h1>
          <p class="welcome-desc">고2 생명과학 교과과정에서 무작위로 추출된 20문항을 통해 실력을 점검하세요.</p>
        </div>

        <div class="glass-card">
          <h3 class="section-title"><i data-lucide="check-square" style="color: var(--neon-cyan)"></i> 학습 영역 선택</h3>
          
          <div class="category-selection-grid">
            <div class="category-checkbox-card ${state.selectedCategories.includes('nervous') ? 'checked' : ''}" data-category="nervous">
              <span class="category-icon">🧠</span>
              <div class="category-name">신경계 & 근수축</div>
              <div class="category-desc">자극 전도, 뇌, 자율신경, 근수축 원리</div>
            </div>
            
            <div class="category-checkbox-card ${state.selectedCategories.includes('homeostasis') ? 'checked' : ''}" data-category="homeostasis">
              <span class="category-icon">🌡️</span>
              <div class="category-name">항상성 유지 & 면역</div>
              <div class="category-desc">호르몬 피드백, 삼투압, 면역, 혈액형</div>
            </div>
            
            <div class="category-checkbox-card ${state.selectedCategories.includes('genetics') ? 'checked' : ''}" data-category="genetics">
              <span class="category-icon">🧬</span>
              <div class="category-name">유전 & 세포 분열</div>
              <div class="category-desc">세포 주기, 감수 분열, 가계도, 돌연변이</div>
            </div>
          </div>

          <div style="display: flex; gap: 15px; margin-top: 2rem;">
            <button id="start-quiz-btn" class="btn btn-primary btn-block">퀴즈 시작하기 (20문항)</button>
          </div>
        </div>

        <div class="grid-3" style="margin-top: 2rem;">
          <div class="glass-card stat-card cyan">
            <div class="stat-icon"><i data-lucide="award"></i></div>
            <div>
              <div class="stat-label">최고 성적</div>
              <div class="stat-value numbers">${state.stats.highScore}점</div>
            </div>
          </div>
          <div class="glass-card stat-card emerald">
            <div class="stat-icon"><i data-lucide="shield-check"></i></div>
            <div>
              <div class="stat-label">최고 등급</div>
              <div class="stat-value numbers">${state.stats.bestGrade}등급</div>
            </div>
          </div>
          <div class="glass-card stat-card violet">
            <div class="stat-icon"><i data-lucide="hourglass"></i></div>
            <div>
              <div class="stat-label">누적 퀴즈 횟수</div>
              <div class="stat-value numbers">${state.stats.totalQuizzes}회</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Category click handler
    container.querySelectorAll('.category-checkbox-card').forEach(card => {
      card.addEventListener('click', () => {
        const cat = card.getAttribute('data-category');
        if (state.selectedCategories.includes(cat)) {
          if (state.selectedCategories.length > 1) {
            state.selectedCategories = state.selectedCategories.filter(c => c !== cat);
            card.classList.remove('checked');
          } else {
            alert("최소 하나의 학습 영역을 선택해야 합니다!");
          }
        } else {
          state.selectedCategories.push(cat);
          card.classList.add('checked');
        }
      });
    });

    document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);
    
  } else if (state.quizStatus === 'active') {
    // Generate Active Quiz Screen
    const currentQuestion = state.questions[state.currentQuestionIndex];
    const progressPercent = Math.round(((state.currentQuestionIndex) / state.questions.length) * 100);
    const timeFormatted = formatTime(state.elapsedTime);

    container.innerHTML = `
      <div class="quiz-active-container">
        <div class="quiz-header">
          <div class="quiz-progress-info">
            <span style="font-weight: 700; color: var(--neon-cyan);" class="numbers">Q ${state.currentQuestionIndex + 1}</span> 
            <span class="numbers">/ ${state.questions.length}</span>
            <span style="margin-left: 10px; color: var(--text-muted);">[${getCategoryName(currentQuestion.category)}]</span>
          </div>
          <div class="quiz-timer">
            <i data-lucide="timer"></i>
            <span class="numbers">${timeFormatted}</span>
          </div>
        </div>

        <div class="progress-track">
          <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>

        <div class="glass-card">
          <div class="question-text">${currentQuestion.question}</div>
          
          <ul class="options-list">
            ${currentQuestion.options.map((opt, idx) => `
              <li class="option-item">
                <button class="option-button" data-idx="${idx}">
                  <span class="option-index">${idx + 1}</span>
                  <span class="option-content">${opt}</span>
                </button>
              </li>
            `).join('')}
          </ul>

          <div id="quiz-feedback" class="feedback-panel" style="display: none;">
            <div class="explanation-card">
              <div class="explanation-title">
                <i data-lucide="info"></i> 해설 및 피드백
              </div>
              <div class="explanation-text">${currentQuestion.explanation}</div>
            </div>
            <button id="next-question-btn" class="btn btn-primary" style="float: right;">
              ${state.currentQuestionIndex === state.questions.length - 1 ? '결과 확인하기' : '다음 문제'} <i data-lucide="arrow-right"></i>
            </button>
            <div style="clear: both;"></div>
          </div>
        </div>
      </div>
    `;

    // Add click listeners to option buttons
    container.querySelectorAll('.option-button').forEach(btn => {
      btn.addEventListener('click', (e) => handleAnswerSelection(e, currentQuestion));
    });

  } else if (state.quizStatus === 'result') {
    // Generate Result Screen
    const score = calculateScore();
    const grade = calculateGrade(score);
    const timeFormatted = formatTime(state.elapsedTime);
    const categoryAnalysis = getCategoryAnalysis();
    
    // Advice based on Grade
    const advice = getAdvice(grade);

    container.innerHTML = `
      <div class="result-container">
        <div class="dashboard-header">
          <h1 class="welcome-title">퀴즈 완료 및 성취도 분석</h1>
          <p class="welcome-desc">학생의 정답 패턴과 풀이 시간을 토대로 모의 수능 등급 및 피드백을 제공합니다.</p>
        </div>

        <div class="grid-2">
          <div class="glass-card result-main">
            <div class="result-badge">${grade}등급</div>
            <div class="result-score-text">종합 성적</div>
            <div>
              <span class="result-score-val">${score}</span>
              <span class="result-score-total"> / 100점</span>
            </div>
            <p class="result-comment">${advice}</p>
          </div>

          <div class="glass-card">
            <h3 class="section-title"><i data-lucide="bar-chart-2" style="color: var(--neon-cyan)"></i> 학습 분석</h3>
            <div class="result-breakdown">
              <div class="breakdown-row">
                <div class="breakdown-label"><i data-lucide="clock"></i> 풀이 소요 시간</div>
                <div class="breakdown-value numbers">${timeFormatted}</div>
              </div>
              <div class="breakdown-row">
                <div class="breakdown-label">🧠 신경계 정답률</div>
                <div class="breakdown-value numbers">${categoryAnalysis.nervous}%</div>
              </div>
              <div class="breakdown-row">
                <div class="breakdown-label">🌡️ 항상성 정답률</div>
                <div class="breakdown-value numbers">${categoryAnalysis.homeostasis}%</div>
              </div>
              <div class="breakdown-row">
                <div class="breakdown-label">🧬 유전 정답률</div>
                <div class="breakdown-value numbers">${categoryAnalysis.genetics}%</div>
              </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 2rem;">
              <button id="restart-setup-btn" class="btn btn-primary btn-block">새로운 퀴즈 풀기</button>
            </div>
          </div>
        </div>

        ${state.wrongQuestionsList.length > 0 ? `
          <div class="wrong-questions-section">
            <h2 class="section-title" style="color: var(--neon-red);"><i data-lucide="x-circle"></i> 오답 복습 및 해설 노트</h2>
            ${state.wrongQuestionsList.map((wrong, idx) => `
              <div class="glass-card wrong-question-card">
                <div class="wrong-question-meta">
                  <span>오답 ${idx + 1}</span>
                  <span>단원: ${getCategoryName(wrong.questionObj.category)}</span>
                </div>
                <div class="wrong-question-text">${wrong.questionObj.question}</div>
                <div class="wrong-options-check">
                  <div class="wrong-option-pill user-pill">
                    ❌ 학생 선택 오답: ${wrong.questionObj.options[wrong.chosenIndex]}
                  </div>
                  <div class="wrong-option-pill correct-pill">
                    ✓ 정답: ${wrong.questionObj.options[wrong.questionObj.answer]}
                  </div>
                </div>
                <div class="explanation-card" style="margin-bottom: 0;">
                  <div class="explanation-title" style="color: var(--neon-emerald);">
                    <i data-lucide="info"></i> 해설 요약
                  </div>
                  <div class="explanation-text">${wrong.questionObj.explanation}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="glass-card" style="text-align: center; border-color: var(--neon-emerald); background: rgba(16, 185, 129, 0.02)">
            <h3 style="color: var(--neon-emerald); font-size: 1.5rem; margin-bottom: 10px;">🎉 만점! 완벽합니다!</h3>
            <p style="color: var(--text-muted)">모든 문항의 정답을 맞추셨습니다. 수능 생명과학 1등급에 한 걸음 더 다가섰습니다.</p>
          </div>
        `}
      </div>
    `;

    document.getElementById('restart-setup-btn').addEventListener('click', () => {
      state.quizStatus = 'setup';
      renderQuizView();
    });
  }

  // Generate Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Start Quiz (randomly selects 20 questions from selected categories)
function startQuiz() {
  // Gather available questions
  let pool = [];
  state.selectedCategories.forEach(cat => {
    if (questionPool[cat]) {
      // Add category tag to questions
      const tagged = questionPool[cat].map(q => ({ ...q, category: cat }));
      pool = pool.concat(tagged);
    }
  });

  if (pool.length === 0) {
    alert("선택된 영역에 문제가 없습니다.");
    return;
  }

  // Shuffle and pick 20 (or max pool size if smaller)
  const shuffled = pool.sort(() => 0.5 - Math.random());
  state.questions = shuffled.slice(0, Math.min(20, shuffled.length));
  
  // Reset quiz state
  state.currentQuestionIndex = 0;
  state.userAnswers = [];
  state.wrongQuestionsList = [];
  state.elapsedTime = 0;
  state.quizStatus = 'active';

  // Start Timer
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    state.elapsedTime++;
    // Update timer text dynamically in DOM without full re-render
    const timerSpan = document.querySelector('.quiz-timer span');
    if (timerSpan) {
      timerSpan.textContent = formatTime(state.elapsedTime);
    }
  }, 1000);

  renderQuizView();
}

// Answer Selection
function handleAnswerSelection(e, question) {
  // Disable option buttons to prevent multiple clicks
  const buttons = document.querySelectorAll('.option-button');
  buttons.forEach(btn => btn.disabled = true);

  const selectedBtn = e.currentTarget;
  const chosenIndex = parseInt(selectedBtn.getAttribute('data-idx'));
  const isCorrect = chosenIndex === question.answer;

  // Add styles
  if (isCorrect) {
    selectedBtn.classList.add('correct');
  } else {
    selectedBtn.classList.add('incorrect');
    // Highlight correct answer
    buttons[question.answer].classList.add('correct');
    
    // Add to wrong list
    state.wrongQuestionsList.push({
      questionObj: question,
      chosenIndex: chosenIndex
    });
  }

  // Save answer
  state.userAnswers.push({
    questionId: question.id,
    chosenIndex: chosenIndex,
    isCorrect: isCorrect
  });

  // Show feedback
  const feedback = document.getElementById('quiz-feedback');
  feedback.style.display = 'block';
  
  // Register next button
  document.getElementById('next-question-btn').onclick = () => {
    if (state.currentQuestionIndex === state.questions.length - 1) {
      // Quiz finished
      clearInterval(state.timerInterval);
      state.quizStatus = 'result';
      
      // Update global stats
      updateGlobalStats();
      renderQuizView();
    } else {
      state.currentQuestionIndex++;
      renderQuizView();
    }
  };
}

// Helpers
function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getCategoryName(cat) {
  switch (cat) {
    case 'nervous': return '신경계';
    case 'homeostasis': return '항상성';
    case 'genetics': return '유전';
    default: return '공통';
  }
}

function calculateScore() {
  const correctCount = state.userAnswers.filter(a => a.isCorrect).length;
  return Math.round((correctCount / state.questions.length) * 100);
}

// Calculate standard SAT grade based on score out of 100
function calculateGrade(score) {
  if (score >= 96) return 1;
  if (score >= 89) return 2;
  if (score >= 77) return 3;
  if (score >= 60) return 4;
  if (score >= 40) return 5;
  if (score >= 23) return 6;
  if (score >= 12) return 7;
  if (score >= 6) return 8;
  return 9;
}

function getCategoryAnalysis() {
  const analysis = { nervous: 0, homeostasis: 0, genetics: 0 };
  const counts = { nervous: 0, homeostasis: 0, genetics: 0 };

  state.userAnswers.forEach((ans, idx) => {
    const q = state.questions[idx];
    counts[q.category]++;
    if (ans.isCorrect) {
      analysis[q.category]++;
    }
  });

  // Calculate percentages
  Object.keys(analysis).forEach(key => {
    analysis[key] = counts[key] > 0 ? Math.round((analysis[key] / counts[key]) * 100) : 100;
  });

  return analysis;
}

function getAdvice(grade) {
  switch (grade) {
    case 1: return "수능 및 내신 최상위권 성적입니다. 개념 숙지가 완벽하며, 고난도 추론형 문항(유전/근수축)도 안정적으로 풀이할 수 있는 상태입니다. 실수를 줄이는 실전 훈련만 꾸준히 하세요.";
    case 2: return "아주 우수한 성적입니다. 항상성과 신경계 개념은 탄탄하나, 고난도 유전 연관 가계도 분석이나 근수축 세부 계산 등 1~2개 킬러 문항에서 아쉬운 오답이 보입니다. 변별력 문제 위주로 극복하세요.";
    case 3: return "기본기는 완성되어 있으나, 응용 개념 적용 시 흔들림이 보입니다. 틀린 문제 해설지를 보고 어느 조건 해석을 놓쳤는지 꼼꼼히 확인하세요. 30일 챌린지를 완독하면 반드시 등급 상승이 가능합니다.";
    case 4:
    case 5: return "개념서 정독이 다시 한 번 필요한 단계입니다. 흥분 전도 경로 그리기와 호르몬 음성 피드백 경로 등 구조적인 흐름을 손으로 그리며 공부하는 것을 추천합니다. 핵심 빈출 유형을 먼저 정복하세요.";
    default: return "생명과학 교과의 기본 용어와 개념 정립이 우선입니다. 30일 챌린지 1일차부터 시작하여 요점 정리를 읽고, 제공되는 일차별 3문항의 미니 테스트를 차근차근 해결하여 실력을 쌓아 나가세요.";
  }
}

function updateGlobalStats() {
  const currentScore = calculateScore();
  const currentGrade = calculateGrade(currentScore);
  
  state.stats.totalQuizzes++;
  
  // Calculate running average
  state.stats.averageScore = Math.round(
    ((state.stats.averageScore * (state.stats.totalQuizzes - 1)) + currentScore) / state.stats.totalQuizzes
  );

  // Update highscore
  if (currentScore > state.stats.highScore) {
    state.stats.highScore = currentScore;
  }
  
  // Update best grade (lower is better, 1 is best)
  if (currentGrade < state.stats.bestGrade) {
    state.stats.bestGrade = currentGrade;
  }

  saveData();
}


/* ==========================================
   30-DAY CHALLENGE SYSTEM (30일 챌린지)
   ========================================== */

function renderChallengeView() {
  const container = document.getElementById('challenge-view');
  
  if (state.activeChallengeDay === null) {
    // Render Challenge Calendar Dashboard
    const totalCompleted = Object.keys(state.completedDays).length;
    const progressPercent = Math.round((totalCompleted / 30) * 100);

    container.innerHTML = `
      <div class="challenge-container">
        <div class="dashboard-header">
          <h1 class="welcome-title">30일 완성 생명과학 챌린지</h1>
          <p class="welcome-desc">내신 및 수능 출제 기준 핵심 요점을 매일 공부하고 짧은 퀴즈로 완성도를 확인해 보세요.</p>
        </div>

        <div class="glass-card" style="margin-bottom: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-weight: 700;">전체 챌린지 달성도</span>
            <span class="numbers" style="color: var(--neon-cyan); font-weight: 800;">${totalCompleted} / 30일 완료 (${progressPercent}%)</span>
          </div>
          <div class="progress-track" style="margin-bottom: 0;">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
          </div>
        </div>

        <div class="challenge-grid">
          ${Array.from({ length: 30 }, (_, i) => {
            const dayNum = i + 1;
            const completed = state.completedDays[dayNum] !== undefined;
            const isActive = dayNum === totalCompleted + 1 || (dayNum === 30 && totalCompleted === 30);
            
            let cardClass = 'day-card';
            let icon = 'lock';
            if (completed) {
              cardClass += ' completed';
              icon = 'check-circle2';
            } else if (isActive) {
              cardClass += ' active';
              icon = 'play-circle';
            }
            
            return `
              <div class="${cardClass}" data-day="${dayNum}">
                <div class="day-number">${dayNum}</div>
                <div class="day-status-icon">
                  <i data-lucide="${icon}"></i>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        
        <div style="display: flex; justify-content: flex-end; margin-top: 2rem;">
          <button id="reset-challenge-btn" class="btn btn-secondary btn-sm" style="color: var(--neon-red); border-color: rgba(244, 63, 94, 0.2)">
            챌린지 기록 초기화
          </button>
        </div>
      </div>
    `;

    // Add click listeners to days
    container.querySelectorAll('.day-card').forEach(card => {
      card.addEventListener('click', () => {
        const dayNum = parseInt(card.getAttribute('data-day'));
        
        // Find challenge day data
        const dayData = challengeData.find(d => d.day === dayNum);
        if (dayData) {
          state.activeChallengeDay = dayData;
          state.challengeQuizStatus = 'study';
          renderChallengeView();
        }
      });
    });

    document.getElementById('reset-challenge-btn').addEventListener('click', () => {
      if (confirm("정말로 모든 챌린지 기록을 초기화하시겠습니까? (이 작업은 되돌릴 수 없습니다)")) {
        state.completedDays = {};
        saveData();
        renderChallengeView();
      }
    });

  } else {
    // Render Day details (Study summary or daily quiz)
    const day = state.activeChallengeDay;

    if (state.challengeQuizStatus === 'study') {
      container.innerHTML = `
        <div class="challenge-detail-container">
          <div class="challenge-detail-header">
            <div>
              <div class="challenge-day-label">Day ${day.day} 학습</div>
              <h2 class="challenge-day-title">${day.title}</h2>
            </div>
            <button id="back-to-calendar-btn" class="btn btn-secondary btn-sm"><i data-lucide="calendar"></i> 목록으로</button>
          </div>

          <div class="glass-card">
            <h3 class="section-title"><i data-lucide="book-open" style="color: var(--neon-cyan);"></i> 핵심 학습 포인트</h3>
            <ul class="summary-list">
              ${day.summary.map(s => `<li>${s}</li>`).join('')}
            </ul>

            <div style="display: flex; gap: 15px;">
              <button id="start-day-quiz-btn" class="btn btn-primary btn-block">학습 완료 & 일일 테스트 풀기</button>
            </div>
          </div>
        </div>
      `;

      document.getElementById('back-to-calendar-btn').addEventListener('click', () => {
        state.activeChallengeDay = null;
        renderChallengeView();
      });

      document.getElementById('start-day-quiz-btn').addEventListener('click', () => {
        state.challengeQuizStatus = 'quiz';
        state.challengeQuizIndex = 0;
        state.challengeAnswers = [];
        renderChallengeView();
      });

    } else if (state.challengeQuizStatus === 'quiz') {
      const q = day.quiz[state.challengeQuizIndex];
      const progressPercent = Math.round((state.challengeQuizIndex / day.quiz.length) * 100);

      container.innerHTML = `
        <div class="challenge-detail-container">
          <div class="quiz-header">
            <div class="quiz-progress-info">
              <span style="font-weight: 700; color: var(--neon-cyan);" class="numbers">Day ${day.day} 미니 퀴즈</span> 
              <span class="numbers">Q ${state.challengeQuizIndex + 1} / ${day.quiz.length}</span>
            </div>
          </div>

          <div class="progress-track">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
          </div>

          <div class="glass-card">
            <div class="question-text">${q.question}</div>
            
            <ul class="options-list">
              ${q.options.map((opt, idx) => `
                <li class="option-item">
                  <button class="option-button" data-idx="${idx}">
                    <span class="option-index">${idx + 1}</span>
                    <span class="option-content">${opt}</span>
                  </button>
                </li>
              `).join('')}
            </ul>

            <div id="challenge-feedback" class="feedback-panel" style="display: none;">
              <div class="explanation-card">
                <div class="explanation-title">
                  <i data-lucide="info"></i> 정답 해설
                </div>
                <div class="explanation-text">${q.explanation}</div>
              </div>
              <button id="challenge-next-btn" class="btn btn-primary" style="float: right;">
                ${state.challengeQuizIndex === day.quiz.length - 1 ? '제출 완료' : '다음 문제'} <i data-lucide="arrow-right"></i>
              </button>
              <div style="clear: both;"></div>
            </div>
          </div>
        </div>
      `;

      // Set listener
      container.querySelectorAll('.option-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          // Disable others
          const buttons = container.querySelectorAll('.option-button');
          buttons.forEach(b => b.disabled = true);
          
          const chosenIndex = parseInt(btn.getAttribute('data-idx'));
          const isCorrect = chosenIndex === q.answer;

          if (isCorrect) {
            btn.classList.add('correct');
          } else {
            btn.classList.add('incorrect');
            buttons[q.answer].classList.add('correct');
          }

          state.challengeAnswers.push({ chosenIndex, isCorrect });

          // Show explanation
          document.getElementById('challenge-feedback').style.display = 'block';

          document.getElementById('challenge-next-btn').onclick = () => {
            if (state.challengeQuizIndex === day.quiz.length - 1) {
              // Quiz complete
              state.challengeQuizStatus = 'result';
              
              // Mark day as completed
              const score = state.challengeAnswers.filter(a => a.isCorrect).length;
              state.completedDays[day.day] = score;
              saveData();

              renderChallengeView();
            } else {
              state.challengeQuizIndex++;
              renderChallengeView();
            }
          };
        });
      });

    } else if (state.challengeQuizStatus === 'result') {
      const correctCount = state.challengeAnswers.filter(a => a.isCorrect).length;
      const totalCount = day.quiz.length;

      container.innerHTML = `
        <div class="challenge-detail-container">
          <div class="challenge-detail-header">
            <div>
              <div class="challenge-day-label">Day ${day.day} 결과</div>
              <h2 class="challenge-day-title">${day.title} 완료!</h2>
            </div>
          </div>

          <div class="glass-card result-main">
            <div class="result-badge" style="background: linear-gradient(135deg, var(--neon-emerald), #34d399); box-shadow: 0 0 30px var(--neon-emerald-glow)">완료</div>
            <div class="result-score-text">미니 퀴즈 결과</div>
            <div>
              <span class="result-score-val">${correctCount}</span>
              <span class="result-score-total"> / ${totalCount}개 정답</span>
            </div>
            
            <div style="display: flex; gap: 15px; margin-top: 2.5rem; width: 100%; max-width: 400px;">
              <button id="finish-day-btn" class="btn btn-primary btn-block">챌린지 현황판으로 가기</button>
            </div>
          </div>
        </div>
      `;

      document.getElementById('finish-day-btn').addEventListener('click', () => {
        state.activeChallengeDay = null;
        renderChallengeView();
      });
    }
  }

  // Generate Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
