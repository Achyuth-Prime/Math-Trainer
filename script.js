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

function init() {
    renderHome();
}

function renderHome() {
    appDiv.innerHTML = `
        <div class="glass-panel">
            <h1> Mental Addition Trainer </h1>
            <div class="level-grid">
                ${Object.keys(LEVELS).map(level => `
                    <div class="level-card" onclick="startLevel(${level})">
                        <h2>Level ${level}</h2>
                        <p>${LEVELS[level].count} numbers under ${LEVELS[level].max_val}</p>
                    </div>
                `).join('')}
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
    
    appDiv.innerHTML = `
        <div class="glass-panel game-container" style="animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
            <h2>Level ${currentLevel} - Round ${currentStartPointIndex + 1} / ${startPoints.length}</h2>
            
            <div class="circle-container" id="circle-container"></div>
            
            <div class="input-section">
                <p>Begin adding from: <span class="start-point-highlight">${currentStartPoint}</span></p>
                <form id="answer-form">
                    <input type="number" id="sum-input" class="sum-input" autocomplete="off" autofocus required placeholder="Total sum?">
                    <br>
                    <button type="submit" class="submit-btn" id="submit-btn">Submit Answer</button>
                </form>
            </div>
        </div>
    `;

    renderCircle(numbers, currentStartPoint);
    
    const form = document.getElementById('answer-form');
    const input = document.getElementById('sum-input');
    
    // Slight timeout before starting timer
    setTimeout(() => {
        input.focus();
        startTime = performance.now();
    }, 100);

    form.onsubmit = (e) => {
        e.preventDefault();
        const endTime = performance.now();
        const answer = parseInt(input.value);
        
        results.push({
            startPoint: currentStartPoint,
            userAnswer: answer,
            correct: answer === correctSum,
            time: ((endTime - startTime) / 1000).toFixed(2)
        });
        
        currentStartPointIndex++;
        renderGame();
    };
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
    let html = `
        <div class="glass-panel">
            <h1>Level ${currentLevel} Summary</h1>
            
            <div class="summary-details">
                <div class="detail-item">
                    <div class="detail-label">Full Sequence</div>
                    <div class="detail-value" style="font-size: 1.4rem;">${numbers.join(' + ')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Correct Sum</div>
                    <div class="detail-value text-success">${correctSum}</div>
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
                <button class="action-btn secondary" onclick="renderHome()">Main Menu</button>
            </div>
        </div>
    `;
    
    appDiv.innerHTML = html;
}

// Start app
init();
