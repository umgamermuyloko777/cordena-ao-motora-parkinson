// ==================== FUNÇÕES UTILITÁRIAS ====================

function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    
    return {
        x: 0.5 * ((2 * p1.x) +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * ((2 * p1.y) +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
    };
}

function getLevelConfig(level) {
    if (level <= 3) {
        return {
            difficultyName: 'Fácil',
            difficultyClass: 'easy',
            complexity: 3 + level,
            pathWidth: 55 - level * 5,
            waveFrequency: 1 + level * 0.5,
            waveAmplitude: 10 + level * 5
        };
    } else if (level <= 6) {
        return {
            difficultyName: 'Médio',
            difficultyClass: 'medium',
            complexity: 5 + level,
            pathWidth: 40 - (level - 3) * 3,
            waveFrequency: 2 + level * 0.5,
            waveAmplitude: 25 + (level - 3) * 10
        };
    } else if (level <= 10) {
        return {
            difficultyName: 'Difícil',
            difficultyClass: 'hard',
            complexity: 8 + level,
            pathWidth: 30 - (level - 6) * 2,
            waveFrequency: 3 + level * 0.5,
            waveAmplitude: 40 + (level - 6) * 8
        };
    } else if (level <= 15) {
        return {
            difficultyName: 'Avançado',
            difficultyClass: 'expert',
            complexity: 12 + level,
            pathWidth: Math.max(18, 22 - (level - 10)),
            waveFrequency: 4 + level * 0.3,
            waveAmplitude: 50 + (level - 10) * 5
        };
    } else {
        return {
            difficultyName: 'Mestre',
            difficultyClass: 'master',
            complexity: 15 + Math.floor(level / 2),
            pathWidth: Math.max(15, 18 - Math.floor((level - 15) / 2)),
            waveFrequency: 5 + level * 0.2,
            waveAmplitude: 60 + (level - 15) * 3
        };
    }
}

function showFeedback(emoji) {
    const feedback = document.createElement('div');
    feedback.className = 'feedback';
    feedback.textContent = emoji;
    document.body.appendChild(feedback);
    
    setTimeout(() => feedback.remove(), 500);
}

function updateDifficultyBadge(text, className) {
    const badge = document.getElementById('difficultyBadge');
    badge.textContent = text;
    badge.className = 'difficulty-badge ' + className;
}

function getStars(score) {
    if (score >= 500) return 3;
    if (score >= 300) return 2;
    if (score >= 100) return 1;
    return 0;
}