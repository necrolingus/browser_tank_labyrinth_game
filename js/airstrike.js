class AirStrikeManager {

  constructor() {
    this.active = false;
    this.timer = 0;
    this.totalDuration = CONFIG.AIRSTRIKE.DURATION;
    this.bombDropInterval = 0.07;
    this.lastBombDrop = 0;
    this.shakeIntensity = 0;
  }

  trigger(maze, enemies, projectileManager) {
    if (this.active) return false;
    this.active = true;
    this.timer = this.totalDuration;
    this.lastBombDrop = 0;
    this.shakeIntensity = CONFIG.AIRSTRIKE.CAMERA_SHAKE_MAGNITUDE;

    sounds.playAirStrikeSiren();
    return true;
  }

  update(dt, maze, enemies, projectileManager) {
    if (!this.active) return;

    this.timer -= dt;
    this.lastBombDrop += dt;

    if (this.lastBombDrop >= this.bombDropInterval) {
      this.lastBombDrop = 0;

      // Drop random cluster bombs across the maze
      const worldW = maze.width * maze.tileSize;
      const worldH = maze.height * maze.tileSize;

      const rx = Math.random() * (worldW - 2 * maze.tileSize) + maze.tileSize;
      const ry = Math.random() * (worldH - 2 * maze.tileSize) + maze.tileSize;

      // Massive carpet bombing explosion
      projectileManager.triggerBigBoomImpact(rx, ry, enemies);
    }

    if (this.timer <= 0) {
      this.active = false;
      this.shakeIntensity = 0;
    }
  }

  getCameraOffset() {
    if (!this.active) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * this.shakeIntensity * 2,
      y: (Math.random() - 0.5) * this.shakeIntensity * 2,
    };
  }

  renderOverlay(ctx, camera) {
    if (!this.active) return;

    // Atmospheric warzone red haze and siren warning
    ctx.save();
    const flash = (Math.sin(Date.now() / 80) + 1) * 0.5;
    ctx.fillStyle = `rgba(200, 30, 10, ${0.12 + flash * 0.12})`;
    ctx.fillRect(0, 0, camera.viewportWidth, camera.viewportHeight);

    // Crosshairs and banner
    ctx.fillStyle = '#ffdf7e';
    ctx.font = 'bold 22px ' + CONFIG.FONTS.MILITARY_HEADER;
    ctx.textAlign = 'center';
    ctx.fillText('/// AIR STRIKE IN PROGRESS ///', camera.viewportWidth / 2, 70);

    ctx.restore();
  }
}
