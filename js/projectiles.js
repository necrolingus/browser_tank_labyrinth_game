class ProjectileManager {

  constructor() {
    this.bullets = [];
    this.particles = [];
    this.explosions = [];
  }

  spawnBullet(x, y, angle, type = 'standard') {
    const speed = type === 'bigboom' ? CONFIG.PLAYER.BASIC_BULLET_SPEED * 0.85 : CONFIG.PLAYER.BASIC_BULLET_SPEED;
    this.bullets.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: type === 'bigboom' ? 8 : 4.5,
      type, // 'standard' or 'bigboom'
      distanceTraveled: 0,
      maxDistance: CONFIG.PLAYER.BASIC_BULLET_RANGE,
      alive: true
    });

    if (type === 'bigboom') {
      sounds.playBigBoomShoot();
    } else {
      sounds.playShoot();
    }
  }

  createExplosion(x, y, radius, isBigBoom = false) {
    this.explosions.push({
      x,
      y,
      maxRadius: radius,
      currentRadius: 2,
      duration: isBigBoom ? 0.6 : 0.35,
      elapsed: 0,
      isBigBoom,
      alive: true
    });

    if (isBigBoom) {
      sounds.playMassiveExplosion();
    } else {
      sounds.playExplosion();
    }

    // Spawn sparks and shrapnel particles
    const particleCount = isBigBoom ? 45 : 18;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (isBigBoom ? 240 : 140) + 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: Math.random() * 1.5 + 1.2,
        color: Math.random() > 0.4 ? CONFIG.PALETTE.EXPLOSION_OUTER : CONFIG.PALETTE.EXPLOSION_CORE,
        size: Math.random() * 4 + 2
      });
    }

    // Heavy black smoke puffs
    const smokeCount = isBigBoom ? 20 : 8;
    for (let i = 0; i < smokeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 45 + 10;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: Math.random() * 0.8 + 0.5,
        color: 'rgba(50, 50, 46, 0.45)',
        size: Math.random() * 12 + 8
      });
    }
  }

  update(dt, maze, enemies, player) {
    // 1. Update Projectiles
    for (const b of this.bullets) {
      if (!b.alive) continue;

      const stepX = b.vx * dt;
      const stepY = b.vy * dt;
      b.x += stepX;
      b.y += stepY;
      b.distanceTraveled += Math.hypot(stepX, stepY);

      // Check wall hit
      const wallHit = maze.checkCircleWallCollision(b.x, b.y, b.radius);
      if (wallHit.collided) {
        b.alive = false;
        if (b.type === 'bigboom') {
          // Detonates massive area of effect
          this.triggerBigBoomImpact(b.x, b.y, enemies);
        } else {
          // Standard bullet harmlessly hits wall with sparks
          this.createSparkEffect(b.x, b.y);
        }
        continue;
      }

      // Check enemy hit
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dist = Math.hypot(b.x - enemy.x, b.y - enemy.y);
        if (dist < b.radius + enemy.radius) {
          b.alive = false;
          if (b.type === 'bigboom') {
            this.triggerBigBoomImpact(b.x, b.y, enemies);
          } else {
            // Standard ammo: 1 shot 1 kill
            enemy.kill();
            this.createExplosion(enemy.x, enemy.y, 48, false);
          }
          break;
        }
      }

      if (b.distanceTraveled >= b.maxDistance) {
        b.alive = false;
      }
    }
    this.bullets = this.bullets.filter(b => b.alive);

    // 2. Update Explosions
    for (const exp of this.explosions) {
      exp.elapsed += dt;
      const progress = exp.elapsed / exp.duration;
      exp.currentRadius = exp.maxRadius * Math.sin(progress * Math.PI * 0.5);

      if (progress >= 1.0) {
        exp.alive = false;
      }
    }
    this.explosions = this.explosions.filter(exp => exp.alive);

    // 3. Update Particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  triggerBigBoomImpact(x, y, enemies) {
    const splashRadius = CONFIG.PLAYER.BIGBOOM_SPLASH_RADIUS;
    this.createExplosion(x, y, splashRadius, true);

    // Kills all enemies within splash radius, even behind walls!
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = Math.hypot(x - enemy.x, y - enemy.y);
      if (dist <= splashRadius) {
        enemy.kill();
        this.createExplosion(enemy.x, enemy.y, 45, false);
      }
    }
  }

  createSparkEffect(x, y) {
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 80 + 30;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35,
        decay: 3.0,
        color: CONFIG.PALETTE.BULLET_STANDARD,
        size: Math.random() * 2 + 1.5
      });
    }
  }

  render(ctx) {
    // 1. Draw Projectiles
    for (const b of this.bullets) {
      ctx.save();
      ctx.translate(b.x, b.y);

      if (b.type === 'bigboom') {
        ctx.fillStyle = CONFIG.PALETTE.AMMO_BIGBOOM;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffe494';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pulsing rocket trail
        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        ctx.arc(-b.vx * 0.015, -b.vy * 0.015, b.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = CONFIG.PALETTE.BULLET_STANDARD;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Draw Explosions
    for (const exp of this.explosions) {
      ctx.save();
      ctx.translate(exp.x, exp.y);

      const alpha = Math.max(0, 1 - exp.elapsed / exp.duration);
      
      // Outer blast ring
      const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, exp.currentRadius);
      grad.addColorStop(0, `rgba(255, 240, 160, ${alpha * 0.9})`);
      grad.addColorStop(0.4, `rgba(225, 75, 20, ${alpha * 0.7})`);
      grad.addColorStop(0.8, `rgba(130, 30, 10, ${alpha * 0.4})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, exp.currentRadius, 0, Math.PI * 2);
      ctx.fill();

      // Shockwave ring
      ctx.strokeStyle = `rgba(255, 200, 120, ${alpha * 0.6})`;
      ctx.lineWidth = exp.isBigBoom ? 6 : 3;
      ctx.beginPath();
      ctx.arc(0, 0, exp.currentRadius * 0.95, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // 3. Draw Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
