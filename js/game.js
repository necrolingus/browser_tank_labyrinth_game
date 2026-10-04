class Game {

  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.level = 1;
    this.state = 'start'; // 'start', 'playing', 'paused', 'victory', 'gameover'

    this.camera = new Camera(window.innerWidth, window.innerHeight);
    this.projectileManager = new ProjectileManager();
    this.airStrikeManager = new AirStrikeManager();

    this.maze = null;
    this.player = null;
    this.enemies = [];
    this.pickups = [];

    this.lastTime = 0;
    this.stats = {
      enemiesKilled: 0,
      totalEnemies: 0,
    };

    this.initEventListeners();
    this.resizeCanvas();
    this.initLevel(1);
    this.setupUIBindings();

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.resize(this.canvas.width, this.canvas.height);
  }

  initLevel(levelNum = 1) {
    this.level = levelNum;
    const lvlConfig = CONFIG.LEVELS[this.level] || CONFIG.LEVELS[1];

    // Create Maze with Sector Dimensions and Theme Colors
    const gridW = lvlConfig.GRID_WIDTH;
    const gridH = lvlConfig.GRID_HEIGHT;
    this.maze = new Maze(gridW, gridH, {
      wall: lvlConfig.WALL_COLOR,
      wallTop: lvlConfig.WALL_TOP_COLOR,
      floor: lvlConfig.FLOOR_COLOR,
      floorAlt: lvlConfig.FLOOR_ALT,
    });

    // Spawn Player at entrance
    const spawnWorldX = this.maze.startCell.x * this.maze.tileSize + this.maze.tileSize / 2;
    const spawnWorldY = this.maze.startCell.y * this.maze.tileSize + this.maze.tileSize / 2;

    if (!this.player) {
      this.player = new Player(spawnWorldX, spawnWorldY);
    } else {
      // Retain or restore player lives and award heavy ordnance bonus for advancing
      this.player.resetPosition(spawnWorldX, spawnWorldY);
      this.player.lives = Math.max(this.player.lives, 3); // Guaranteed minimum 3 lives or replenish
      this.player.bigBoomAmmo += 2;
    }

    // Get open floor locations
    const openCells = this.maze.getOpenFloorCells();
    // Shuffle cells
    for (let i = openCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [openCells[i], openCells[j]] = [openCells[j], openCells[i]];
    }

    // Spawn Standard & Hectic Enemies based on sector difficulty
    this.enemies = [];
    let cellIdx = 0;

    const standardCount = lvlConfig.STANDARD_COUNT;
    const hecticCount = lvlConfig.HECTIC_COUNT;

    for (let i = 0; i < standardCount && cellIdx < openCells.length; i++) {
      const cell = openCells[cellIdx++];
      const ex = cell.x * this.maze.tileSize + this.maze.tileSize / 2;
      const ey = cell.y * this.maze.tileSize + this.maze.tileSize / 2;
      this.enemies.push(new Enemy(ex, ey, 'standard'));
    }

    for (let i = 0; i < hecticCount && cellIdx < openCells.length; i++) {
      const cell = openCells[cellIdx++];
      const ex = cell.x * this.maze.tileSize + this.maze.tileSize / 2;
      const ey = cell.y * this.maze.tileSize + this.maze.tileSize / 2;
      this.enemies.push(new Enemy(ex, ey, 'hectic'));
    }

    this.stats.totalEnemies = this.enemies.length;
    this.stats.enemiesKilled = 0;

    // Spawn Pickups: Big Boom ammo crates
    this.pickups = [];
    for (let i = 0; i < lvlConfig.BIGBOOM_SPAWNS && cellIdx < openCells.length; i++) {
      const cell = openCells[cellIdx++];
      const px = cell.x * this.maze.tileSize + this.maze.tileSize / 2;
      const py = cell.y * this.maze.tileSize + this.maze.tileSize / 2;
      this.pickups.push(new Pickup(px, py, 'bigboom'));
    }

    // Spawn 1 Singular Air Strike beacon per maze
    if (cellIdx < openCells.length) {
      const cell = openCells[cellIdx++];
      const px = cell.x * this.maze.tileSize + this.maze.tileSize / 2;
      const py = cell.y * this.maze.tileSize + this.maze.tileSize / 2;
      this.pickups.push(new Pickup(px, py, 'airstrike'));
    }

    // Reset managers
    this.projectileManager = new ProjectileManager();
    this.airStrikeManager = new AirStrikeManager();

    // Update level display in HUD
    document.getElementById('hudLevel').innerText = `LVL ${this.level}`;
  }

  initEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());

    // Prevent context menu on right click for Big Boom firing
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      sounds.ensureContext();
      const code = e.code;

      if (code === 'KeyW') this.player.keys.w = true;
      if (code === 'KeyS') this.player.keys.s = true;
      if (code === 'KeyA') this.player.keys.a = true;
      if (code === 'KeyD') this.player.keys.d = true;

      // H key: Toggle path cheat
      if (code === 'KeyH') {
        this.player.showCheatPath = !this.player.showCheatPath;
        if (this.player.showCheatPath) {
          // Recompute path from current position
          const curCellX = Math.floor(this.player.x / this.maze.tileSize);
          const curCellY = Math.floor(this.player.y / this.maze.tileSize);
          this.maze.calculateSolutionPath(curCellX, curCellY);
        }
      }

      // Space: Air strike
      if (code === 'Space') {
        e.preventDefault();
        if (this.player.hasAirStrike) {
          this.player.hasAirStrike = false;
          this.airStrikeManager.trigger(this.maze, this.enemies, this.projectileManager);
        }
      }

      // Escape / P: Pause
      if (code === 'KeyP' || code === 'Escape') {
        if (this.state === 'playing') this.state = 'paused';
        else if (this.state === 'paused') this.state = 'playing';
        this.updateModalState();
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      if (code === 'KeyW') this.player.keys.w = false;
      if (code === 'KeyS') this.player.keys.s = false;
      if (code === 'KeyA') this.player.keys.a = false;
      if (code === 'KeyD') this.player.keys.d = false;
    });

    // Mouse movement: Turret 360 aim
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPos = this.camera.screenToWorld(screenX, screenY);
      this.player.mouseWorldX = worldPos.x;
      this.player.mouseWorldY = worldPos.y;
    });

    // Mouse clicks
    window.addEventListener('mousedown', (e) => {
      sounds.ensureContext();
      if (this.state !== 'playing') return;

      if (e.button === 0) {
        // Left click: Basic ammo
        this.player.fireBasic(this.projectileManager);
      } else if (e.button === 2) {
        // Right click: Big Boom ammo
        this.player.fireBigBoom(this.projectileManager);
      }
    });
  }

  setupUIBindings() {
    document.getElementById('btnStart').addEventListener('click', () => {
      sounds.ensureContext();
      this.state = 'playing';
      this.updateModalState();
    });

    document.getElementById('btnRestart').addEventListener('click', () => {
      sounds.ensureContext();
      this.initLevel(this.level); // retry current sector
      this.state = 'playing';
      this.updateModalState();
    });

    document.getElementById('btnResume').addEventListener('click', () => {
      this.state = 'playing';
      this.updateModalState();
    });

    document.getElementById('btnNextLevel').addEventListener('click', () => {
      sounds.ensureContext();
      if (this.level < 5) {
        this.initLevel(this.level + 1);
        this.state = 'playing';
      } else {
        this.state = 'campaign_victory';
        this.renderTankShowcase();
      }
      this.updateModalState();
    });

    document.getElementById('btnRestartCampaign').addEventListener('click', () => {
      sounds.ensureContext();
      this.initLevel(1);
      this.state = 'playing';
      this.updateModalState();
    });
  }

  updateModalState() {
    const startModal = document.getElementById('startModal');
    const pauseModal = document.getElementById('pauseModal');
    const gameOverModal = document.getElementById('gameOverModal');
    const victoryModal = document.getElementById('victoryModal');
    const campaignVictoryModal = document.getElementById('campaignVictoryModal');

    startModal.classList.toggle('hidden', this.state !== 'start');
    pauseModal.classList.toggle('hidden', this.state !== 'paused');
    gameOverModal.classList.toggle('hidden', this.state !== 'gameover');
    victoryModal.classList.toggle('hidden', this.state !== 'victory');
    campaignVictoryModal.classList.toggle('hidden', this.state !== 'campaign_victory');
  }

  update(dt) {
    if (this.state !== 'playing') return;

    // Update Player
    this.player.update(dt, this.maze, this.camera);

    // Update Camera
    const mapW = this.maze.width * this.maze.tileSize;
    const mapH = this.maze.height * this.maze.tileSize;
    const shake = this.airStrikeManager.getCameraOffset();
    this.camera.update(this.player.x, this.player.y, mapW, mapH, dt, shake);

    // Update Enemies
    let aliveCount = 0;
    for (const enemy of this.enemies) {
      if (enemy.alive) {
        enemy.update(dt, this.maze, this.player);
        aliveCount++;
      }
    }
    this.stats.enemiesKilled = this.stats.totalEnemies - aliveCount;

    // Update Projectiles & Particles
    this.projectileManager.update(dt, this.maze, this.enemies, this.player);

    // Update Pickups
    for (const p of this.pickups) {
      p.update(dt, this.player);
    }

    // Update Air Strike
    this.airStrikeManager.update(dt, this.maze, this.enemies, this.projectileManager);

    // Check Player Death
    if (this.player.lives <= 0) {
      this.state = 'gameover';
      this.updateModalState();
    }

    // Check Victory (Reached Exit Cell)
    const playerCellX = Math.floor(this.player.x / this.maze.tileSize);
    const playerCellY = Math.floor(this.player.y / this.maze.tileSize);
    if (playerCellX === this.maze.exitCell.x && playerCellY === this.maze.exitCell.y) {
      sounds.playVictory();
      if (this.level < 5) {
        this.state = 'victory';
        const nextCfg = CONFIG.LEVELS[this.level + 1];
        document.getElementById('victoryTitle').innerText = `SECTOR ${this.level} SECURED!`;
        document.getElementById('victoryDesc').innerText = `Labyrinth ${this.level} neutralized. Prepare to enter Sector ${this.level + 1}: ${nextCfg.NAME}!`;
      } else {
        // Level 5 Final Victory!
        this.state = 'campaign_victory';
        this.renderTankShowcase();
      }
      this.updateModalState();
    }

    // Update HUD
    this.updateHUD();
  }

  renderTankShowcase() {
    const scCanvas = document.getElementById('tankShowcaseCanvas');
    if (!scCanvas) return;
    const sctx = scCanvas.getContext('2d');
    const w = scCanvas.width;
    const h = scCanvas.height;

    // Background gradient and ground
    sctx.clearRect(0, 0, w, h);
    
    // Distant military warzone horizon grid
    sctx.strokeStyle = 'rgba(74, 90, 60, 0.25)';
    sctx.lineWidth = 1;
    for (let gy = 20; gy < 145; gy += 15) {
      sctx.beginPath();
      sctx.moveTo(0, gy);
      sctx.lineTo(w, gy);
      sctx.stroke();
    }

    // Ground platform tarmac
    const groundY = 145;
    sctx.fillStyle = '#1c2018';
    sctx.fillRect(0, groundY, w, h - groundY);
    sctx.strokeStyle = '#4a593e';
    sctx.lineWidth = 3;
    sctx.beginPath();
    sctx.moveTo(0, groundY);
    sctx.lineTo(w, groundY);
    sctx.stroke();

    // Center of tank side profile
    const cx = w / 2;
    const cy = groundY - 24;

    // Ground drop shadow
    sctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    sctx.beginPath();
    sctx.ellipse(cx + 10, groundY - 2, 170, 10, 0, 0, Math.PI * 2);
    sctx.fill();

    // --- 1. LOWER TRACK SYSTEM (TREADS & ROAD WHEELS) ---
    // Outer tread track loop
    sctx.fillStyle = '#181b15';
    sctx.beginPath();
    sctx.roundRect(cx - 150, cy - 6, 290, 26, 12);
    sctx.fill();
    sctx.strokeStyle = '#323a2a';
    sctx.lineWidth = 2;
    sctx.stroke();

    // Tread link treads teeth
    sctx.fillStyle = '#262d20';
    for (let tx = cx - 146; tx <= cx + 134; tx += 11) {
      sctx.fillRect(tx, cy + 17, 6, 4);
      sctx.fillRect(tx, cy - 8, 6, 4);
    }

    // 6 Large Road Wheels with brass hubcaps
    const wheelY = cy + 7;
    for (let wx = cx - 118; wx <= cx + 118; wx += 47) {
      // Outer rubber wheel
      sctx.fillStyle = '#1f241a';
      sctx.beginPath();
      sctx.arc(wx, wheelY, 11, 0, Math.PI * 2);
      sctx.fill();
      sctx.strokeStyle = '#434e38';
      sctx.lineWidth = 2;
      sctx.stroke();

      // Steel rim
      sctx.fillStyle = '#3a4432';
      sctx.beginPath();
      sctx.arc(wx, wheelY, 6, 0, Math.PI * 2);
      sctx.fill();

      // Brass center bolt
      sctx.fillStyle = '#ffca28';
      sctx.beginPath();
      sctx.arc(wx, wheelY, 2.5, 0, Math.PI * 2);
      sctx.fill();
    }

    // --- 2. MAIN ARMORED HULL (SIDE PROFILE) ---
    sctx.fillStyle = '#4f7d32'; // Player vibrant olive armor
    sctx.beginPath();
    // Angular sloped military armor
    sctx.moveTo(cx - 152, cy - 2);
    sctx.lineTo(cx - 138, cy - 28);
    sctx.lineTo(cx + 95, cy - 28);
    sctx.lineTo(cx + 145, cy - 8);
    sctx.lineTo(cx + 130, cy - 2);
    sctx.closePath();
    sctx.fill();

    // Hull armor bevel highlight
    sctx.strokeStyle = '#7bbd50';
    sctx.lineWidth = 2.5;
    sctx.stroke();

    // Side armor skirt plating
    sctx.fillStyle = '#3f6528';
    sctx.fillRect(cx - 130, cy - 14, 255, 8);
    sctx.strokeStyle = '#628a42';
    sctx.lineWidth = 1.5;
    sctx.strokeRect(cx - 130, cy - 14, 255, 8);

    // Military identification star / chevron on side armor
    sctx.fillStyle = '#ffca28';
    sctx.beginPath();
    sctx.moveTo(cx - 10, cy - 22);
    sctx.lineTo(cx + 6, cy - 18);
    sctx.lineTo(cx - 10, cy - 14);
    sctx.closePath();
    sctx.fill();

    // --- 3. COMMAND TURRET & EXTENDED 120MM CANNON ---
    // Turret dome
    sctx.fillStyle = '#2d4d1d';
    sctx.beginPath();
    sctx.moveTo(cx - 75, cy - 28);
    sctx.lineTo(cx - 55, cy - 56);
    sctx.lineTo(cx + 25, cy - 56);
    sctx.lineTo(cx + 52, cy - 28);
    sctx.closePath();
    sctx.fill();

    sctx.strokeStyle = '#b8d68f';
    sctx.lineWidth = 2.5;
    sctx.stroke();

    // Commander Cupola / Hatch
    sctx.fillStyle = '#1d3313';
    sctx.beginPath();
    sctx.roundRect(cx - 45, cy - 64, 24, 9, 3);
    sctx.fill();
    sctx.strokeStyle = '#ffca28';
    sctx.lineWidth = 1.5;
    sctx.stroke();

    // Radio Antenna
    sctx.strokeStyle = '#99aa88';
    sctx.lineWidth = 1.5;
    sctx.beginPath();
    sctx.moveTo(cx - 48, cy - 64);
    sctx.lineTo(cx - 65, cy - 98);
    sctx.stroke();

    // Extended Heavy 120mm Gun Barrel pointing right
    sctx.fillStyle = '#1c2217';
    sctx.fillRect(cx + 42, cy - 47, 138, 10);

    // Barrel reinforcement collar
    sctx.fillStyle = '#4f7d32';
    sctx.fillRect(cx + 42, cy - 49, 18, 14);
    sctx.strokeStyle = '#7bbd50';
    sctx.lineWidth = 1;
    sctx.strokeRect(cx + 42, cy - 49, 18, 14);

    // Brass Muzzle Brake at barrel tip
    sctx.fillStyle = '#ffca28';
    sctx.fillRect(cx + 172, cy - 51, 14, 18);
    sctx.strokeStyle = '#ffe494';
    sctx.lineWidth = 1;
    sctx.strokeRect(cx + 172, cy - 51, 14, 18);

    // Subtle muzzle thermal heat glow
    const mglow = sctx.createRadialGradient(cx + 185, cy - 42, 2, cx + 185, cy - 42, 28);
    mglow.addColorStop(0, 'rgba(255, 202, 40, 0.45)');
    mglow.addColorStop(1, 'rgba(255, 202, 40, 0)');
    sctx.fillStyle = mglow;
    sctx.beginPath();
    sctx.arc(cx + 185, cy - 42, 28, 0, Math.PI * 2);
    sctx.fill();
  }

  updateHUD() {
    document.getElementById('hudLives').innerText = '♥'.repeat(Math.max(0, this.player.lives)) || 'OFFLINE';
    document.getElementById('hudBigBoom').innerText = String(this.player.bigBoomAmmo).padStart(2, '0');
    
    const airStrikeElem = document.getElementById('hudAirStrike');
    airStrikeElem.innerText = this.player.hasAirStrike ? 'READY' : 'STANDBY';
    airStrikeElem.style.color = this.player.hasAirStrike ? '#ffd24c' : '#6d7568';

    document.getElementById('hudEnemies').innerText = `${this.stats.totalEnemies - this.stats.enemiesKilled} / ${this.stats.totalEnemies}`;
    
    const cheatElem = document.getElementById('hudCheat');
    cheatElem.innerText = this.player.showCheatPath ? 'PATH: ON [H]' : 'PATH: OFF [H]';
    cheatElem.style.color = this.player.showCheatPath ? '#ffd24c' : '#798373';
  }

  render() {
    this.ctx.fillStyle = CONFIG.PALETTE.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    // Camera Transform (with shake)
    this.ctx.translate(-this.camera.x + this.camera.shakeX, -this.camera.y + this.camera.shakeY);

    // 1. Draw Maze & Ground
    this.maze.render(this.ctx, this.camera, this.player.showCheatPath);

    // 2. Draw Pickups
    for (const p of this.pickups) {
      p.render(this.ctx);
    }

    // 3. Draw Enemies
    for (const enemy of this.enemies) {
      enemy.render(this.ctx);
    }

    // 4. Draw Player Tank
    this.player.render(this.ctx);

    // 5. Draw Projectiles, Sparks & Explosions
    this.projectileManager.render(this.ctx);

    this.ctx.restore();

    // 6. Air Strike Overlay & Screen FX
    this.airStrikeManager.renderOverlay(this.ctx, this.camera);

    // 7. Tactical Minimap Radar
    this.camera.renderMinimap(this.ctx, this.maze, this.player, this.enemies, this.pickups);
  }

  gameLoop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // cap dt to prevent huge skips
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.gameLoop.bind(this));
  }
}

// Start Game on load
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
