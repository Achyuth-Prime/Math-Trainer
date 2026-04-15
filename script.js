const LEVELS = {
    0: { count: 4, max_val: 20, start_points: 2 },
    1: { count: 10, max_val: 20, start_points: 2 },
    2: { count: 4, max_val: 50, start_points: 2 },
    3: { count: 10, max_val: 50, start_points: 2 },
    4: { count: 4, max_val: 100, start_points: 2 },
    5: { count: 10, max_val: 100, start_points: 2 }
};

let currentLevel = null;
let numbers = [];
let correctSum = 0;
let startPoints = [];
let currentStartPointIndex = 0;
let results = [];
let startTime = 0;

const appDiv = document.getElementById('app');

function getStats() {
    const defaultStats = {};
    Object.keys(LEVELS).forEach(lvl => {
        defaultStats[lvl] = { plays: 0, avgTime: null };
    });
    try {
        const stored = localStorage.getItem('additionTrainerStats');
        if (stored) {
            return { ...defaultStats, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error("Could not read stats", e);
    }
    return defaultStats;
}

function updateStats(level, newTime, wrongCount = null) {
    const stats = getStats();
    const lvlStats = stats[level] || { plays: 0, avgTime: null, lastWrong: 0 };
    const totalPlays = lvlStats.plays;
    const oldAvg = lvlStats.avgTime || 0;
    const newPlays = totalPlays + 1;
    const newAvg = totalPlays === 0 ? newTime : ((oldAvg * totalPlays) + newTime) / newPlays;
    
    stats[level] = { plays: newPlays, avgTime: newAvg };
    if (wrongCount !== null) {
        stats[level].lastWrong = wrongCount;
    }
    
    localStorage.setItem('additionTrainerStats', JSON.stringify(stats));
    return { oldAvg: lvlStats.avgTime, newAvg: newAvg, plays: newPlays };
}

let appMode = 'main';

function init() {
    renderMainMenu();
}

function renderMainMenu() {
    appMode = 'main';
    appDiv.innerHTML = `
        <div class="glass-panel">
            <h1> Mental Math Trainer </h1>
            <div class="level-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
                <div class="level-card" onclick="renderAdditionHome()">
                    <h2>➕ Addition Trainer</h2>
                </div>
                <div class="level-card" onclick="renderSquaresHome()">
                    <h2>⏹️ Squares & Cubes Trainer</h2>
                </div>
                <div class="level-card" onclick="renderFactorialsHome()">
                    <h2>❗ Factorials Trainer</h2>
                </div>
                <div class="level-card" onclick="renderTablesHome()">
                    <h2>✖️ Tables Trainer</h2>
                </div>
                <div class="level-card" onclick="renderSquareRootsHome()">
                    <h2>🧮 Square Roots Trainer</h2>
                </div>
                <div class="level-card" onclick="renderPowersHome()">
                    <h2>🔼 Powers Trainer</h2>
                </div>
            </div>
        </div>
    `;
}

function renderAdditionHome() {
    const stats = getStats();
    appDiv.innerHTML = `
        <div class="glass-panel">
            <h1> Mental Addition Trainer </h1>
            <div class="level-grid">
                ${Object.keys(LEVELS).map(level => {
                    const lStats = stats[level];
                    const statText = lStats && lStats.plays > 0 
                        ? `<p style="color: var(--primary); font-weight: bold; margin-top: 0.5rem; font-size: 1rem;">Played: ${lStats.plays} | Avg: ${lStats.avgTime.toFixed(2)}s</p>`
                        : `<p style="color: grey; font-size: 1rem; margin-top: 0.5rem;">Not played yet</p>`;
                    return `
                    <div class="level-card" onclick="startLevel(${level})">
                        <h2>Level ${level}</h2>
                        <p>${LEVELS[level].count} numbers under ${LEVELS[level].max_val}</p>
                        ${statText}
                    </div>
                `}).join('')}
            </div>
            <div class="actions-row" style="margin-top: 3rem;">
                <button class="action-btn secondary" onclick="renderMainMenu()">Main Menu</button>
            </div>
        </div>
    `;
}

function generateNumbers(level) {
    const cfg = LEVELS[level];
    const nums = [];
    const minVal = level >= 4 ? 10 : 1;
    for (let i = 0; i < cfg.count; i++) {
        nums.push(Math.floor(Math.random() * (cfg.max_val - minVal + 1)) + minVal);
    }
    return nums;
}

function shuffle(array) {
    const arr = [...array];
    let currentIndex = arr.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
    }
    return arr;
}

function startLevel(level) {
    currentLevel = level;
    numbers = generateNumbers(level);
    correctSum = numbers.reduce((a, b) => a + b, 0);
    
    // Pick unique start points
    const uniqueNums = [...new Set(numbers)];
    let availableStarts = uniqueNums;
    if(availableStarts.length < LEVELS[level].start_points) {
        availableStarts = [...numbers];
    }
    
    startPoints = shuffle(availableStarts).slice(0, LEVELS[level].start_points);
    currentStartPointIndex = 0;
    results = [];
    
    renderGame();
}

function renderGame() {
    if (currentStartPointIndex >= startPoints.length) {
        renderSummary();
        return;
    }

    const currentStartPoint = startPoints[currentStartPointIndex];
    let gameUI = document.getElementById('add-game-ui');
    
    if (!gameUI) {
        appDiv.innerHTML = `
            <div id="add-game-ui" class="glass-panel game-container" style="animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
                <h2 id="add-header">Level ${currentLevel} - Round ${currentStartPointIndex + 1} / ${startPoints.length}</h2>
                <div class="circle-container" id="circle-container"></div>
                <div class="input-section">
                    <p>Begin adding from: <span id="add-start-point" class="start-point-highlight">${currentStartPoint}</span></p>
                    <form id="answer-form">
                        <input type="number" id="sum-input" class="sum-input" autocomplete="off" autofocus required placeholder="Total sum?">
                        <br>
                        <button type="submit" class="submit-btn" id="submit-btn">Submit Answer</button>
                    </form>
                </div>
            </div>
        `;
        
        const form = document.getElementById('answer-form');
        const input = document.getElementById('sum-input');
        
        setTimeout(() => {
            input.focus();
            startTime = performance.now();
        }, 100);

        form.onsubmit = (e) => {
            e.preventDefault();
            const endTime = performance.now();
            const answer = parseInt(input.value);
            
            results.push({
                startPoint: startPoints[currentStartPointIndex],
                userAnswer: answer,
                correct: answer === correctSum,
                time: ((endTime - startTime) / 1000).toFixed(2)
            });
            
            currentStartPointIndex++;
            input.value = ''; // clear input, keep focus
            startTime = performance.now(); // reset timer
            renderGame();
        };
    } else {
        document.getElementById('add-header').innerText = `Level ${currentLevel} - Round ${currentStartPointIndex + 1} / ${startPoints.length}`;
        document.getElementById('add-start-point').innerText = currentStartPoint;
    }

    document.getElementById('circle-container').innerHTML = '';
    renderCircle(numbers, currentStartPoint);
}

function renderCircle(nums, currentStartPoint) {
    const container = document.getElementById('circle-container');
    const n = nums.length;
    // Radius in percentage to scale automatically with container size
    const radiusPercent = 40.625; 
    
    let highlighted = false;
    
    nums.forEach((num, index) => {
        const angle = (index / n) * 2 * Math.PI - Math.PI / 2; // Start from top
        
        // Calculate x and y in percentages
        const xPercent = 50 + radiusPercent * Math.cos(angle); 
        const yPercent = 50 + radiusPercent * Math.sin(angle);
        
        const orb = document.createElement('div');
        orb.className = 'number-orb';
        orb.style.left = `${xPercent}%`;
        orb.style.top = `${yPercent}%`;
        orb.innerText = num;
        
        if (num === currentStartPoint && !highlighted) {
            orb.classList.add('highlighted');
            highlighted = true;
        }
        
        container.appendChild(orb);
    });
}

function renderSummary() {
    const totalTime = results.reduce((acc, r) => acc + parseFloat(r.time), 0);
    const avgTimePerProblem = totalTime / results.length;
    const { oldAvg, newAvg } = updateStats(currentLevel, avgTimePerProblem);

    let html = `
        <div class="glass-panel">
            <h1>Level ${currentLevel} Summary</h1>
            
            <div class="summary-details">
                <div class="detail-item" style="flex: 2;">
                    <div class="detail-label">Full Sequence</div>
                    <div class="detail-value" style="font-size: 2rem;">${numbers.join(' + ')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Correct Sum</div>
                    <div class="detail-value text-success">${correctSum}</div>
                </div>
            </div>

            <div class="summary-details" style="margin-top: -1.5rem;">
                <div class="detail-item">
                    <div class="detail-label">Old Avg</div>
                    <div class="detail-value" style="color: var(--text-muted); font-size: 1.8rem;">${oldAvg ? oldAvg.toFixed(2) + 's' : '---'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">This Avg</div>
                    <div class="detail-value" style="font-size: 1.8rem;">${avgTimePerProblem.toFixed(2)}s</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">New Avg</div>
                    <div class="detail-value" style="color: var(--primary); font-size: 1.8rem;">${newAvg.toFixed(2)}s</div>
                </div>
            </div>
            
            <table class="summary-table">
                <thead>
                    <tr>
                        <th>Start Point</th>
                        <th>Your Answer</th>
                        <th>Time (s)</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    results.forEach(r => {
        const valueClass = r.correct ? 'text-success' : 'text-error';
        const icon = r.correct ? '✅' : '❌';
        html += `
                    <tr>
                        <td style="font-weight: 600;">${r.startPoint}</td>
                        <td class="${valueClass}">${r.userAnswer}</td>
                        <td>${r.time}</td>
                        <td class="result-icon">${icon}</td>
                    </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
            
            <div class="actions-row">
                <button class="action-btn" onclick="startLevel(currentLevel)">Retry Level ${currentLevel}</button>
                <button class="action-btn secondary" onclick="renderAdditionHome()">Addition Menu</button>
            </div>
        </div>
    `;
    
    appDiv.innerHTML = html;
}

// ==========================================
// SQUARES & CUBES TRAINER
// ==========================================
let sqMode = null;
let sqQuestions = [];
let sqResults = [];
let sqWrongCount = 0;
let sqCurrentQ = null;
let sqQuestionStartTime = 0;

function getSquaresData() {
    const questions = [];
    for(let i=1; i<=40; i++) questions.push({ q: `${i}²`, a: i*i });
    return questions;
}

function getCubesData() {
    const questions = [];
    for(let i=1; i<=30; i++) questions.push({ q: `${i}³`, a: i*i*i });
    return questions;
}

function renderSquaresHome() {
    appMode = 'squares';
    const stats = getStats();
    
    function createStatCard(modeId, title, desc) {
        const s = stats[`sq_${modeId}`] || { plays: 0, avgTime: null, lastWrong: 0 };
        const text = s.plays > 0 
            ? `<p style="color: var(--primary); font-weight: bold; margin-top: 0.5rem; font-size: 1rem;">Played: ${s.plays} | Avg: ${s.avgTime.toFixed(2)}s <br> PIA: ${s.lastWrong || 0}</p>`
            : `<p style="color: grey; font-size: 1rem; margin-top: 0.5rem;">Not played yet</p>`;
        return `
            <div class="level-card" onclick="startSquaresLevel('${modeId}')">
                <h2>${title}</h2>
                <p>${desc}</p>
                ${text}
            </div>
        `;
    }

    appDiv.innerHTML = `
        <div class="glass-panel">
            <h1> Squares & Cubes </h1>
            <div class="level-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
                ${createStatCard('rapid', 'Rapid (10 Qs)', 'Random Sample')}
                ${createStatCard('absolute', 'Absolute (70 Qs)', 'All Squares & Cubes')}
                ${createStatCard('sq_ord', 'Squares Ordered', 'Squares 1-40 (In Order)')}
                ${createStatCard('sq_rand', 'Squares Random', 'Squares 1-40 (Shuffled)')}
                ${createStatCard('cb_ord', 'Cubes Ordered', 'Cubes 1-30 (In Order)')}
                ${createStatCard('cb_rand', 'Cubes Random', 'Cubes 1-30 (Shuffled)')}
            </div>
            <div class="actions-row" style="margin-top: 3rem;">
                <button class="action-btn secondary" onclick="renderMainMenu()">Main Menu</button>
            </div>
        </div>
    `;
}

function startSquaresLevel(mode) {
    sqMode = mode;
    sqWrongCount = 0;
    sqResults = [];

    const squares = getSquaresData();
    const cubes = getCubesData();
    
    if (mode === 'rapid') {
        let pool = squares.concat(cubes);
        sqQuestions = shuffle(pool).slice(0, 10);
    } else if (mode === 'absolute') {
        let pool = squares.concat(cubes);
        sqQuestions = shuffle(pool);
    } else if (mode === 'sq_rand') {
        sqQuestions = shuffle([...squares]);
    } else if (mode === 'sq_ord') {
        sqQuestions = [...squares];
    } else if (mode === 'cb_rand') {
        sqQuestions = shuffle([...cubes]);
    } else if (mode === 'cb_ord') {
        sqQuestions = [...cubes];
    }
    
    renderSquaresGame();
}

let sqIsReviewing = false;

function renderSquaresGame() {
    if (sqQuestions.length === 0) {
        renderSquaresSummary();
        return;
    }
    
    if (!sqIsReviewing) {
        sqCurrentQ = sqQuestions.shift();
    }
    
    const modeNames = {
        'rapid': 'Rapid', 'absolute': 'Absolute', 'sq_rand': 'Squares Random',
        'sq_ord': 'Squares Ordered', 'cb_rand': 'Cubes Random', 'cb_ord': 'Cubes Ordered'
    };
    const modeTitle = modeNames[sqMode] || 'Trainer';

    let gameUI = document.getElementById('sq-game-ui');

    if (!gameUI) {
        appDiv.innerHTML = `
            <div id="sq-game-ui" class="glass-panel game-container" style="animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
                <h2 id="sq-header">${modeTitle} Mode - ${sqQuestions.length + 1} remaining</h2>
                
                <div id="sq-question" style="font-size: 6rem; font-weight: bold; margin: 3rem 0; color: var(--text-main); text-shadow: 0 0 20px var(--primary-glow);">${sqCurrentQ.q} = ?</div>
                
                <div class="input-section">
                    <p id="sq-feedback-text" style="font-size: 1.5rem; color: var(--text-muted); margin-bottom: 2rem; display: none;">Memorize it. We'll ask you this again later.</p>
                    <form id="sq-answer-form">
                        <input type="number" id="sq-input" class="sum-input" autocomplete="off" autofocus required placeholder="Answer">
                        <br>
                        <button type="submit" class="submit-btn" id="sq-submit-btn">Submit Answer</button>
                    </form>
                </div>
            </div>
        `;
        
        const form = document.getElementById('sq-answer-form');
        const input = document.getElementById('sq-input');
        
        setTimeout(() => {
            input.focus();
            sqQuestionStartTime = performance.now();
        }, 100);

        form.onsubmit = (e) => {
            e.preventDefault();
            const inputEl = document.getElementById('sq-input');
            const qEl = document.getElementById('sq-question');
            const btnEl = document.getElementById('sq-submit-btn');
            const fbEl = document.getElementById('sq-feedback-text');
            const containerEl = document.getElementById('sq-game-ui');
            
            if (sqIsReviewing) {
                sqIsReviewing = false;
                inputEl.value = '';
                btnEl.innerText = 'Submit Answer';
                fbEl.style.display = 'none';
                
                containerEl.style.borderColor = '';
                containerEl.style.boxShadow = '';
                qEl.style.color = '';
                qEl.style.textShadow = '';
                
                sqQuestionStartTime = performance.now();
                renderSquaresGame(); 
                return;
            }

            const endTime = performance.now();
            const t = ((endTime - sqQuestionStartTime) / 1000);
            const answer = parseInt(inputEl.value);
            
            if (answer === sqCurrentQ.a) {
                sqResults.push(t);
                inputEl.value = '';
                sqQuestionStartTime = performance.now();
                renderSquaresGame(); 
            } else {
                sqWrongCount++;
                sqQuestions.push(sqCurrentQ); // Re-queue at the end
                
                sqIsReviewing = true;
                containerEl.style.borderColor = 'var(--error)';
                containerEl.style.boxShadow = '0 0 30px rgba(255,0,0,0.3)';
                
                qEl.innerHTML = `${sqCurrentQ.q} = <span style="color: var(--success); text-shadow: 0 0 20px var(--success);">${sqCurrentQ.a}</span>`;
                
                fbEl.style.display = 'block';
                inputEl.value = ''; 
                btnEl.innerText = 'Got it! (Press Enter)';
            }
        };
    } else {
        if (!sqIsReviewing) {
            document.getElementById('sq-header').innerText = `${modeTitle} Mode - ${sqQuestions.length + 1} remaining`;
            document.getElementById('sq-question').innerText = `${sqCurrentQ.q} = ?`;
        }
    }
}

function renderSquaresSummary() {
    const totalTime = sqResults.reduce((a, b) => a + b, 0);
    // sqResults only records successful answers, so length equals number of questions solved correctly
    const avgTimePerProblem = totalTime / sqResults.length;
    const statKey = `sq_${sqMode}`;
    const { oldAvg, newAvg } = updateStats(statKey, avgTimePerProblem, sqWrongCount);

    const modeNames = {
        'rapid': 'Rapid', 'absolute': 'Absolute', 'sq_rand': 'Squares Random',
        'sq_ord': 'Squares Ordered', 'cb_rand': 'Cubes Random', 'cb_ord': 'Cubes Ordered'
    };
    const modeTitle = modeNames[sqMode] || 'Trainer';

    appDiv.innerHTML = `
        <div class="glass-panel">
            <h1>${modeTitle} Summary</h1>
            
            <div class="summary-details">
                <div class="detail-item">
                    <div class="detail-label">Questions Solved</div>
                    <div class="detail-value text-success">${sqResults.length}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Mistakes Made</div>
                    <div class="detail-value text-error">${sqWrongCount}</div>
                </div>
            </div>
            
            <div class="summary-details" style="margin-top: -1.5rem;">
                <div class="detail-item">
                    <div class="detail-label">Old Avg</div>
                    <div class="detail-value" style="color: var(--text-muted); font-size: 1.8rem;">${oldAvg ? oldAvg.toFixed(2) + 's' : '---'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">This Avg</div>
                    <div class="detail-value" style="font-size: 1.8rem;">${avgTimePerProblem.toFixed(2)}s</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">New Avg</div>
                    <div class="detail-value" style="color: var(--primary); font-size: 1.8rem;">${newAvg.toFixed(2)}s</div>
                </div>
            </div>
            
            <div class="actions-row">
                <button class="action-btn" onclick="startSquaresLevel('${sqMode}')">Retry</button>
                <button class="action-btn secondary" onclick="renderSquaresHome()">Squares Menu</button>
            </div>
        </div>
    `;
}

// Start app
init();

// ==========================================
// FACTORIALS TRAINER
// ==========================================
let fcMode = null;
let fcQuestions = [];
let fcResults = [];
let fcWrongCount = 0;
let fcCurrentQ = null;
let fcQuestionStartTime = 0;
let fcIsReviewing = false;

function getFactorialsData() {
    const questions = [];
    let fact = 1;
    questions.push({ q: '0!', a: 1 });
    for (let i = 1; i <= 10; i++) {
        fact *= i;
        questions.push({ q: `${i}!`, a: fact });
    }
    return questions;
}

function renderFactorialsHome() {
    appMode = 'factorials';
    const stats = getStats();
    
    function createStatCard(modeId, title, desc) {
        const s = stats[`fc_${modeId}`] || { plays: 0, avgTime: null, lastWrong: 0 };
        const text = s.plays > 0 
            ? `<p style="color: var(--primary); font-weight: bold; margin-top: 0.5rem; font-size: 1rem;">Played: ${s.plays} | Avg: ${s.avgTime.toFixed(2)}s <br> PIA: ${s.lastWrong || 0}</p>`
            : `<p style="color: grey; font-size: 1rem; margin-top: 0.5rem;">Not played yet</p>`;
        return `
            <div class="level-card" onclick="startFactorialsLevel('${modeId}')">
                <h2>${title}</h2>
                <p>${desc}</p>
                ${text}
            </div>
        `;
    }

    appDiv.innerHTML = `
        <div class="glass-panel">
            <h1> Factorials </h1>
            <div class="level-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
                ${createStatCard('rand', 'Random (11 Qs)', 'Factorials 0-10 (Shuffled)')}
            </div>
            <div class="actions-row" style="margin-top: 3rem;">
                <button class="action-btn secondary" onclick="renderMainMenu()">Main Menu</button>
            </div>
        </div>
    `;
}

function startFactorialsLevel(mode) {
    fcMode = mode;
    fcWrongCount = 0;
    fcResults = [];

    const factorials = getFactorialsData();
    if (mode === 'rand') {
        fcQuestions = shuffle([...factorials]);
    }
    
    renderFactorialsGame();
}

function renderFactorialsGame() {
    if (fcQuestions.length === 0) {
        renderFactorialsSummary();
        return;
    }
    
    if (!fcIsReviewing) {
        fcCurrentQ = fcQuestions.shift();
    }
    
    const modeTitle = 'Factorials Random';

    let gameUI = document.getElementById('fc-game-ui');

    if (!gameUI) {
        appDiv.innerHTML = `
            <div id="fc-game-ui" class="glass-panel game-container" style="animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
                <h2 id="fc-header">${modeTitle} Mode - ${fcQuestions.length + 1} remaining</h2>
                
                <div id="fc-question" style="font-size: 6rem; font-weight: bold; margin: 3rem 0; color: var(--text-main); text-shadow: 0 0 20px var(--primary-glow);">${fcCurrentQ.q} = ?</div>
                
                <div class="input-section">
                    <p id="fc-feedback-text" style="font-size: 1.5rem; color: var(--text-muted); margin-bottom: 2rem; display: none;">Memorize it. We'll ask you this again later.</p>
                    <form id="fc-answer-form">
                        <input type="number" id="fc-input" class="sum-input" autocomplete="off" autofocus required placeholder="Answer">
                        <br>
                        <button type="submit" class="submit-btn" id="fc-submit-btn">Submit Answer</button>
                    </form>
                </div>
            </div>
        `;
        
        const form = document.getElementById('fc-answer-form');
        const input = document.getElementById('fc-input');
        
        setTimeout(() => {
            input.focus();
            fcQuestionStartTime = performance.now();
        }, 100);

        form.onsubmit = (e) => {
            e.preventDefault();
            const inputEl = document.getElementById('fc-input');
            const qEl = document.getElementById('fc-question');
            const btnEl = document.getElementById('fc-submit-btn');
            const fbEl = document.getElementById('fc-feedback-text');
            const containerEl = document.getElementById('fc-game-ui');
            
            if (fcIsReviewing) {
                fcIsReviewing = false;
                inputEl.value = '';
                btnEl.innerText = 'Submit Answer';
                fbEl.style.display = 'none';
                
                containerEl.style.borderColor = '';
                containerEl.style.boxShadow = '';
                qEl.style.color = '';
                qEl.style.textShadow = '';
                
                fcQuestionStartTime = performance.now();
                renderFactorialsGame(); 
                return;
            }

            const endTime = performance.now();
            const t = ((endTime - fcQuestionStartTime) / 1000);
            const answer = parseInt(inputEl.value);
            
            if (answer === fcCurrentQ.a) {
                fcResults.push(t);
                inputEl.value = '';
                fcQuestionStartTime = performance.now();
                renderFactorialsGame(); 
            } else {
                fcWrongCount++;
                fcQuestions.push(fcCurrentQ); // Re-queue at the end
                
                fcIsReviewing = true;
                containerEl.style.borderColor = 'var(--error)';
                containerEl.style.boxShadow = '0 0 30px rgba(255,0,0,0.3)';
                
                qEl.innerHTML = `${fcCurrentQ.q} = <span style="color: var(--success); text-shadow: 0 0 20px var(--success);">${fcCurrentQ.a}</span>`;
                
                fbEl.style.display = 'block';
                inputEl.value = ''; 
                btnEl.innerText = 'Got it! (Press Enter)';
            }
        };
    } else {
        if (!fcIsReviewing) {
            document.getElementById('fc-header').innerText = `${modeTitle} Mode - ${fcQuestions.length + 1} remaining`;
            document.getElementById('fc-question').innerText = `${fcCurrentQ.q} = ?`;
        }
    }
}

function renderFactorialsSummary() {
    const totalTime = fcResults.reduce((a, b) => a + b, 0);
    const statKey = `fc_${fcMode}`;
    const { oldAvg, newAvg } = updateStats(statKey, totalTime, fcWrongCount);

    const modeTitle = 'Factorials Random';

    appDiv.innerHTML = `
        <div class="glass-panel">
            <h1>${modeTitle} Summary</h1>
            
            <div class="summary-details">
                <div class="detail-item">
                    <div class="detail-label">Questions Solved</div>
                    <div class="detail-value text-success">${fcResults.length}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Mistakes Made</div>
                    <div class="detail-value text-error">${fcWrongCount}</div>
                </div>
            </div>
            
            <div class="summary-details" style="margin-top: -1.5rem;">
                <div class="detail-item">
                    <div class="detail-label">Old Avg</div>
                    <div class="detail-value" style="color: var(--text-muted); font-size: 1.8rem;">${oldAvg ? oldAvg.toFixed(2) + 's' : '---'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">This Round</div>
                    <div class="detail-value" style="font-size: 1.8rem;">${totalTime.toFixed(2)}s</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">New Avg</div>
                    <div class="detail-value" style="color: var(--primary); font-size: 1.8rem;">${newAvg.toFixed(2)}s</div>
                </div>
            </div>
            
            <div class="actions-row">
                <button class="action-btn" onclick="startFactorialsLevel('${fcMode}')">Retry</button>
                <button class="action-btn secondary" onclick="renderFactorialsHome()">Factorials Menu</button>
            </div>
        </div>
    `;
}

// ==========================================
// TABLES TRAINER
// ==========================================
let tbMode = null;
let tbQuestions = [];
let tbResults = [];
let tbWrongCount = 0;
let tbCurrentQ = null;
let tbQuestionStartTime = 0;
let tbIsReviewing = false;

function getTablesData(num) {
    const questions = [];
    for (let i = 2; i <= 9; i++) {
        questions.push({ q: `${num} × ${i}`, a: num * i });
    }
    return questions;
}

function getRandomTablesData() {
    const questions = [];
    for (let i = 12; i <= 19; i++) {
        for (let j = 2; j <= 9; j++) {
            questions.push({ q: `${i} × ${j}`, a: i * j });
        }
    }
    return questions;
}

function renderTablesHome() {
    appMode = 'tables';
    const stats = getStats();
    
    function createStatCard(modeId, title, desc, colSpan = false) {
        const s = stats[`tb_${modeId}`] || { plays: 0, avgTime: null, lastWrong: 0 };
        const text = s.plays > 0 
            ? `<p style="color: var(--primary); font-weight: bold; margin-top: 0.5rem; font-size: 1rem;">Played: ${s.plays} | Avg: ${s.avgTime.toFixed(2)}s <br> PIA: ${s.lastWrong || 0}</p>`
            : `<p style="color: grey; font-size: 1rem; margin-top: 0.5rem;">Not played yet</p>`;
        const extraStyle = colSpan ? 'grid-column: 1 / -1;' : '';
        return `
            <div class="level-card" style="${extraStyle}" onclick="startTablesLevel('${modeId}')">
                <h2>${title}</h2>
                ${text}
            </div>
        `;
    }

    let tablesCards = '';
    for (let i = 12; i <= 19; i++) {
        tablesCards += createStatCard(`${i}_ord`, `${i} - Ordered`, `Table of ${i} in order`);
        tablesCards += createStatCard(`${i}_rand`, `${i} - Random`, `Table of ${i} shuffled`);
    }

    appDiv.innerHTML = `
        <div class="glass-panel">
            <h1> Tables Trainer </h1>
            <div class="level-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
                ${createStatCard('rand_10', 'Random 10', '')}
                ${createStatCard('rand_20', 'Random 20', '')}
                ${tablesCards}
            </div>
            <div class="actions-row" style="margin-top: 3rem;">
                <button class="action-btn secondary" onclick="renderMainMenu()">Main Menu</button>
            </div>
        </div>
    `;
}

function startTablesLevel(mode) {
    tbMode = mode;
    tbWrongCount = 0;
    tbResults = [];
    tbIsReviewing = false;

    if (mode === 'rand_10') {
        tbQuestions = shuffle(getRandomTablesData()).slice(0, 10);
    } else if (mode === 'rand_20') {
        tbQuestions = shuffle(getRandomTablesData()).slice(0, 20);
    } else {
        // format is 11_ord or 11_rand
        const parts = mode.split('_');
        const num = parseInt(parts[0]);
        const style = parts[1];
        const data = getTablesData(num);
        if (style === 'rand') {
            tbQuestions = shuffle(data);
        } else {
            tbQuestions = data;
        }
    }
    
    renderTablesGame();
}

function renderTablesGame() {
    if (tbQuestions.length === 0) {
        renderTablesSummary();
        return;
    }
    
    if (!tbIsReviewing) {
        tbCurrentQ = tbQuestions.shift();
    }
    
    let modeTitle = 'Tables Trainer';
    if (tbMode === 'rand_10') modeTitle = 'Random 10';
    else if (tbMode === 'rand_20') modeTitle = 'Random 20';
    else {
        const parts = tbMode.split('_');
        if (parts.length === 2) {
            modeTitle = `Table of ${parts[0]} (${parts[1] === 'ord' ? 'Ordered' : 'Random'})`;
        }
    }

    let gameUI = document.getElementById('tb-game-ui');

    if (!gameUI) {
        appDiv.innerHTML = `
            <div id="tb-game-ui" class="glass-panel game-container" style="animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
                <h2 id="tb-header">${modeTitle} - ${tbQuestions.length + 1} remaining</h2>
                
                <div id="tb-question" style="font-size: 6rem; font-weight: bold; margin: 3rem 0; color: var(--text-main); text-shadow: 0 0 20px var(--primary-glow);">${tbCurrentQ.q} = ?</div>
                
                <div class="input-section">
                    <p id="tb-feedback-text" style="font-size: 1.5rem; color: var(--text-muted); margin-bottom: 2rem; display: none;">Memorize it. We'll ask you this again later.</p>
                    <form id="tb-answer-form">
                        <input type="number" id="tb-input" class="sum-input" autocomplete="off" autofocus required placeholder="Answer">
                        <br>
                        <button type="submit" class="submit-btn" id="tb-submit-btn">Submit Answer</button>
                    </form>
                </div>
            </div>
        `;
        
        const form = document.getElementById('tb-answer-form');
        const input = document.getElementById('tb-input');
        
        setTimeout(() => {
            input.focus();
            tbQuestionStartTime = performance.now();
        }, 100);

        form.onsubmit = (e) => {
            e.preventDefault();
            const inputEl = document.getElementById('tb-input');
            const qEl = document.getElementById('tb-question');
            const btnEl = document.getElementById('tb-submit-btn');
            const fbEl = document.getElementById('tb-feedback-text');
            const containerEl = document.getElementById('tb-game-ui');
            
            if (tbIsReviewing) {
                tbIsReviewing = false;
                inputEl.value = '';
                btnEl.innerText = 'Submit Answer';
                fbEl.style.display = 'none';
                
                containerEl.style.borderColor = '';
                containerEl.style.boxShadow = '';
                qEl.style.color = '';
                qEl.style.textShadow = '';
                
                tbQuestionStartTime = performance.now();
                renderTablesGame(); 
                return;
            }

            const endTime = performance.now();
            const t = ((endTime - tbQuestionStartTime) / 1000);
            const answer = parseInt(inputEl.value);
            
            if (answer === tbCurrentQ.a) {
                tbResults.push(t);
                inputEl.value = '';
                tbQuestionStartTime = performance.now();
                renderTablesGame(); 
            } else {
                tbWrongCount++;
                tbQuestions.push(tbCurrentQ); // Re-queue at the end
                
                tbIsReviewing = true;
                containerEl.style.borderColor = 'var(--error)';
                containerEl.style.boxShadow = '0 0 30px rgba(255,0,0,0.3)';
                
                qEl.innerHTML = `${tbCurrentQ.q} = <span style="color: var(--success); text-shadow: 0 0 20px var(--success);">${tbCurrentQ.a}</span>`;
                
                fbEl.style.display = 'block';
                inputEl.value = ''; 
                btnEl.innerText = 'Got it! (Press Enter)';
            }
        };
    } else {
        if (!tbIsReviewing) {
            document.getElementById('tb-header').innerText = `${modeTitle} - ${tbQuestions.length + 1} remaining`;
            document.getElementById('tb-question').innerText = `${tbCurrentQ.q} = ?`;
        }
    }
}

function renderTablesSummary() {
    const totalTime = tbResults.reduce((a, b) => a + b, 0);
    const statKey = `tb_${tbMode}`;
    const { oldAvg, newAvg } = updateStats(statKey, totalTime, tbWrongCount);

    let modeTitle = 'Tables Trainer';
    if (tbMode === 'rand_10') modeTitle = 'Random 10';
    else if (tbMode === 'rand_20') modeTitle = 'Random 20';
    else {
        const parts = tbMode.split('_');
        if (parts.length === 2) {
            modeTitle = `Table of ${parts[0]} (${parts[1] === 'ord' ? 'Ordered' : 'Random'})`;
        }
    }

    appDiv.innerHTML = `
        <div class="glass-panel">
            <h1>${modeTitle} Summary</h1>
            
            <div class="summary-details">
                <div class="detail-item">
                    <div class="detail-label">Questions Solved</div>
                    <div class="detail-value text-success">${tbResults.length}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Mistakes Made</div>
                    <div class="detail-value text-error">${tbWrongCount}</div>
                </div>
            </div>
            
            <div class="summary-details" style="margin-top: -1.5rem;">
                <div class="detail-item">
                    <div class="detail-label">Old Avg</div>
                    <div class="detail-value" style="color: var(--text-muted); font-size: 1.8rem;">${oldAvg ? oldAvg.toFixed(2) + 's' : '---'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">This Round Time</div>
                    <div class="detail-value" style="font-size: 1.8rem;">${totalTime.toFixed(2)}s</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">New Avg</div>
                    <div class="detail-value" style="color: var(--primary); font-size: 1.8rem;">${newAvg.toFixed(2)}s</div>
                </div>
            </div>
            
            <div class="actions-row">
                <button class="action-btn" onclick="startTablesLevel('${tbMode}')">Retry</button>
                <button class="action-btn secondary" onclick="renderTablesHome()">Tables Menu</button>
            </div>
        </div>
    `;
}

// ==========================================
// SQUARE ROOTS TRAINER
// ==========================================
let srMode = null;
let srQuestions = [];
let srResults = [];
let srWrongCount = 0;
let srCurrentQ = null;
let srQuestionStartTime = 0;
let srIsReviewing = false;

function getSquareRootsData() {
    return [
        { q: '√2', a: '1.41' },
        { q: '√3', a: '1.73' },
        { q: '√4', a: '2' },
        { q: '√5', a: '2.24' },
        { q: '√6', a: '2.45' },
        { q: '√7', a: '2.65' },
        { q: '√8', a: '2.83' },
        { q: '√9', a: '3' },
        { q: '√10', a: '3.16' },
        { q: '√11', a: '3.32' },
        { q: '√12', a: '3.46' },
        { q: '√13', a: '3.61' },
        { q: '√14', a: '3.74' },
        { q: '√15', a: '3.87' },
        { q: '√16', a: '4' }
    ];
}

function renderSquareRootsHome() {
    appMode = 'squareroots';
    const stats = getStats();
    
    function createStatCard(modeId, title, desc) {
        const s = stats[`sr_${modeId}`] || { plays: 0, avgTime: null, lastWrong: 0 };
        const text = s.plays > 0 
            ? `<p style="color: var(--primary); font-weight: bold; margin-top: 0.5rem; font-size: 1rem;">Played: ${s.plays} | Avg: ${s.avgTime.toFixed(2)}s <br> PIA: ${s.lastWrong || 0}</p>`
            : `<p style="color: grey; font-size: 1rem; margin-top: 0.5rem;">Not played yet</p>`;
        return `
            <div class="level-card" onclick="startSquareRootsLevel('${modeId}')">
                <h2>${title}</h2>
                <p>${desc}</p>
                ${text}
            </div>
        `;
    }

    appDiv.innerHTML = `
        <div class="glass-panel">
            <h1> Square Roots Trainer </h1>
            <div class="level-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
                ${createStatCard('ord', 'Square Roots In Order', '')}
                ${createStatCard('rand', 'Square Roots Shuffled', '')}
            </div>
            <div class="actions-row" style="margin-top: 3rem;">
                <button class="action-btn secondary" onclick="renderMainMenu()">Main Menu</button>
            </div>
        </div>
    `;
}

function startSquareRootsLevel(mode) {
    srMode = mode;
    srWrongCount = 0;
    srResults = [];
    srIsReviewing = false;

    const data = getSquareRootsData();
    if (mode === 'rand') {
        srQuestions = shuffle([...data]);
    } else {
        srQuestions = [...data];
    }
    
    renderSquareRootsGame();
}

function renderSquareRootsGame() {
    if (srQuestions.length === 0) {
        renderSquareRootsSummary();
        return;
    }
    
    if (!srIsReviewing) {
        srCurrentQ = srQuestions.shift();
    }
    
    const modeTitle = srMode === 'ord' ? 'Square Roots Scheduled' : 'Square Roots Random';

    let gameUI = document.getElementById('sr-game-ui');

    if (!gameUI) {
        appDiv.innerHTML = `
            <div id="sr-game-ui" class="glass-panel game-container" style="animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
                <h2 id="sr-header">${modeTitle} - ${srQuestions.length + 1} remaining</h2>
                
                <div id="sr-question" style="font-size: 6rem; font-weight: bold; margin: 3rem 0; color: var(--text-main); text-shadow: 0 0 20px var(--primary-glow);">${srCurrentQ.q} = ?</div>
                
                <div class="input-section">
                    <p id="sr-feedback-text" style="font-size: 1.5rem; color: var(--text-muted); margin-bottom: 2rem; display: none;">Memorize it. We'll ask you this again later.</p>
                    <form id="sr-answer-form">
                        <input type="number" step="any" id="sr-input" class="sum-input" autocomplete="off" autofocus required placeholder="Answer">
                        <br>
                        <button type="submit" class="submit-btn" id="sr-submit-btn">Submit Answer</button>
                    </form>
                </div>
            </div>
        `;
        
        const form = document.getElementById('sr-answer-form');
        const input = document.getElementById('sr-input');
        
        setTimeout(() => {
            input.focus();
            srQuestionStartTime = performance.now();
        }, 100);

        form.onsubmit = (e) => {
            e.preventDefault();
            const inputEl = document.getElementById('sr-input');
            const qEl = document.getElementById('sr-question');
            const btnEl = document.getElementById('sr-submit-btn');
            const fbEl = document.getElementById('sr-feedback-text');
            const containerEl = document.getElementById('sr-game-ui');
            
            if (srIsReviewing) {
                srIsReviewing = false;
                inputEl.value = '';
                btnEl.innerText = 'Submit Answer';
                fbEl.style.display = 'none';
                
                containerEl.style.borderColor = '';
                containerEl.style.boxShadow = '';
                qEl.style.color = '';
                qEl.style.textShadow = '';
                
                srQuestionStartTime = performance.now();
                renderSquareRootsGame(); 
                return;
            }

            const endTime = performance.now();
            const t = ((endTime - srQuestionStartTime) / 1000);
            const answer = inputEl.value.trim(); // Handle as string
            
            if (answer === srCurrentQ.a) {
                srResults.push(t);
                inputEl.value = '';
                srQuestionStartTime = performance.now();
                renderSquareRootsGame(); 
            } else {
                srWrongCount++;
                srQuestions.push(srCurrentQ); // Re-queue at the end
                
                srIsReviewing = true;
                containerEl.style.borderColor = 'var(--error)';
                containerEl.style.boxShadow = '0 0 30px rgba(255,0,0,0.3)';
                
                qEl.innerHTML = `${srCurrentQ.q} = <span style="color: var(--success); text-shadow: 0 0 20px var(--success);">${srCurrentQ.a}</span>`;
                
                fbEl.style.display = 'block';
                inputEl.value = ''; 
                btnEl.innerText = 'Got it! (Press Enter)';
            }
        };
    } else {
        if (!srIsReviewing) {
            document.getElementById('sr-header').innerText = `${modeTitle} - ${srQuestions.length + 1} remaining`;
            document.getElementById('sr-question').innerText = `${srCurrentQ.q} = ?`;
        }
    }
}

function renderSquareRootsSummary() {
    const totalTime = srResults.reduce((a, b) => a + b, 0);
    const statKey = `sr_${srMode}`;
    const { oldAvg, newAvg } = updateStats(statKey, totalTime, srWrongCount);

    const modeTitle = srMode === 'ord' ? 'Square Roots Scheduled' : 'Square Roots Random';

    appDiv.innerHTML = `
        <div class="glass-panel">
            <h1>${modeTitle} Summary</h1>
            
            <div class="summary-details">
                <div class="detail-item">
                    <div class="detail-label">Questions Solved</div>
                    <div class="detail-value text-success">${srResults.length}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Mistakes Made</div>
                    <div class="detail-value text-error">${srWrongCount}</div>
                </div>
            </div>
            
            <div class="summary-details" style="margin-top: -1.5rem;">
                <div class="detail-item">
                    <div class="detail-label">Old Avg</div>
                    <div class="detail-value" style="color: var(--text-muted); font-size: 1.8rem;">${oldAvg ? oldAvg.toFixed(2) + 's' : '---'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">This Round Time</div>
                    <div class="detail-value" style="font-size: 1.8rem;">${totalTime.toFixed(2)}s</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">New Avg</div>
                    <div class="detail-value" style="color: var(--primary); font-size: 1.8rem;">${newAvg.toFixed(2)}s</div>
                </div>
            </div>
            
            <div class="actions-row">
                <button class="action-btn" onclick="startSquareRootsLevel('${srMode}')">Retry</button>
                <button class="action-btn secondary" onclick="renderSquareRootsHome()">Square Roots Menu</button>
            </div>
        </div>
    `;
}

// ==========================================
// POWERS TRAINER
// ==========================================
let pwMode = null;
let pwQuestions = [];
let pwResults = [];
let pwWrongCount = 0;
let pwCurrentQ = null;
let pwQuestionStartTime = 0;
let pwIsReviewing = false;

function getPowersData(type) {
    const questions = [];
    if (type === '2') {
        for (let i = 4; i <= 10; i++) questions.push({ q: `2<sup>${i}</sup>`, a: Math.pow(2, i) });
    } else if (type === '3') {
        for (let i = 4; i <= 8; i++) questions.push({ q: `3<sup>${i}</sup>`, a: Math.pow(3, i) });
    } else if (type === '4') {
        for (let i = 4; i <= 6; i++) questions.push({ q: `4<sup>${i}</sup>`, a: Math.pow(4, i) });
    } else if (type === '5') {
        for (let i = 4; i <= 6; i++) questions.push({ q: `5<sup>${i}</sup>`, a: Math.pow(5, i) });
    } else if (type === 'others') {
        for (let i = 6; i <= 9; i++) questions.push({ q: `${i}<sup>4</sup>`, a: Math.pow(i, 4) });
    }
    return questions;
}

function getAllPowersData() {
    return [
        ...getPowersData('2'), ...getPowersData('3'), ...getPowersData('4'),
        ...getPowersData('5'), ...getPowersData('others')
    ];
}

function renderPowersHome() {
    appMode = 'powers';
    const stats = getStats();
    
    function createStatCard(modeId, title, desc, colSpan = false) {
        const s = stats[`pw_${modeId}`] || { plays: 0, avgTime: null, lastWrong: 0 };
        const text = s.plays > 0 
            ? `<p style="color: var(--primary); font-weight: bold; margin-top: 0.5rem; font-size: 1rem;">Played: ${s.plays} | Avg: ${s.avgTime.toFixed(2)}s <br> PIA: ${s.lastWrong || 0}</p>`
            : `<p style="color: grey; font-size: 1rem; margin-top: 0.5rem;">Not played yet</p>`;
        const extraStyle = colSpan ? 'grid-column: 1 / -1;' : '';
        return `
            <div class="level-card" style="${extraStyle}" onclick="startPowersLevel('${modeId}')">
                <h2>${title}</h2>
                <p>${desc}</p>
                ${text}
            </div>
        `;
    }

    appDiv.innerHTML = `
        <div class="glass-panel">
            <h1> Powers Trainer </h1>
            <div class="level-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
                ${createStatCard('rand_10', 'Random 10', '')}
                ${createStatCard('rand_20', 'Random 20', '')}
                ${createStatCard('2_ord', 'Ordered Powers of 2', '')}
                ${createStatCard('2_rand', 'Random Powers of 2', '')}
                ${createStatCard('3_ord', 'Ordered Powers of 3', '')}
                ${createStatCard('3_rand', 'Random Powers of 3', '')}
                ${createStatCard('4_ord', 'Ordered Powers of 4', '')}
                ${createStatCard('4_rand', 'Random Powers of 4', '')}
                ${createStatCard('5_ord', 'Ordered Powers of 5', '')}
                ${createStatCard('5_rand', 'Random Powers of 5', '')}
                ${createStatCard('others_ord', 'Ordered Other powers', '')}
                ${createStatCard('others_rand', 'Random Other powers', '')}
            </div>
            <div class="actions-row" style="margin-top: 3rem;">
                <button class="action-btn secondary" onclick="renderMainMenu()">Main Menu</button>
            </div>
        </div>
    `;
}

function startPowersLevel(mode) {
    pwMode = mode;
    pwWrongCount = 0;
    pwResults = [];
    pwIsReviewing = false;

    if (mode === 'rand_10') {
        pwQuestions = shuffle(getAllPowersData()).slice(0, 10);
    } else if (mode === 'rand_20') {
        pwQuestions = shuffle(getAllPowersData()).slice(0, 20);
    } else {
        const parts = mode.split('_');
        const type = parts[0];
        const style = parts[1];
        const data = getPowersData(type);
        if (style === 'rand') {
            pwQuestions = shuffle(data);
        } else {
            pwQuestions = data;
        }
    }
    
    renderPowersGame();
}

function renderPowersGame() {
    if (pwQuestions.length === 0) {
        renderPowersSummary();
        return;
    }
    
    if (!pwIsReviewing) {
        pwCurrentQ = pwQuestions.shift();
    }
    
    let modeTitle = 'Powers Trainer';
    if (pwMode === 'rand_10') modeTitle = 'Random 10';
    else if (pwMode === 'rand_20') modeTitle = 'Random 20';
    else {
        const parts = pwMode.split('_');
        if (parts.length === 2) {
            const tMap = { '2': 'Powers of 2', '3': 'Powers of 3', '4': 'Powers of 4', '5': 'Powers of 5', 'others': 'Other powers of 4' };
            modeTitle = `${tMap[parts[0]]} (${parts[1] === 'ord' ? 'Ordered' : 'Random'})`;
        }
    }

    let gameUI = document.getElementById('pw-game-ui');

    if (!gameUI) {
        appDiv.innerHTML = `
            <div id="pw-game-ui" class="glass-panel game-container" style="animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
                <h2 id="pw-header">${modeTitle} - ${pwQuestions.length + 1} remaining</h2>
                
                <div id="pw-question" style="font-size: 6rem; font-weight: bold; margin: 3rem 0; color: var(--text-main); text-shadow: 0 0 20px var(--primary-glow);">${pwCurrentQ.q} = ?</div>
                
                <div class="input-section">
                    <p id="pw-feedback-text" style="font-size: 1.5rem; color: var(--text-muted); margin-bottom: 2rem; display: none;">Memorize it. We'll ask you this again later.</p>
                    <form id="pw-answer-form">
                        <input type="number" id="pw-input" class="sum-input" autocomplete="off" autofocus required placeholder="Answer">
                        <br>
                        <button type="submit" class="submit-btn" id="pw-submit-btn">Submit Answer</button>
                    </form>
                </div>
            </div>
        `;
        
        const form = document.getElementById('pw-answer-form');
        const input = document.getElementById('pw-input');
        
        setTimeout(() => {
            input.focus();
            pwQuestionStartTime = performance.now();
        }, 100);

        form.onsubmit = (e) => {
            e.preventDefault();
            const inputEl = document.getElementById('pw-input');
            const qEl = document.getElementById('pw-question');
            const btnEl = document.getElementById('pw-submit-btn');
            const fbEl = document.getElementById('pw-feedback-text');
            const containerEl = document.getElementById('pw-game-ui');
            
            if (pwIsReviewing) {
                pwIsReviewing = false;
                inputEl.value = '';
                btnEl.innerText = 'Submit Answer';
                fbEl.style.display = 'none';
                
                containerEl.style.borderColor = '';
                containerEl.style.boxShadow = '';
                qEl.style.color = '';
                qEl.style.textShadow = '';
                
                pwQuestionStartTime = performance.now();
                renderPowersGame(); 
                return;
            }

            const endTime = performance.now();
            const t = ((endTime - pwQuestionStartTime) / 1000);
            const answer = parseInt(inputEl.value);
            
            if (answer === pwCurrentQ.a) {
                pwResults.push(t);
                inputEl.value = '';
                pwQuestionStartTime = performance.now();
                renderPowersGame(); 
            } else {
                pwWrongCount++;
                pwQuestions.push(pwCurrentQ); // Re-queue at the end
                
                pwIsReviewing = true;
                containerEl.style.borderColor = 'var(--error)';
                containerEl.style.boxShadow = '0 0 30px rgba(255,0,0,0.3)';
                
                qEl.innerHTML = `${pwCurrentQ.q} = <span style="color: var(--success); text-shadow: 0 0 20px var(--success);">${pwCurrentQ.a}</span>`;
                
                fbEl.style.display = 'block';
                inputEl.value = ''; 
                btnEl.innerText = 'Got it! (Press Enter)';
            }
        };
    } else {
        if (!pwIsReviewing) {
            document.getElementById('pw-header').innerText = `${modeTitle} - ${pwQuestions.length + 1} remaining`;
            document.getElementById('pw-question').innerHTML = `${pwCurrentQ.q} = ?`;
        }
    }
}

function renderPowersSummary() {
    const totalTime = pwResults.reduce((a, b) => a + b, 0);
    const statKey = `pw_${pwMode}`;
    const { oldAvg, newAvg } = updateStats(statKey, totalTime, pwWrongCount);

    let modeTitle = 'Powers Trainer';
    if (pwMode === 'rand_10') modeTitle = 'Random 10';
    else if (pwMode === 'rand_20') modeTitle = 'Random 20';
    else {
        const parts = pwMode.split('_');
        if (parts.length === 2) {
            const tMap = { '2': 'Powers of 2', '3': 'Powers of 3', '4': 'Powers of 4', '5': 'Powers of 5', 'others': 'Other powers of 4' };
            modeTitle = `${tMap[parts[0]]} (${parts[1] === 'ord' ? 'Ordered' : 'Random'})`;
        }
    }

    appDiv.innerHTML = `
        <div class="glass-panel">
            <h1>${modeTitle} Summary</h1>
            
            <div class="summary-details">
                <div class="detail-item">
                    <div class="detail-label">Questions Solved</div>
                    <div class="detail-value text-success">${pwResults.length}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Mistakes Made</div>
                    <div class="detail-value text-error">${pwWrongCount}</div>
                </div>
            </div>
            
            <div class="summary-details" style="margin-top: -1.5rem;">
                <div class="detail-item">
                    <div class="detail-label">Old Avg</div>
                    <div class="detail-value" style="color: var(--text-muted); font-size: 1.8rem;">${oldAvg ? oldAvg.toFixed(2) + 's' : '---'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">This Round Time</div>
                    <div class="detail-value" style="font-size: 1.8rem;">${totalTime.toFixed(2)}s</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">New Avg</div>
                    <div class="detail-value" style="color: var(--primary); font-size: 1.8rem;">${newAvg.toFixed(2)}s</div>
                </div>
            </div>
            
            <div class="actions-row">
                <button class="action-btn" onclick="startPowersLevel('${pwMode}')">Retry</button>
                <button class="action-btn secondary" onclick="renderPowersHome()">Powers Menu</button>
            </div>
        </div>
    `;
}
