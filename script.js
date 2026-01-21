const DICIONARIO = [
    "ARBOL", "CASAS", "LIBRO", "PLAYA", "NOCHE", "PERRO", "GATOS", "RADIO", "TRENES", "FLORES",
    "CIELO", "PIANO", "MANGO", "VERDE", "BRAZO", "DULCE", "FRUTA", "HUEVO", "JABON", "LIMON",
    "MESA", "NIÑOS", "ORDEN", "PARQUE", "QUESO", "RATON", "SUELO", "TABLA", "UNION", "VOCAL",
    "BALON", "COCHE", "RELOJ", "PAPEL", "TIGRE", "BARCO", "SUEÑO", "LLAVE", "PLUMA", "FUEGO",
    "VAPOR", "VILLA", "VISTA", "VOCES", "VUELO", "ZORRO", "ZURDO", "BOMBA", "CALLE", "CARTA",
    "CHICO", "COSTA", "DANZA", "DISCO", "EBANO", "ENANO", "FAROL", "FORMA", "GLOBO", "HOJAS",
    "JUEGO", "LAPIZ", "MANOS", "MONTE", "NARIZ", "OBRAS", "PECHO", "PIEDRA", "RAMOS", "SALTO",
    "SILLA", "TORRE", "VALLE", "YEGUA", "ZANJA", "ARENA", "BARRO", "CABRA", "DEDOS"
];

class WordleGame {
    constructor() {
        this.board = document.getElementById('board');
        this.keyboard = document.getElementById('keyboard');
        this.messageContainer = document.getElementById('message-container');
        this.dailyBtn = document.getElementById('daily-mode');
        this.infiniteBtn = document.getElementById('infinite-mode');
        this.overlay = document.getElementById('overlay');
        this.modalContent = document.getElementById('modal-content');
        this.closeModalBtn = document.getElementById('close-modal');
        this.helpBtn = document.getElementById('help-btn');
        this.statsBtn = document.getElementById('stats-btn');
        this.bgToggleBtn = document.getElementById('bg-toggle-btn');
        this.bgVideo = document.getElementById('bg-video');
        this.appContainer = document.querySelector('.app-container');

        // Music Player Elements
        this.musicPlayer = document.getElementById('music-player');
        this.bgMusic = document.getElementById('bg-music');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.progressBar = document.getElementById('progress-bar');
        this.progressWrapper = document.querySelector('.progress-bar-wrapper');
        this.currentTimeEl = document.getElementById('current-time');
        this.durationEl = document.getElementById('duration');
        this.playIcon = document.getElementById('play-icon');
        this.volumeBar = document.getElementById('volume-bar');
        this.volumeWrapper = document.querySelector('.volume-bar-wrapper');
        this.settingsBtn = document.getElementById('settings-btn');
        this.visualizer = document.getElementById('visualizer');

        this.isDraggingProgress = false;
        this.isDraggingVolume = false;
        this.audioCtx = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;

        this.mode = 'daily';
        this.backgroundType = localStorage.getItem('bg-type') || 'video';
        this.currentRow = 0;
        this.currentTile = 0;
        this.setTargetWord();
        this.gameState = "playing";
        this.guesses = Array(6).fill("");

        this.stats = JSON.parse(localStorage.getItem('wordle-stats')) || {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            guesses: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
        };

        this.gameId = 0;

        if (this.bgMusic) this.bgMusic.volume = 0.8;

        this.init();
    }

    init() {
        this.applyBackground();
        this.createBoard();
        this.createKeyboard();
        this.setupListeners();
        this.initMusicPlayer();
    }

    applyBackground() {
        if (this.backgroundType === 'classic') {
            document.body.classList.add('classic-bg');
            if (this.bgVideo) this.bgVideo.classList.add('hidden-video');
            if (this.appContainer) this.appContainer.classList.add('classic-mode');
        } else {
            document.body.classList.remove('classic-bg');
            if (this.bgVideo) this.bgVideo.classList.remove('hidden-video');
            if (this.appContainer) this.appContainer.classList.remove('classic-mode');
        }
    }

    resetGame() {
        this.gameId++;
        this.currentRow = 0;
        this.currentTile = 0;
        this.gameState = "playing";
        this.guesses = Array(6).fill("");
        if (this.messageContainer) {
            this.messageContainer.classList.remove('show');
            this.messageContainer.textContent = '';
        }
        this.setTargetWord();
        this.createBoard();
        this.createKeyboard();
        this.applyBackground();
    }

    setTargetWord() {
        if (this.mode === 'daily') {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 0);
            const diff = now - start;
            const oneDay = 1000 * 60 * 60 * 24;
            const dayOfYear = Math.floor(diff / oneDay);
            const index = dayOfYear % DICIONARIO.length;
            this.targetWord = DICIONARIO[index];
            console.log("Palabra Diaria Seleccionada");
        } else {
            const index = Math.floor(Math.random() * DICIONARIO.length);
            this.targetWord = DICIONARIO[index];
            console.log("Palabra Infinita Seleccionada");
        }
    }

    createBoard() {
        if (!this.board) return;
        this.board.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('div');
            row.className = 'row';
            for (let j = 0; j < 5; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.id = `row-${i}-tile-${j}`;
                row.appendChild(tile);
            }
            this.board.appendChild(row);
        }
    }

    createKeyboard() {
        if (!this.keyboard) return;
        const rows = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
            ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL']
        ];

        this.keyboard.innerHTML = '';
        rows.forEach(rowData => {
            const rowElement = document.createElement('div');
            rowElement.className = 'keyboard-row';
            rowData.forEach(key => {
                const keyElement = document.createElement('button');
                keyElement.textContent = key;
                keyElement.className = 'key' + (key === 'ENTER' || key === 'DEL' ? ' wide' : '');
                keyElement.setAttribute('data-key', key);
                keyElement.addEventListener('click', () => this.handleKeyPress(key));
                rowElement.appendChild(keyElement);
            });
            this.keyboard.appendChild(rowElement);
        });
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            const key = e.key.toUpperCase();

            if (key === 'ENTER' || key === 'BACKSPACE') {
                e.preventDefault(); // Prevent focused buttons from being triggered
            }

            if (key === 'ENTER') this.handleKeyPress('ENTER');
            else if (key === 'BACKSPACE') this.handleKeyPress('DEL');
            else if (/^[A-ZÑ]$/.test(key)) this.handleKeyPress(key);
        });

        // Prevention: Blur any focused button immediately after click
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                setTimeout(() => {
                    if (document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                    }
                }, 10);
            }
        });

        if (this.dailyBtn) {
            this.dailyBtn.addEventListener('click', () => {
                if (this.mode === 'daily') return;
                this.mode = 'daily';
                this.dailyBtn.classList.add('active');
                this.infiniteBtn.classList.remove('active');
                this.resetGame();
            });
        }

        if (this.infiniteBtn) {
            this.infiniteBtn.addEventListener('click', () => {
                if (this.mode === 'infinite') return;
                this.mode = 'infinite';
                this.infiniteBtn.classList.add('active');
                this.dailyBtn.classList.remove('active');
                this.resetGame();
            });
        }

        if (this.helpBtn) this.helpBtn.addEventListener('click', () => this.showHelp());
        if (this.statsBtn) this.statsBtn.addEventListener('click', () => this.showStats());
        if (this.bgToggleBtn) {
            this.bgToggleBtn.addEventListener('click', () => {
                this.backgroundType = this.backgroundType === 'video' ? 'classic' : 'video';
                localStorage.setItem('bg-type', this.backgroundType);
                this.applyBackground();
            });
        }
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => this.showSettings());
        }
        if (this.closeModalBtn) this.closeModalBtn.addEventListener('click', () => this.closeModal());
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.closeModal();
            });
        }
    }

    initMusicPlayer() {
        if (!this.bgMusic) return;

        this.playPauseBtn.addEventListener('click', () => {
            if (!this.audioCtx) this.initAudioContext();
            this.toggleMusic();
        });

        this.bgMusic.addEventListener('timeupdate', () => {
            const percent = (this.bgMusic.currentTime / this.bgMusic.duration) * 100;
            this.progressBar.style.width = `${percent}%`;
            this.currentTimeEl.textContent = this.formatTime(this.bgMusic.currentTime);
        });

        this.bgMusic.addEventListener('loadedmetadata', () => {
            this.durationEl.textContent = this.formatTime(this.bgMusic.duration);
        });

        // Progress control (Click + Drag)
        this.progressWrapper.addEventListener('mousedown', (e) => {
            this.isDraggingProgress = true;
            this.updatePlayerProgress(e);
        });

        // Volume control (Click + Drag)
        this.volumeWrapper.addEventListener('mousedown', (e) => {
            this.isDraggingVolume = true;
            this.updatePlayerVolume(e);
        });

        // Global mouse movement for dragging
        window.addEventListener('mousemove', (e) => {
            if (this.isDraggingProgress) this.updatePlayerProgress(e);
            if (this.isDraggingVolume) this.updatePlayerVolume(e);
        });

        window.addEventListener('mouseup', () => {
            this.isDraggingProgress = false;
            this.isDraggingVolume = false;
        });

        this.prevBtn.addEventListener('click', () => {
            this.bgMusic.currentTime = 0;
        });

        this.nextBtn.addEventListener('click', () => {
            this.bgMusic.currentTime = 0;
        });
    }

    updatePlayerProgress(e) {
        const rect = this.progressWrapper.getBoundingClientRect();
        let pos = (e.clientX - rect.left) / rect.width;
        pos = Math.max(0, Math.min(1, pos));
        this.bgMusic.currentTime = pos * this.bgMusic.duration;
    }

    updatePlayerVolume(e) {
        const rect = this.volumeWrapper.getBoundingClientRect();
        let pos = (e.clientX - rect.left) / rect.width;
        pos = Math.max(0, Math.min(1, pos));
        this.bgMusic.volume = pos;
        this.volumeBar.style.width = `${pos * 100}%`;
    }

    toggleMusic() {
        if (this.bgMusic.paused) {
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const playPromise = this.bgMusic.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    this.playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'; // Pause icon
                    this.musicPlayer.classList.add('playing');
                }).catch(e => {
                    console.warn("Playback failed:", e);
                    this.musicPlayer.classList.remove('playing');
                });
            } else {
                // Support for older browsers where play() doesn't return a promise
                this.playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
                this.musicPlayer.classList.add('playing');
            }
        } else {
            this.bgMusic.pause();
            this.playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>'; // Play icon
            this.musicPlayer.classList.remove('playing');
        }
    }

    initAudioContext() {
        if (this.audioCtx) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) throw new Error("AudioContext not supported");

            // Local file mode check (CORS restriction)
            if (window.location.protocol === 'file:') {
                throw new Error("Local file restriction prevents AudioContext source mapping");
            }

            this.audioCtx = new AudioContext();
            this.analyser = this.audioCtx.createAnalyser();

            this.source = this.audioCtx.createMediaElementSource(this.bgMusic);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioCtx.destination);

            this.analyser.fftSize = 64;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            if (this.visualizer) {
                this.visualizer.innerHTML = '';
                for (let i = 0; i < bufferLength; i++) {
                    const bar = document.createElement('div');
                    bar.className = 'vis-bar';
                    this.visualizer.appendChild(bar);
                }
            }

            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            this.animateVisualizer();
        } catch (e) {
            console.warn("AudioContext initialization failed or blocked. Using fallback visualizer.", e);
            this.setupVisualizerFallback();
        }
    }

    setupVisualizerFallback() {
        if (!this.visualizer) return;
        // Create 16 simple bars for the fallback
        this.visualizer.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const bar = document.createElement('div');
            bar.className = 'vis-bar';
            this.visualizer.appendChild(bar);
        }
        this.animateVisualizerFallback();
    }

    animateVisualizerFallback() {
        requestAnimationFrame(() => this.animateVisualizerFallback());
        const bars = this.visualizer.querySelectorAll('.vis-bar');

        bars.forEach(bar => {
            let barHeight = 5;
            if (!this.bgMusic.paused) {
                barHeight = 5 + Math.random() * 40;
            }
            bar.style.height = `${barHeight}%`;
        });
    }

    animateVisualizer() {
        if (!this.analyser) return;

        try {
            requestAnimationFrame(() => this.animateVisualizer());

            if (!this.analyser || !this.visualizer) return;

            this.analyser.getByteFrequencyData(this.dataArray);
            const bars = this.visualizer.querySelectorAll('.vis-bar');

            for (let i = 0; i < bars.length; i++) {
                let barHeight = (this.dataArray[i] / 255) * 100;
                if (!this.bgMusic.paused && barHeight < 5) barHeight = 5 + Math.random() * 5;
                if (this.bgMusic.paused) barHeight = 5;

                bars[i].style.height = `${barHeight}%`;
            }
        } catch (e) {
            console.error("Visualizer animation failed", e);
        }
    }

    formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    handleKeyPress(key) {
        if (this.gameState !== 'playing') return;

        if (key === 'DEL') {
            if (this.currentTile > 0) {
                this.currentTile--;
                const tile = document.getElementById(`row-${this.currentRow}-tile-${this.currentTile}`);
                tile.textContent = '';
                tile.classList.remove('pop');
                this.guesses[this.currentRow] = this.guesses[this.currentRow].slice(0, -1);
            }
        } else if (key === 'ENTER') {
            if (this.guesses[this.currentRow].length === 5) {
                this.submitGuess();
            } else {
                this.showMessage('Faltan letras');
                this.shakeRow();
            }
        } else if (this.currentTile < 5) {
            const tile = document.getElementById(`row-${this.currentRow}-tile-${this.currentTile}`);
            if (tile) {
                // IMPORTANT: Remove and re-add for animation to trigger
                tile.classList.remove('pop');
                void tile.offsetWidth; // Force reflow
                tile.classList.add('pop');

                tile.textContent = key;
                this.guesses[this.currentRow] += key;
                this.currentTile++;
            }
        }
    }

    async submitGuess() {
        if (this.gameState !== 'playing') return;
        const currentId = this.gameId;
        const guess = this.guesses[this.currentRow];
        this.gameState = 'checking';
        const row = this.board.children[this.currentRow];
        const result = this.calculateResult(guess);

        for (let i = 0; i < 5; i++) {
            if (this.gameId !== currentId) return; // Stop if game was reset

            const tile = row.children[i];
            tile.classList.add('reveal');
            tile.style.animationDelay = `${i * 100}ms`;

            // Wait for half the animation to change color
            setTimeout(() => {
                if (this.gameId !== currentId) return;
                tile.classList.add(result[i]);
                this.updateKeyColor(guess[i], result[i]);
            }, 250 + (i * 100));

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Wait for last tile animation to finish fully
        await new Promise(resolve => setTimeout(resolve, 500));
        if (this.gameId !== currentId) return;

        if (guess === this.targetWord) {
            this.gameState = 'won';
            this.updateStats(true);
            setTimeout(() => {
                this.showMessage('¡Increíble!');
                this.celebrate();
                this.showStats();
            }, 500);
        } else if (this.currentRow === 5) {
            this.gameState = 'lost';
            this.updateStats(false);
            setTimeout(() => {
                this.showMessage(this.targetWord);
                this.showStats();
            }, 500);
        } else {
            this.gameState = 'playing';
            this.currentRow++;
            this.currentTile = 0;
        }
    }

    calculateResult(guess) {
        const result = Array(5).fill('absent');
        const targetArr = this.targetWord.split('');
        const guessArr = guess.split('');

        for (let i = 0; i < 5; i++) {
            if (guessArr[i] === targetArr[i]) {
                result[i] = 'correct';
                targetArr[i] = null;
                guessArr[i] = null;
            }
        }

        for (let i = 0; i < 5; i++) {
            if (guessArr[i] && targetArr.includes(guessArr[i])) {
                result[i] = 'present';
                targetArr[targetArr.indexOf(guessArr[i])] = null;
            }
        }
        return result;
    }

    updateKeyColor(letter, status) {
        const keyElement = document.querySelector(`.key[data-key="${letter}"]`);
        if (!keyElement) return;

        if (status === 'correct') {
            keyElement.className = 'key correct';
        } else if (status === 'present' && !keyElement.classList.contains('correct')) {
            keyElement.className = 'key present';
        } else if (status === 'absent' && !keyElement.classList.contains('correct') && !keyElement.classList.contains('present')) {
            keyElement.className = 'key absent';
        }
    }

    showMessage(msg) {
        if (!this.messageContainer) return;
        this.messageContainer.textContent = msg;
        this.messageContainer.classList.add('show');
        setTimeout(() => this.messageContainer.classList.remove('show'), 2000);
    }

    shakeRow() {
        const row = this.board.children[this.currentRow];
        if (row) {
            row.classList.add('shake');
            setTimeout(() => row.classList.remove('shake'), 400);
        }
    }

    celebrate() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#58a6ff', '#3fb950', '#d29922']
            });
        }
    }

    updateStats(won) {
        this.stats.gamesPlayed++;
        if (won) {
            this.stats.gamesWon++;
            this.stats.currentStreak++;
            this.stats.guesses[this.currentRow + 1]++;
            if (this.stats.currentStreak > this.stats.maxStreak) {
                this.stats.maxStreak = this.stats.currentStreak;
            }
        } else {
            this.stats.currentStreak = 0;
        }
        localStorage.setItem('wordle-stats', JSON.stringify(this.stats));
    }

    showHelp() {
        this.modalContent.innerHTML = `
            <h2>Cómo jugar</h2>
            <p>Adivina la palabra oculta en seis intentos.</p>
            <div class="row" style="margin: 1rem 0;"><div class="tile correct">G</div><div class="tile">A</div><div class="tile">T</div><div class="tile">O</div><div class="tile">S</div></div>
            <p>La letra <b>G</b> está en la posición correcta.</p>
            <div class="row" style="margin: 1rem 0;"><div class="tile">L</div><div class="tile present">I</div><div class="tile">B</div><div class="tile">R</div><div class="tile">O</div></div>
            <p>La letra <b>I</b> está en la palabra pero en otra posición.</p>
        `;
        this.openModal();
    }

    showStats() {
        const winPct = this.stats.gamesPlayed ? Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100) : 0;
        this.modalContent.innerHTML = `
            <h2>Estadísticas</h2>
            <div class="stats-grid">
                <div class="stat-item"><span>${this.stats.gamesPlayed}</span>Jugadas</div>
                <div class="stat-item"><span>${winPct}%</span>Victorias</div>
                <div class="stat-item"><span>${this.stats.currentStreak}</span>Racha</div>
                <div class="stat-item"><span>${this.stats.maxStreak}</span>Máxima</div>
            </div>
            ${this.gameState !== 'playing' ? `<button class="mode-btn active" style="margin-top: 1rem; width: 100%;" onclick="game.resetGame(); game.closeModal();">Nueva Partida</button>` : ''}
        `;
        this.openModal();
    }

    showSettings() {
        this.modalContent.innerHTML = `
            <h2>Ajustes</h2>
            <div class="settings-list" style="display: flex; flex-direction: column; gap: 1rem;">
                <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Sonido</span>
                    <button class="mode-btn active">ON</button>
                </div>
                <div class="setting-item" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Ayuda visual</span>
                    <button class="mode-btn">OFF</button>
                </div>
                <div class="setting-item" style="margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
                    <span>Créditos</span>
                    <p style="font-size: 0.8rem; color: var(--text-secondary);">La Palabra de Gallumbo © 2026</p>
                </div>
            </div>
        `;
        this.openModal();
    }

    openModal() {
        if (this.overlay) this.overlay.classList.remove('hidden');
    }

    closeModal() {
        if (this.overlay) this.overlay.classList.add('hidden');
    }
}

let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new WordleGame();
});
