// ==================== ESTADO DO JOGO ====================

let state = {
    currentLevel: 1,
    isDrawing: false,
    gameStarted: false,
    pathPoints: [],
    userPath: [],
    startPoint: null,
    endPoint: null,
    startTime: null,
    timerInterval: null,
    accuracy: 100,
    pathWidth: 50,
    checkpoints: [],
    reachedCheckpoints: [],
    totalScore: 0,
    outOfPathCount: 0,
    hasStarted: false
};

// ==================== GERAÇÃO DO CAMINHO ====================

function generatePath() {
    state.pathPoints = [];
    state.checkpoints = [];
    state.reachedCheckpoints = [];
    state.userPath = [];
    state.hasStarted = false;
    
    const margin = 50;
    const w = canvas.width - margin * 2;
    const h = canvas.height - margin * 2;
    
    let config = getLevelConfig(state.currentLevel);
    state.pathWidth = config.pathWidth;
    
    updateDifficultyBadge(config.difficultyName, config.difficultyClass);
    
    const numPoints = config.complexity;
    let controlPoints = [];
    
    controlPoints.push({ 
        x: margin, 
        y: margin + h * 0.3 + Math.random() * h * 0.4 
    });
    
    for (let i = 1; i < numPoints - 1; i++) {
        const progress = i / (numPoints - 1);
        const x = margin + w * progress;
        const y = margin + Math.random() * h;
        controlPoints.push({ x, y });
    }
    
    controlPoints.push({ 
        x: canvas.width - margin, 
        y: margin + h * 0.3 + Math.random() * h * 0.4 
    });
    
    for (let i = 0; i < controlPoints.length - 1; i++) {
        const p0 = controlPoints[Math.max(0, i - 1)];
        const p1 = controlPoints[i];
        const p2 = controlPoints[i + 1];
        const p3 = controlPoints[Math.min(controlPoints.length - 1, i + 2)];
        
        const steps = 40;
        for (let t = 0; t <= 1; t += 1 / steps) {
            const point = catmullRom(p0, p1, p2, p3, t);
            
            const wave = Math.sin(t * Math.PI * config.waveFrequency) * config.waveAmplitude;
            point.y += wave;
            
            point.x = Math.max(margin, Math.min(canvas.width - margin, point.x));
            point.y = Math.max(margin, Math.min(canvas.height - margin, point.y));
            
            state.pathPoints.push(point);
        }
    }
    
    const numCheckpoints = Math.min(5, 2 + Math.floor(state.currentLevel / 2));
    const checkpointInterval = Math.floor(state.pathPoints.length / (numCheckpoints + 1));
    
    for (let i = 1; i <= numCheckpoints; i++) {
        const index = i * checkpointInterval;
        if (index < state.pathPoints.length - 10) {
            state.checkpoints.push({
                ...state.pathPoints[index],
                index: i - 1
            });
        }
    }
    
    state.startPoint = state.pathPoints[0];
    state.endPoint = state.pathPoints[state.pathPoints.length - 1];
    
    updateCheckpointDisplay();
    drawPath();
}

// ==================== LÓGICA DO JOGO ====================

function isPointOnPath(point) {
    for (let i = 0; i < state.pathPoints.length; i++) {
        if (distance(point, state.pathPoints[i]) <= state.pathWidth / 2) {
            return true;
        }
    }
    return false;
}

function checkCheckpoints(point) {
    state.checkpoints.forEach((cp, index) => {
        if (!state.reachedCheckpoints.includes(index)) {
            if (distance(point, cp) <= state.pathWidth / 2 + 5) {
                state.reachedCheckpoints.push(index);
                updateCheckpointDisplay();
                showFeedback('✓');
            }
        }
    });
}

function checkEnd(point) {
    return distance(point, state.endPoint) <= 25;
}

function updateCheckpointDisplay() {
    document.getElementById('checkpointDisplay').textContent = 
        `${state.reachedCheckpoints.length}/${state.checkpoints.length}`;
}

// ==================== EVENTOS ====================

function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function handleStart(e) {
    e.preventDefault();
    if (!state.gameStarted) return;
    
    const pos = getPointerPos(e);
    
    if (distance(pos, state.startPoint) <= 35) {
        state.isDrawing = true;
        state.userPath = [pos];
        
        if (!state.hasStarted) {
            state.hasStarted = true;
            state.startTime = Date.now();
            startTimer();
        }
    }
}

function handleMove(e) {
    e.preventDefault();
    if (!state.isDrawing || !state.gameStarted) return;
    
    const pos = getPointerPos(e);
    state.userPath.push(pos);
    
    if (!isPointOnPath(pos)) {
        state.outOfPathCount++;
        if (state.outOfPathCount % 3 === 0) {
            state.accuracy = Math.max(0, state.accuracy - 1);
        }
    }
    
    checkCheckpoints(pos);
    
    document.getElementById('accuracyDisplay').textContent = Math.round(state.accuracy) + '%';
    
    if (checkEnd(pos)) {
        endLevel(true);
    }
    
    drawPath();
}

function handleEnd(e) {
    e.preventDefault();
    state.isDrawing = false;
}

canvas.addEventListener('pointerdown', handleStart, { passive: false });
canvas.addEventListener('pointermove', handleMove, { passive: false });
canvas.addEventListener('pointerup', handleEnd, { passive: false });
canvas.addEventListener('pointercancel', handleEnd, { passive: false });
canvas.addEventListener('pointerleave', handleEnd, { passive: false });

canvas.addEventListener('touchstart', handleStart, { passive: false });
canvas.addEventListener('touchmove', handleMove, { passive: false });
canvas.addEventListener('touchend', handleEnd, { passive: false });
canvas.addEventListener('touchcancel', handleEnd, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (state.gameStarted) e.preventDefault();
}, { passive: false });

document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
document.addEventListener('gestureend', (e) => e.preventDefault());

// ==================== TIMER ====================

function startTimer() {
    state.timerInterval = setInterval(() => {
        if (!state.startTime) return;
        
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('timeDisplay').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 100);
}

function stopTimer() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
}

// ==================== PONTUAÇÃO ====================

function calculateScore() {
    const timeElapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    
    const maxTimeBonus = 200;
    const timeBonus = Math.max(0, maxTimeBonus - timeElapsed * 3);
    
    const checkpointBonus = state.checkpoints.length > 0 
        ? (state.reachedCheckpoints.length / state.checkpoints.length) * 150 
        : 0;
    
    const levelBonus = state.currentLevel * 25;
    const accuracyScore = state.accuracy * 4;
    
    const totalScore = Math.round(accuracyScore + timeBonus + checkpointBonus + levelBonus);
    
    return Math.max(0, totalScore);
}

// ==================== FIM DE NÍVEL ====================

function endLevel(success) {
    stopTimer();
    state.gameStarted = false;
    
    const score = calculateScore();
    const stars = getStars(score);
    const timeElapsed = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;
    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;
    
    document.getElementById('levelCompleteTitle').textContent = 
        success ? '🎉 Nível Completo!' : '😅 Continue Tentando!';
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('accuracyResult').textContent = Math.round(state.accuracy) + '%';
    document.getElementById('timeResult').textContent = 
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('checkpointResult').textContent = 
        `${state.reachedCheckpoints.length}/${state.checkpoints.length}`;
    
    for (let i = 1; i <= 3; i++) {
        const star = document.getElementById('star' + i);
        star.classList.remove('active');
        
        if (i <= stars) {
            setTimeout(() => {
                star.classList.add('active');
            }, i * 200);
        }
    }
    
    const nextConfig = getLevelConfig(state.currentLevel + 1);
    document.getElementById('nextLevelInfo').textContent = 
        `Próximo nível: ${state.currentLevel + 1} (${nextConfig.difficultyName})`;
    
    state.totalScore += score;
    
    document.getElementById('endLevelModal').style.display = 'flex';
}

// ==================== CONTROLES ====================

function startGame() {
    document.getElementById('startModal').style.display = 'none';
    state.gameStarted = true;
    resizeCanvas();
    generatePath();
    
    requestAnimationFrame(function animate() {
        if (state.gameStarted) {
            drawPath();
            requestAnimationFrame(animate);
        }
    });
}

function nextLevel() {
    state.currentLevel++;
    state.accuracy = 100;
    state.startTime = null;
    state.userPath = [];
    state.reachedCheckpoints = [];
    state.outOfPathCount = 0;
    state.hasStarted = false;
    
    document.getElementById('levelDisplay').textContent = state.currentLevel;
    document.getElementById('accuracyDisplay').textContent = '100%';
    document.getElementById('timeDisplay').textContent = '0:00';
    document.getElementById('progressFill').style.width = '0%';
    
    document.getElementById('endLevelModal').style.display = 'none';
    
    state.gameStarted = true;
    generatePath();
}

function exitGame() {
    document.getElementById('endLevelModal').style.display = 'none';
    
    document.getElementById('totalLevels').textContent = state.currentLevel;
    document.getElementById('totalScore').textContent = state.totalScore;
    document.getElementById('maxLevel').textContent = state.currentLevel;
    
    document.getElementById('exitScreen').style.display = 'flex';
    
    setTimeout(() => {
        try {
            window.close();
        } catch (e) {}
    }, 3000);
}

// ==================== EVENT LISTENERS ====================

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('startBtn').addEventListener('touchend', (e) => {
    e.preventDefault();
    startGame();
});

document.getElementById('continueBtn').addEventListener('click', nextLevel);
document.getElementById('continueBtn').addEventListener('touchend', (e) => {
    e.preventDefault();
    nextLevel();
});

document.getElementById('exitBtn').addEventListener('click', exitGame);
document.getElementById('exitBtn').addEventListener('touchend', (e) => {
    e.preventDefault();
    exitGame();
});

if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(() => {
        console.log('Não foi possível bloquear a orientação');
    });
}

document.body.addEventListener('touchstart', (e) => {
    if (e.target.tagName !== 'BUTTON') {
        e.preventDefault();
    }
}, { passive: false });