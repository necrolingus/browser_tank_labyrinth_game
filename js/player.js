class Player {

  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hullAngle = 0;
    this.turretAngle = 0;
    this.radius = 18; // Collision radius

    this.lives = CONFIG.PLAYER.INITIAL_LIVES;
    this.invulnerableTimer = 0;
    this.shootCooldown = 0;

    // Ammo inventory
    this.bigBoomAmmo = CONFIG.PLAYER.START_BIGBOOM_AMMO;
    this.hasAirStrike = false;

    // Movement flags
    this.keys = {
      w: false,
      s: false,
      a: false,
      d: false,
      space: false,
      h: false
    };

    this.mouseWorldX = 0;
    this.mouseWorldY = 0;
    this.showCheatPath = false;
  }

  resetPosition(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.hullAngle = 0;
    this.invulnerableTimer = CONFIG.PLAYER.INVULNERABILITY_TIME;
  }

  takeDamage() {
    if (this.invulnerableTimer > 0) return false;
    this.lives--;
    this.invulnerableTimer = CONFIG.PLAYER.INVULNERABILITY_TIME;
    sounds.playPlayerHit();
    return true;
  }

  update(dt, maze, camera) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }

    // 1. Calculate movement direction from WASD
    let dx = 0;
    let dy = 0;
    if (this.keys.w) dy -= 1;
    if (this.keys.s) dy += 1;
    if (this.keys.a) dx -= 1;
    if (this.keys.d) dx += 1;

    if (dx !== 0 && dy !== 0) {
      // Normalize diagonal speed
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }

    const speed = CONFIG.PLAYER.SPEED;
    this.vx = dx * speed;
    this.vy = dy * speed;

    // 2. Rotate Hull toward movement vector smoothly
    if (dx !== 0 || dy !== 0) {
      const targetHullAngle = Math.atan2(dy, dx);
      let diff = targetHullAngle - this.hullAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.hullAngle += diff * Math.min(1.0, CONFIG.PLAYER.ROTATION_SPEED * dt);
    }

    // 3. Move with separate X and Y wall collision sliding
    const nextX = this.x + this.vx * dt;
    if (!maze.checkCircleWallCollision(nextX, this.y, this.radius).collided) {
      this.x = nextX;
    }

    const nextY = this.y + this.vy * dt;
    if (!maze.checkCircleWallCollision(this.x, nextY, this.radius).collided) {
      this.y = nextY;
    }

    // 4. Update Turret angle pointing to mouse cursor in world coordinates
    this.turretAngle = Math.atan2(this.mouseWorldY - this.y, this.mouseWorldX - this.x);
  }

  fireBasic(projectileManager) {
    if (this.shootCooldown > 0) return;
    this.shootCooldown = CONFIG.PLAYER.BASIC_AMMO_COOLDOWN;

    // Barrel tip offset
    const barrelLength = 34;
    const spawnX = this.x + Math.cos(this.turretAngle) * barrelLength;
    const spawnY = this.y + Math.sin(this.turretAngle) * barrelLength;

    projectileManager.spawnBullet(spawnX, spawnY, this.turretAngle, 'standard');
  }

  fireBigBoom(projectileManager) {
    if (this.bigBoomAmmo <= 0) return false;
    this.bigBoomAmmo--;

    const barrelLength = 34;
    const spawnX = this.x + Math.cos(this.turretAngle) * barrelLength;
    const spawnY = this.y + Math.sin(this.turretAngle) * barrelLength;

    projectileManager.spawnBullet(spawnX, spawnY, this.turretAngle, 'bigboom');
    return true;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Flashing effect if invulnerable
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 90) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // High visibility ground shadow / tactical aura ring
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    // Subtle tactical green base ring to immediately spot player in maze
    ctx.strokeStyle = 'rgba(123, 189, 80, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.stroke();

    // 1. Draw Hull & Treads
    ctx.save();
    ctx.rotate(this.hullAngle);

    // Treads shadow
    ctx.fillStyle = '#0a0d08';
    ctx.fillRect(-24, -20, 48, 40);

    // Left tread
    ctx.fillStyle = CONFIG.PALETTE.PLAYER_TREADS;
    ctx.fillRect(-24, -21, 48, 10);
    ctx.fillStyle = '#2d3326';
    for (let i = -20; i < 24; i += 7) {
      ctx.fillRect(i, -21, 2.5, 10);
    }

    // Right tread
    ctx.fillStyle = CONFIG.PALETTE.PLAYER_TREADS;
    ctx.fillRect(-24, 11, 48, 10);
    for (let i = -20; i < 24; i += 7) {
      ctx.fillRect(i, 11, 2.5, 10);
    }

    // Main Armor Body - Bright distinct olive armor
    ctx.fillStyle = CONFIG.PALETTE.PLAYER_HULL;
    ctx.beginPath();
    ctx.roundRect(-20, -14, 40, 28, 4);
    ctx.fill();

    // High-visibility armor outline
    ctx.strokeStyle = CONFIG.PALETTE.PLAYER_HULL_HIGHLIGHT;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Front Brass Chevron marking
    ctx.fillStyle = CONFIG.PALETTE.PLAYER_ACCENT;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(6, -8);
    ctx.lineTo(9, 0);
    ctx.lineTo(6, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // 2. Draw Aiming Laser Guide (Extends from turret to cursor/aim direction)
    ctx.save();
    ctx.rotate(this.turretAngle);

    // Tactical dotted laser pointer
    ctx.strokeStyle = CONFIG.PALETTE.PLAYER_LASER_SIGHT;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(130, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Crosshair dot at laser tip
    ctx.fillStyle = '#ffca28';
    ctx.beginPath();
    ctx.arc(130, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Gun Barrel (longer, thicker, and high contrast)
    ctx.fillStyle = '#1c2217';
    ctx.fillRect(0, -4, 32, 8);

    // Barrel top highlight strip
    ctx.fillStyle = '#8fad68';
    ctx.fillRect(4, -1.5, 24, 3);

    // High-contrast Muzzle Brake
    ctx.fillStyle = '#ffca28'; // Brass muzzle brake tip
    ctx.fillRect(28, -6, 5, 12);

    // Turret Dome Base
    ctx.fillStyle = CONFIG.PALETTE.PLAYER_TURRET;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();

    // Turret Dome Highlight Rim
    ctx.strokeStyle = CONFIG.PALETTE.PLAYER_TURRET_RIM;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.stroke();

    // Turret Hatch / Commander Cupola
    ctx.fillStyle = '#172410';
    ctx.beginPath();
    ctx.arc(-2, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Yellow Commander indicator dot
    ctx.fillStyle = '#ffca28';
    ctx.beginPath();
    ctx.arc(-2, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.restore();
  }
}
