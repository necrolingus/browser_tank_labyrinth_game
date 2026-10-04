class Enemy {

  constructor(x, y, type = 'standard') {
    this.x = x;
    this.y = y;
    this.type = type; // 'standard' or 'hectic'
    this.radius = 17;
    this.alive = true;

    // Movement & Orientation
    this.angle = Math.random() * Math.PI * 2;
    this.targetAngle = this.angle;
    this.turretAngle = this.angle;
    this.vx = 0;
    this.vy = 0;

    // AI States
    this.isCharging = false;
    this.chargeTimer = 0;
    this.wanderTimer = Math.random() * 2;
    this.stuckTimer = 0;
  }

  kill() {
    this.alive = false;
  }

  update(dt, maze, player) {
    if (!this.alive) return;

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    const hasSight = maze.hasLineOfSight(this.x, this.y, player.x, player.y);

    if (this.type === 'hectic') {
      this.updateHecticAI(dt, maze, player, distToPlayer, hasSight);
    } else {
      this.updateStandardAI(dt, maze, player, distToPlayer, hasSight);
    }

    // Check collision with player -> damages player and consumes/destroys enemy or pushes back
    if (distToPlayer < this.radius + player.radius) {
      const hit = player.takeDamage();
      if (hit) {
        // Hectic enemy suicide charge or recoil
        if (this.type === 'hectic') {
          this.kill();
        }
      }
    }
  }

  updateStandardAI(dt, maze, player, distToPlayer, hasSight) {
    const speed = CONFIG.ENEMIES.STANDARD_SPEED;
    this.wanderTimer -= dt;

    // Standard patrol: drives along corridors, turns at intersections or walls
    if (this.wanderTimer <= 0) {
      this.wanderTimer = Math.random() * 2.5 + 1.2;
      // 4 cardinal directions or slight angle perturbation
      const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
      this.targetAngle = angles[Math.floor(Math.random() * angles.length)];
    }

    // Smooth turn towards target direction
    let diff = this.targetAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.angle += diff * Math.min(1.0, CONFIG.ENEMIES.STANDARD_TURN_RATE * dt);

    // Aim turret in direction of movement or look at player if close
    if (hasSight && distToPlayer < CONFIG.ENEMIES.STANDARD_DETECTION_RANGE) {
      this.turretAngle = Math.atan2(player.y - this.y, player.x - this.x);
    } else {
      this.turretAngle = this.angle;
    }

    // Move forward
    const nextX = this.x + Math.cos(this.angle) * speed * dt;
    const nextY = this.y + Math.sin(this.angle) * speed * dt;

    const hit = maze.checkCircleWallCollision(nextX, nextY, this.radius);
    if (!hit.collided) {
      this.x = nextX;
      this.y = nextY;
      this.stuckTimer = 0;
    } else {
      // Wall hit - pick a new random direction immediately
      this.wanderTimer = 0;
      this.targetAngle += Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1);
      this.angle = this.targetAngle;
    }
  }

  updateHecticAI(dt, maze, player, distToPlayer, hasSight) {
    const isDetected = hasSight && distToPlayer < CONFIG.ENEMIES.HECTIC_DETECTION_RANGE;

    if (isDetected) {
      this.isCharging = true;
      this.chargeTimer = CONFIG.ENEMIES.HECTIC_LOSE_TARGET_TIME;
    } else if (this.isCharging) {
      this.chargeTimer -= dt;
      if (this.chargeTimer <= 0) {
        this.isCharging = false;
      }
    }

    if (this.isCharging) {
      // Charge at high speed straight toward player!
      const targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
      let diff = targetAngle - this.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      this.angle += diff * Math.min(1.0, CONFIG.ENEMIES.HECTIC_CHARGE_TURN_RATE * dt);
      this.turretAngle = targetAngle;

      const chargeSpeed = CONFIG.ENEMIES.HECTIC_CHARGE_SPEED;
      const stepX = Math.cos(this.angle) * chargeSpeed * dt;
      const stepY = Math.sin(this.angle) * chargeSpeed * dt;

      // Sliding movement along walls
      if (!maze.checkCircleWallCollision(this.x + stepX, this.y, this.radius).collided) {
        this.x += stepX;
      }
      if (!maze.checkCircleWallCollision(this.x, this.y + stepY, this.radius).collided) {
        this.y += stepY;
      }
    } else {
      // Patrol mode when player not in sight
      const patrolSpeed = CONFIG.ENEMIES.HECTIC_PATROL_SPEED;
      this.wanderTimer -= dt;

      if (this.wanderTimer <= 0) {
        this.wanderTimer = Math.random() * 1.8 + 0.8;
        const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
        this.targetAngle = angles[Math.floor(Math.random() * angles.length)];
      }

      let diff = this.targetAngle - this.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.angle += diff * Math.min(1.0, 3.5 * dt);
      this.turretAngle = this.angle;

      const nextX = this.x + Math.cos(this.angle) * patrolSpeed * dt;
      const nextY = this.y + Math.sin(this.angle) * patrolSpeed * dt;

      if (!maze.checkCircleWallCollision(nextX, nextY, this.radius).collided) {
        this.x = nextX;
        this.y = nextY;
      } else {
        this.wanderTimer = 0;
        this.targetAngle += Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1);
      }
    }
  }

  render(ctx) {
    if (!this.alive) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    const isHectic = this.type === 'hectic';
    const hullColor = isHectic ? CONFIG.PALETTE.ENEMY_HECTIC_HULL : CONFIG.PALETTE.ENEMY_STD_HULL;
    const turretColor = isHectic ? CONFIG.PALETTE.ENEMY_HECTIC_TURRET : CONFIG.PALETTE.ENEMY_STD_TURRET;
    const treadColor = isHectic ? CONFIG.PALETTE.ENEMY_HECTIC_TREADS : CONFIG.PALETTE.ENEMY_STD_TREADS;

    // 1. Draw Hull & Treads
    ctx.save();
    ctx.rotate(this.angle);

    // Tread shadows
    ctx.fillStyle = '#111110';
    ctx.fillRect(-20, -17, 40, 34);

    // Treads
    ctx.fillStyle = treadColor;
    ctx.fillRect(-20, -17, 40, 8);
    ctx.fillRect(-20, 9, 40, 8);

    // Main Armor Body
    ctx.fillStyle = hullColor;
    ctx.beginPath();
    ctx.roundRect(-16, -11, 32, 22, 3);
    ctx.fill();

    // Body trim
    ctx.strokeStyle = isHectic ? '#ba4838' : '#99734e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Hectic berserk warning stripe
    if (isHectic) {
      ctx.fillStyle = '#f0a000';
      ctx.fillRect(-6, -11, 3, 22);
      ctx.fillRect(3, -11, 3, 22);
    }

    ctx.restore();

    // 2. Draw Turret
    ctx.save();
    ctx.rotate(this.turretAngle);

    // Gun Barrel
    ctx.fillStyle = '#1e1c19';
    ctx.fillRect(0, -3, isHectic ? 22 : 20, 6);

    // Turret Dome
    ctx.fillStyle = turretColor;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2b2622';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();

    // Alert indicator when hectic enemy charges
    if (isHectic && this.isCharging) {
      ctx.fillStyle = '#ff2b2b';
      ctx.font = 'bold 15px ' + CONFIG.FONTS.MILITARY_HEADER;
      ctx.textAlign = 'center';
      ctx.fillText('!', 0, -23);
    }

    ctx.restore();
  }
}
