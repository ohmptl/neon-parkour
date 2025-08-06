class ParkourGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Game state
        this.gameState = 'nameEntry'; // nameEntry, menu, playing, paused, gameOver
        this.currentLevel = 1;
        this.score = 0;
        this.startTime = 0;
        this.gameTime = 0;
        this.playerName = '';
        this.leaderboard = this.loadLeaderboard();
        
        // Player properties
        this.player = {
            x: 100,
            y: 400,
            width: 20,
            height: 30,
            vx: 0,
            vy: 0,
            speed: 5,
            jumpPower: 15,
            onGround: false,
            onWall: false,
            wallSide: 0, // -1 for left wall, 1 for right wall
            canWallJump: false,
            sliding: false,
            dashing: false,
            dashCooldown: 0,
            color: '#00ffff',
            trail: []
        };
        
        // Input handling
        this.keys = {};
        this.lastKeyTime = {};
        this.setupEventListeners();
        
        // Particles and effects
        this.particles = [];
        this.platforms = [];
        this.hazards = [];
        this.collectibles = [];
        this.jumpPads = [];
        this.portals = [];
        this.exit = null;
        
        // Camera
        this.camera = { x: 0, y: 0 };
        
        // Level generation
        this.generateLevel(this.currentLevel);
        
        // Start game loop
        this.gameLoop();
    }
    
    setupCanvas() {
        this.canvas.width = Math.min(1200, window.innerWidth - 40);
        this.canvas.height = Math.min(800, window.innerHeight - 40);
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleKeyPress(e.code);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // UI events
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('submitNameBtn').addEventListener('click', () => {
            this.submitName();
        });
        
        document.getElementById('nextLevelBtn').addEventListener('click', () => {
            this.nextLevel();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartLevel();
        });
        
        document.getElementById('mainMenuBtn').addEventListener('click', () => {
            this.returnToMenu();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
    }
    
    handleKeyPress(code) {
        const now = Date.now();
        
        // Double-tap detection for dash
        if ((code === 'KeyA' || code === 'ArrowLeft' || code === 'KeyD' || code === 'ArrowRight') && 
            this.gameState === 'playing') {
            if (this.lastKeyTime[code] && now - this.lastKeyTime[code] < 300) {
                this.dash(code === 'KeyA' || code === 'ArrowLeft' ? -1 : 1);
            }
            this.lastKeyTime[code] = now;
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.startTime = Date.now();
        document.getElementById('instructions').style.display = 'none';
        this.resetPlayerPosition();
    }
    
    submitName() {
        const nameInput = document.getElementById('playerNameInput');
        this.playerName = nameInput.value.trim() || 'Anonymous';
        this.gameState = 'menu';
        document.getElementById('nameEntry').style.display = 'none';
        document.getElementById('instructions').style.display = 'block';
        this.displayLeaderboard();
    }
    
    returnToMenu() {
        this.gameState = 'menu';
        this.currentLevel = 1;
        this.score = 0;
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('instructions').style.display = 'block';
        this.generateLevel(this.currentLevel);
        this.resetPlayerPosition();
        this.displayLeaderboard();
    }
    
    loadLeaderboard() {
        const saved = localStorage.getItem('neonParkourLeaderboard');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveLeaderboard() {
        localStorage.setItem('neonParkourLeaderboard', JSON.stringify(this.leaderboard));
    }
    
    updateLeaderboard() {
        const entry = {
            name: this.playerName,
            level: this.currentLevel,
            score: this.score,
            time: this.gameTime
        };
        
        this.leaderboard.push(entry);
        this.leaderboard.sort((a, b) => {
            if (a.level !== b.level) return b.level - a.level;
            if (a.score !== b.score) return b.score - a.score;
            return a.time - b.time;
        });
        
        // Keep only top 5
        this.leaderboard = this.leaderboard.slice(0, 5);
        this.saveLeaderboard();
    }
    
    displayLeaderboard() {
        const leaderboardDiv = document.getElementById('leaderboardList');
        if (this.leaderboard.length === 0) {
            leaderboardDiv.innerHTML = '<p>No scores yet!</p>';
            return;
        }
        
        let html = '<h3>🏆 TOP 5 LEADERBOARD</h3>';
        this.leaderboard.forEach((entry, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
            html += `<div class="leaderboard-entry">
                ${medal} ${entry.name} - Level ${entry.level} - ${entry.score} pts (${entry.time.toFixed(2)}s)
            </div>`;
        });
        leaderboardDiv.innerHTML = html;
    }
    
    nextLevel() {
        this.currentLevel++;
        this.generateLevel(this.currentLevel);
        this.gameState = 'playing';
        this.startTime = Date.now();
        document.getElementById('gameOver').style.display = 'none';
        this.resetPlayerPosition();
    }
    
    restartLevel() {
        this.generateLevel(this.currentLevel);
        this.gameState = 'playing';
        this.startTime = Date.now();
        document.getElementById('gameOver').style.display = 'none';
        this.resetPlayerPosition();
    }
    
    resetPlayerPosition() {
        this.player.x = 100;
        this.player.y = 400;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.onGround = false;
        this.player.onWall = false;
        this.player.sliding = false;
        this.player.dashing = false;
    }
    
    generateLevel(level) {
        this.platforms = [];
        this.hazards = [];
        this.collectibles = [];
        this.jumpPads = [];
        this.portals = [];
        this.particles = [];
        
        // Basic ground platform
        this.platforms.push({
            x: 0, y: 550, width: 300, height: 50,
            color: '#333', type: 'ground'
        });
        
        // Generate platforms based on level
        const complexity = Math.min(level, 10);
        const platformCount = 8 + complexity * 2;
        
        for (let i = 0; i < platformCount; i++) {
            const x = 200 + i * (150 + Math.random() * 100);
            const y = 200 + Math.random() * 300;
            const width = 80 + Math.random() * 120;
            const height = 20 + Math.random() * 30;
            
            this.platforms.push({
                x, y, width, height,
                color: `hsl(${180 + Math.random() * 60}, 70%, 40%)`,
                type: 'normal'
            });
        }
        
        // Add wall platforms for wall-jumping
        for (let i = 0; i < complexity; i++) {
            const x = 400 + i * 300;
            const y = 150 + Math.random() * 200;
            
            this.platforms.push({
                x, y, width: 20, height: 200,
                color: '#555', type: 'wall'
            });
        }
        
        // Add moving platforms
        for (let i = 0; i < Math.floor(complexity / 2); i++) {
            const x = 300 + i * 400;
            const y = 250 + Math.random() * 200;
            
            this.platforms.push({
                x, y, width: 100, height: 20,
                color: '#ff6b6b', type: 'moving',
                moveSpeed: 1 + Math.random() * 2,
                moveDirection: Math.random() > 0.5 ? 1 : -1,
                originalX: x,
                moveRange: 100
            });
        }
        
        // Add hazards
        for (let i = 0; i < complexity; i++) {
            const x = 350 + i * 200 + Math.random() * 100;
            const y = 400 + Math.random() * 100;
            
            this.hazards.push({
                x, y, width: 30, height: 30,
                color: '#ff4757', type: 'spike',
                damage: 1
            });
        }
        
        // Add collectibles
        for (let i = 0; i < complexity + 3; i++) {
            const x = 200 + i * 180 + Math.random() * 100;
            const y = 100 + Math.random() * 300;
            
            this.collectibles.push({
                x, y, width: 15, height: 15,
                color: '#feca57', type: 'coin',
                collected: false,
                value: 100,
                rotation: 0
            });
        }
        
        // Add jump pads
        for (let i = 0; i < Math.floor(complexity / 2) + 1; i++) {
            const x = 400 + i * 300 + Math.random() * 100;
            const y = 500;
            
            this.jumpPads.push({
                x, y, width: 60, height: 20,
                color: '#48dbfb', type: 'jumpPad',
                power: 20 + Math.random() * 10,
                animationOffset: Math.random() * Math.PI * 2
            });
        }
        
        // Add portals (pairs)
        if (level > 2) {
            for (let i = 0; i < Math.floor(complexity / 3); i++) {
                const portal1 = {
                    x: 300 + i * 400,
                    y: 200 + Math.random() * 200,
                    width: 30, height: 50,
                    color: '#ff9ff3', type: 'portal',
                    id: i, animationOffset: 0,
                    targetId: i + 1000 // Will link to corresponding portal
                };
                
                const portal2 = {
                    x: 600 + i * 400,
                    y: 200 + Math.random() * 200,
                    width: 30, height: 50,
                    color: '#54a0ff', type: 'portal',
                    id: i + 1000, animationOffset: Math.PI,
                    targetId: i // Link back to first portal
                };
                
                this.portals.push(portal1, portal2);
            }
        }
        
        // Set exit portal
        const lastPlatform = this.platforms[this.platforms.length - 1];
        this.exit = {
            x: lastPlatform.x + 200,
            y: lastPlatform.y - 60,
            width: 40,
            height: 60,
            color: '#00ff00'
        };
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.gameTime = (Date.now() - this.startTime) / 1000;
        
        // Update player
        this.updatePlayer();
        
        // Update moving platforms
        this.updateMovingPlatforms();
        
        // Update particles
        this.updateParticles();
        
        // Update camera
        this.updateCamera();
        
        // Check collectibles
        this.checkCollectibles();
        
        // Check jump pads
        this.checkJumpPads();
        
        // Check portals
        this.checkPortals();
        
        // Check exit
        this.checkExit();
        
        // Update UI
        this.updateUI();
    }
    
    updatePlayer() {
        const player = this.player;
        
        // Handle input
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            if (!player.sliding) {
                player.vx = Math.max(player.vx - 0.8, -player.speed);
            }
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            if (!player.sliding) {
                player.vx = Math.min(player.vx + 0.8, player.speed);
            }
        }
        
        // Jumping
        if ((this.keys['KeyW'] || this.keys['ArrowUp']) && !player.jumping) {
            if (player.onGround) {
                player.vy = -player.jumpPower;
                player.onGround = false;
                player.jumping = true;
                this.createJumpParticles();
            } else if (player.onWall && player.canWallJump) {
                player.vy = -player.jumpPower * 0.8;
                player.vx = player.wallSide * player.speed * 1.5;
                player.onWall = false;
                player.canWallJump = false;
                this.createWallJumpParticles();
            }
        }
        
        // Sliding
        if ((this.keys['KeyS'] || this.keys['ArrowDown']) && player.onGround && Math.abs(player.vx) > 2) {
            player.sliding = true;
            player.height = 15;
        } else {
            player.sliding = false;
            player.height = 30;
        }
        
        // Release jump key
        if (!(this.keys['KeyW'] || this.keys['ArrowUp'])) {
            player.jumping = false;
        }
        
        // Apply friction
        if (player.onGround && !player.sliding) {
            player.vx *= 0.85;
        } else {
            player.vx *= 0.98;
        }
        
        // Apply gravity
        if (!player.onWall) {
            player.vy += 0.7;
        }
        
        // Terminal velocity
        player.vy = Math.min(player.vy, 15);
        
        // Update position
        player.x += player.vx;
        player.y += player.vy;
        
        // Wall sliding
        if (player.onWall && player.vy > 0) {
            player.vy *= 0.8; // Slower fall on walls
        }
        
        // Dash cooldown
        if (player.dashCooldown > 0) {
            player.dashCooldown--;
        }
        
        // Check collisions
        this.checkPlatformCollisions();
        this.checkHazardCollisions();
        
        // Add trail effect
        this.addPlayerTrail();
        
        // Keep player in bounds
        if (player.y > this.canvas.height + 100) {
            this.resetPlayerPosition();
        }
    }
    
    dash(direction) {
        if (this.player.dashCooldown <= 0) {
            this.player.vx = direction * this.player.speed * 2.5;
            this.player.dashCooldown = 60; // 1 second at 60fps
            this.player.dashing = true;
            this.createDashParticles();
            
            setTimeout(() => {
                this.player.dashing = false;
            }, 200);
        }
    }
    
    checkPlatformCollisions() {
        const player = this.player;
        player.onGround = false;
        player.onWall = false;
        
        for (let platform of this.platforms) {
            // Check collision
            if (player.x < platform.x + platform.width &&
                player.x + player.width > platform.x &&
                player.y < platform.y + platform.height &&
                player.y + player.height > platform.y) {
                
                // Determine collision side
                const overlapX = Math.min(player.x + player.width - platform.x, 
                                        platform.x + platform.width - player.x);
                const overlapY = Math.min(player.y + player.height - platform.y,
                                        platform.y + platform.height - player.y);
                
                if (overlapX < overlapY) {
                    // Horizontal collision (wall)
                    if (player.x < platform.x) {
                        player.x = platform.x - player.width;
                        player.wallSide = 1;
                    } else {
                        player.x = platform.x + platform.width;
                        player.wallSide = -1;
                    }
                    
                    if (Math.abs(player.vy) < 2) {
                        player.onWall = true;
                        player.canWallJump = true;
                        player.vx = 0;
                    }
                } else {
                    // Vertical collision
                    if (player.y < platform.y) {
                        // Landing on top
                        player.y = platform.y - player.height;
                        player.vy = 0;
                        player.onGround = true;
                        if (Math.abs(player.vx) > 3) {
                            this.createLandingParticles();
                        }
                    } else {
                        // Hitting from below
                        player.y = platform.y + platform.height;
                        player.vy = 0;
                    }
                }
            }
        }
    }
    
    checkHazardCollisions() {
        const player = this.player;
        
        for (let hazard of this.hazards) {
            if (player.x < hazard.x + hazard.width &&
                player.x + player.width > hazard.x &&
                player.y < hazard.y + hazard.height &&
                player.y + player.height > hazard.y) {
                
                // Hit hazard - reset player
                this.createHitParticles();
                this.resetPlayerPosition();
                break;
            }
        }
    }
    
    checkCollectibles() {
        const player = this.player;
        
        for (let collectible of this.collectibles) {
            if (!collectible.collected &&
                player.x < collectible.x + collectible.width &&
                player.x + player.width > collectible.x &&
                player.y < collectible.y + collectible.height &&
                player.y + player.height > collectible.y) {
                
                collectible.collected = true;
                this.score += collectible.value;
                this.createCollectParticles(collectible.x, collectible.y);
            }
        }
    }
    
    checkJumpPads() {
        const player = this.player;
        
        for (let jumpPad of this.jumpPads) {
            if (player.x < jumpPad.x + jumpPad.width &&
                player.x + player.width > jumpPad.x &&
                player.y < jumpPad.y + jumpPad.height &&
                player.y + player.height > jumpPad.y &&
                player.vy >= 0) { // Only trigger when falling/landing
                
                player.vy = -jumpPad.power;
                player.onGround = false;
                this.createJumpPadParticles(jumpPad.x + jumpPad.width / 2, jumpPad.y);
                this.score += 50; // Bonus points for using jump pad
            }
        }
    }
    
    checkPortals() {
        const player = this.player;
        
        for (let portal of this.portals) {
            if (player.x < portal.x + portal.width &&
                player.x + player.width > portal.x &&
                player.y < portal.y + portal.height &&
                player.y + player.height > portal.y) {
                
                // Find the target portal
                const targetPortal = this.portals.find(p => p.id === portal.targetId);
                if (targetPortal && !player.teleporting) {
                    player.x = targetPortal.x + targetPortal.width / 2 - player.width / 2;
                    player.y = targetPortal.y + targetPortal.height / 2 - player.height / 2;
                    player.teleporting = true;
                    this.createPortalParticles(portal.x + portal.width / 2, portal.y + portal.height / 2);
                    this.createPortalParticles(targetPortal.x + targetPortal.width / 2, targetPortal.y + targetPortal.height / 2);
                    this.score += 200; // Bonus points for using portal
                    
                    // Prevent immediate re-teleportation
                    setTimeout(() => {
                        player.teleporting = false;
                    }, 1000);
                }
                break;
            }
        }
    }
    
    checkExit() {
        const player = this.player;
        
        if (this.exit &&
            player.x < this.exit.x + this.exit.width &&
            player.x + player.width > this.exit.x &&
            player.y < this.exit.y + this.exit.height &&
            player.y + player.height > this.exit.y) {
            
            // Level complete
            this.completeLevel();
        }
    }
    
    completeLevel() {
        this.gameState = 'gameOver';
        const timeBonus = Math.max(0, 1000 - Math.floor(this.gameTime * 10));
        this.score += timeBonus;
        
        // Update leaderboard
        this.updateLeaderboard();
        
        document.getElementById('finalTime').textContent = this.gameTime.toFixed(2);
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').style.display = 'block';
    }
    
    updateMovingPlatforms() {
        for (let platform of this.platforms) {
            if (platform.type === 'moving') {
                platform.x += platform.moveSpeed * platform.moveDirection;
                
                if (platform.x <= platform.originalX - platform.moveRange ||
                    platform.x >= platform.originalX + platform.moveRange) {
                    platform.moveDirection *= -1;
                }
            }
        }
    }
    
    updateCamera() {
        const targetX = this.player.x - this.canvas.width / 2;
        const targetY = this.player.y - this.canvas.height / 2;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += particle.gravity || 0.1;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    addPlayerTrail() {
        const player = this.player;
        
        if (Math.abs(player.vx) > 2 || Math.abs(player.vy) > 2) {
            player.trail.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                alpha: 1
            });
            
            if (player.trail.length > 10) {
                player.trail.shift();
            }
        }
        
        // Fade trail
        for (let trail of player.trail) {
            trail.alpha *= 0.9;
        }
        
        player.trail = player.trail.filter(trail => trail.alpha > 0.1);
    }
    
    createJumpParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 2,
                size: 2 + Math.random() * 3,
                color: '#00ffff',
                life: 30,
                maxLife: 30,
                alpha: 1
            });
        }
    }
    
    createWallJumpParticles() {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: this.player.x + (this.player.wallSide > 0 ? 0 : this.player.width),
                y: this.player.y + Math.random() * this.player.height,
                vx: -this.player.wallSide * (2 + Math.random() * 3),
                vy: (Math.random() - 0.5) * 4,
                size: 2 + Math.random() * 3,
                color: '#ff6b6b',
                life: 40,
                maxLife: 40,
                alpha: 1
            });
        }
    }
    
    createLandingParticles() {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: this.player.x + Math.random() * this.player.width,
                y: this.player.y + this.player.height,
                vx: (Math.random() - 0.5) * 6,
                vy: -Math.random() * 2,
                size: 1 + Math.random() * 2,
                color: '#888',
                life: 20,
                maxLife: 20,
                alpha: 1
            });
        }
    }
    
    createDashParticles() {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: 3 + Math.random() * 4,
                color: '#ffff00',
                life: 25,
                maxLife: 25,
                alpha: 1
            });
        }
    }
    
    createHitParticles() {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: 2 + Math.random() * 4,
                color: '#ff4757',
                life: 30,
                maxLife: 30,
                alpha: 1
            });
        }
    }
    
    createCollectParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: 2 + Math.random() * 3,
                color: '#feca57',
                life: 35,
                maxLife: 35,
                alpha: 1
            });
        }
    }
    
    createJumpPadParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 8 - 5,
                size: 3 + Math.random() * 4,
                color: '#48dbfb',
                life: 40,
                maxLife: 40,
                alpha: 1
            });
        }
    }
    
    createPortalParticles(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                size: 2 + Math.random() * 3,
                color: Math.random() > 0.5 ? '#ff9ff3' : '#54a0ff',
                life: 50,
                maxLife: 50,
                alpha: 1
            });
        }
    }
    
    updateUI() {
        document.getElementById('level').textContent = this.currentLevel;
        document.getElementById('timer').textContent = this.gameTime.toFixed(2);
        document.getElementById('score').textContent = this.score;
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Render platforms
        this.renderPlatforms();
        
        // Render hazards
        this.renderHazards();
        
        // Render collectibles
        this.renderCollectibles();
        
        // Render jump pads
        this.renderJumpPads();
        
        // Render portals
        this.renderPortals();
        
        // Render exit
        this.renderExit();
        
        // Render player trail
        this.renderPlayerTrail();
        
        // Render player
        this.renderPlayer();
        
        // Render particles
        this.renderParticles();
        
        // Restore context
        this.ctx.restore();
        
        // Render UI elements that shouldn't move with camera
        this.renderUI();
    }
    
    renderPlatforms() {
        for (let platform of this.platforms) {
            this.ctx.fillStyle = platform.color;
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // Add glow effect for moving platforms
            if (platform.type === 'moving') {
                this.ctx.shadowColor = platform.color;
                this.ctx.shadowBlur = 10;
                this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                this.ctx.shadowBlur = 0;
            }
        }
    }
    
    renderHazards() {
        for (let hazard of this.hazards) {
            this.ctx.fillStyle = hazard.color;
            this.ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
            
            // Add danger glow
            this.ctx.shadowColor = hazard.color;
            this.ctx.shadowBlur = 15;
            this.ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
            this.ctx.shadowBlur = 0;
        }
    }
    
    renderCollectibles() {
        for (let collectible of this.collectibles) {
            if (!collectible.collected) {
                collectible.rotation += 0.1;
                
                this.ctx.save();
                this.ctx.translate(collectible.x + collectible.width / 2, 
                                 collectible.y + collectible.height / 2);
                this.ctx.rotate(collectible.rotation);
                
                this.ctx.fillStyle = collectible.color;
                this.ctx.fillRect(-collectible.width / 2, -collectible.height / 2, 
                                collectible.width, collectible.height);
                
                // Add glow
                this.ctx.shadowColor = collectible.color;
                this.ctx.shadowBlur = 10;
                this.ctx.fillRect(-collectible.width / 2, -collectible.height / 2, 
                                collectible.width, collectible.height);
                this.ctx.shadowBlur = 0;
                
                this.ctx.restore();
            }
        }
    }
    
    renderJumpPads() {
        const time = Date.now() * 0.01;
        
        for (let jumpPad of this.jumpPads) {
            const bounce = Math.sin(time + jumpPad.animationOffset) * 3;
            
            // Main jump pad
            this.ctx.fillStyle = jumpPad.color;
            this.ctx.shadowColor = jumpPad.color;
            this.ctx.shadowBlur = 15;
            this.ctx.fillRect(jumpPad.x, jumpPad.y + bounce, jumpPad.width, jumpPad.height);
            this.ctx.shadowBlur = 0;
            
            // Arrow indicator
            this.ctx.fillStyle = '#fff';
            const arrowX = jumpPad.x + jumpPad.width / 2;
            const arrowY = jumpPad.y + jumpPad.height / 2 + bounce;
            
            this.ctx.beginPath();
            this.ctx.moveTo(arrowX, arrowY - 8);
            this.ctx.lineTo(arrowX - 6, arrowY + 2);
            this.ctx.lineTo(arrowX + 6, arrowY + 2);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    renderPortals() {
        const time = Date.now() * 0.005;
        
        for (let portal of this.portals) {
            portal.animationOffset += 0.1;
            
            // Portal swirl effect
            this.ctx.save();
            this.ctx.translate(portal.x + portal.width / 2, portal.y + portal.height / 2);
            
            // Main portal body
            this.ctx.fillStyle = portal.color;
            this.ctx.shadowColor = portal.color;
            this.ctx.shadowBlur = 20;
            this.ctx.fillRect(-portal.width / 2, -portal.height / 2, portal.width, portal.height);
            this.ctx.shadowBlur = 0;
            
            // Swirling particles
            for (let i = 0; i < 8; i++) {
                const angle = (time + portal.animationOffset + i * Math.PI / 4) * 2;
                const radius = 15 + Math.sin(time + i) * 5;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                this.ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(time + i) * 0.3})`;
                this.ctx.beginPath();
                this.ctx.arc(x, y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }
    }
    
    renderExit() {
        if (this.exit) {
            // Animate exit portal
            const time = Date.now() * 0.005;
            const glow = Math.sin(time) * 0.3 + 0.7;
            
            this.ctx.fillStyle = this.exit.color;
            this.ctx.shadowColor = this.exit.color;
            this.ctx.shadowBlur = 20 * glow;
            this.ctx.fillRect(this.exit.x, this.exit.y, this.exit.width, this.exit.height);
            this.ctx.shadowBlur = 0;
            
            // Add swirling effect
            this.ctx.strokeStyle = this.exit.color;
            this.ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++) {
                const radius = 25 + i * 5;
                const angle = time + i * Math.PI / 3;
                const x = this.exit.x + this.exit.width / 2 + Math.cos(angle) * radius;
                const y = this.exit.y + this.exit.height / 2 + Math.sin(angle) * radius;
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, 3, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
    }
    
    renderPlayerTrail() {
        for (let i = 0; i < this.player.trail.length; i++) {
            const trail = this.player.trail[i];
            this.ctx.fillStyle = `rgba(0, 255, 255, ${trail.alpha * 0.5})`;
            this.ctx.fillRect(trail.x - 2, trail.y - 2, 4, 4);
        }
    }
    
    renderPlayer() {
        const player = this.player;
        
        // Player glow effect
        if (player.dashing) {
            this.ctx.shadowColor = '#ffff00';
            this.ctx.shadowBlur = 20;
        } else {
            this.ctx.shadowColor = player.color;
            this.ctx.shadowBlur = 10;
        }
        
        this.ctx.fillStyle = player.color;
        this.ctx.fillRect(player.x, player.y, player.width, player.height);
        this.ctx.shadowBlur = 0;
        
        // Add eyes
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(player.x + 3, player.y + 5, 3, 3);
        this.ctx.fillRect(player.x + 14, player.y + 5, 3, 3);
        
        // Show wall grab indicator
        if (player.onWall) {
            this.ctx.strokeStyle = '#ff6b6b';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(player.x - 2, player.y - 2, 
                              player.width + 4, player.height + 4);
        }
    }
    
    renderParticles() {
        for (let particle of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - particle.size / 2, 
                            particle.y - particle.size / 2, 
                            particle.size, particle.size);
            this.ctx.restore();
        }
    }
    
    renderUI() {
        // Add any additional UI elements here
        if (this.gameState === 'playing' && this.player.dashCooldown > 0) {
            // Dash cooldown indicator
            const cooldownPercent = this.player.dashCooldown / 60;
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
            this.ctx.fillRect(20, this.canvas.height - 30, 
                            100 * (1 - cooldownPercent), 10);
            
            this.ctx.strokeStyle = '#fff';
            this.ctx.strokeRect(20, this.canvas.height - 30, 100, 10);
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    const game = new ParkourGame();
    
    // Show name entry screen first
    document.getElementById('nameEntry').style.display = 'block';
    document.getElementById('instructions').style.display = 'none';
    
    // Handle Enter key for name input
    document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            game.submitName();
        }
    });
});
