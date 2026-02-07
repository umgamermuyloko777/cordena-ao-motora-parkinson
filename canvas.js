// ==================== FUNÇÕES DE DESENHO ====================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = document.getElementById('canvasContainer');
    const padding = 20;
    
    const maxWidth = container.clientWidth - padding;
    const maxHeight = container.clientHeight - padding;
    
    const aspectRatio = 16 / 9;
    
    let width = maxWidth;
    let height = width / aspectRatio;
    
    if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
    }
    
    canvas.width = Math.floor(width);
    canvas.height = Math.floor(height);
    
    if (state.gameStarted && state.pathPoints.length > 0) {
        generatePath();
    }
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    
    const gridSize = 30;
    
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawEndpoint(point, color, icon) {
    const pulseSize = 20 + Math.sin(Date.now() / 200) * 3;
    ctx.beginPath();
    ctx.arc(point.x, point.y, pulseSize, 0, Math.PI * 2);
    ctx.fillStyle = color + '33';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, point.x, point.y);
}

function drawPath() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawGrid();
    
    // Sombra do caminho
    ctx.beginPath();
    ctx.moveTo(state.pathPoints[0].x + 3, state.pathPoints[0].y + 3);
    for (let i = 1; i < state.pathPoints.length; i++) {
        ctx.lineTo(state.pathPoints[i].x + 3, state.pathPoints[i].y + 3);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = state.pathWidth + 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Caminho principal
    ctx.beginPath();
    ctx.moveTo(state.pathPoints[0].x, state.pathPoints[0].y);
    for (let i = 1; i < state.pathPoints.length; i++) {
        ctx.lineTo(state.pathPoints[i].x, state.pathPoints[i].y);
    }
    
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#2d3748');
    gradient.addColorStop(0.5, '#4a5568');
    gradient.addColorStop(1, '#2d3748');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = state.pathWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Borda
    ctx.strokeStyle = 'rgba(79, 209, 197, 0.3)';
    ctx.lineWidth = state.pathWidth + 2;
    ctx.stroke();
    
    // Linha guia
    ctx.beginPath();
    ctx.moveTo(state.pathPoints[0].x, state.pathPoints[0].y);
    for (let i = 1; i < state.pathPoints.length; i++) {
        ctx.lineTo(state.pathPoints[i].x, state.pathPoints[i].y);
    }
    ctx.strokeStyle = 'rgba(99, 179, 237, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Checkpoints
    state.checkpoints.forEach((cp, index) => {
        const reached = state.reachedCheckpoints.includes(index);
        
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = reached ? 'rgba(72, 187, 120, 0.3)' : 'rgba(237, 137, 54, 0.3)';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = reached ? '#48bb78' : '#ed8936';
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(reached ? '✓' : (index + 1), cp.x, cp.y);
    });
    
    drawEndpoint(state.startPoint, '#48bb78', '▶');
    drawEndpoint(state.endPoint, '#f56565', '🏁');
    
    // Caminho do usuário
    if (state.userPath.length > 1) {
        ctx.beginPath();
        ctx.moveTo(state.userPath[0].x, state.userPath[0].y);
        
        for (let i = 1; i < state.userPath.length; i++) {
            ctx.lineTo(state.userPath[i].x, state.userPath[i].y);
        }
        
        const userGradient = ctx.createLinearGradient(
            state.userPath[0].x, state.userPath[0].y,
            state.userPath[state.userPath.length - 1].x,
            state.userPath[state.userPath.length - 1].y
        );
        userGradient.addColorStop(0, '#4fd1c5');
        userGradient.addColorStop(1, '#63b3ed');
        
        ctx.strokeStyle = userGradient;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(79, 209, 197, 0.4)';
        ctx.lineWidth = 10;
        ctx.stroke();
    }
    
    updateProgressBar();
}

function updateProgressBar() {
    if (state.userPath.length === 0 || state.pathPoints.length === 0) {
        document.getElementById('progressFill').style.width = '0%';
        return;
    }
    
    const lastUserPoint = state.userPath[state.userPath.length - 1];
    let minDist = Infinity;
    let closestIndex = 0;
    
    for (let i = 0; i < state.pathPoints.length; i++) {
        const dist = distance(lastUserPoint, state.pathPoints[i]);
        if (dist < minDist) {
            minDist = dist;
            closestIndex = i;
        }
    }
    
    const progress = (closestIndex / state.pathPoints.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 200);
});

resizeCanvas();