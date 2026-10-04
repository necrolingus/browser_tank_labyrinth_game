class Camera {

  constructor(viewportWidth, viewportHeight) {
    this.x = 0;
    this.y = 0;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  resize(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  update(targetX, targetY, mapPixelWidth, mapPixelHeight, dt, shakeOffset = { x: 0, y: 0 }) {
    // Center camera on target (player)
    const targetCamX = targetX - this.viewportWidth / 2;
    const targetCamY = targetY - this.viewportHeight / 2;

    // Smooth lerp
    this.x += (targetCamX - this.x) * (1 - Math.exp(-CONFIG.DISPLAY.CAMERA_SMOOTHING * 60 * dt));
    this.y += (targetCamY - this.y) * (1 - Math.exp(-CONFIG.DISPLAY.CAMERA_SMOOTHING * 60 * dt));

    // Clamp camera within map bounds if map is larger than viewport
    const maxX = Math.max(0, mapPixelWidth - this.viewportWidth);
    const maxY = Math.max(0, mapPixelHeight - this.viewportHeight);

    this.x = Math.max(0, Math.min(this.x, maxX));
    this.y = Math.max(0, Math.min(this.y, maxY));

    this.shakeX = shakeOffset.x;
    this.shakeY = shakeOffset.y;
  }

  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.x - this.shakeX,
      y: screenY + this.y - this.shakeY
    };
  }

  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x + this.shakeX,
      y: worldY - this.y + this.shakeY
    };
  }

  renderMinimap(ctx, maze, player, enemies, pickups) {
    const size = CONFIG.DISPLAY.MINIMAP_SIZE;
    const padding = 16;
    const mx = this.viewportWidth - size - padding;
    const my = padding;

    ctx.save();
    // Radar background
    ctx.fillStyle = 'rgba(18, 20, 16, 0.88)';
    ctx.fillRect(mx, my, size, size);

    ctx.strokeStyle = '#5a6b47';
    ctx.lineWidth = 2;
    ctx.strokeRect(mx, my, size, size);

    // Radar grid lines
    ctx.strokeStyle = 'rgba(90, 107, 71, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx + size / 2, my);
    ctx.lineTo(mx + size / 2, my + size);
    ctx.moveTo(mx, my + size / 2);
    ctx.lineTo(mx + size, my + size / 2);
    ctx.stroke();

    // Scale factors
    const scaleX = size / (maze.width * maze.tileSize);
    const scaleY = size / (maze.height * maze.tileSize);

    // Draw walls on minimap
    ctx.fillStyle = 'rgba(78, 87, 69, 0.65)';
    const cellW = size / maze.width;
    const cellH = size / maze.height;

    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        if (maze.grid[y][x] === 1) {
          ctx.fillRect(mx + x * cellW, my + y * cellH, cellW + 0.5, cellH + 0.5);
        }
      }
    }

    // Exit beacon on minimap
    ctx.fillStyle = '#8ec766';
    ctx.fillRect(
      mx + (maze.exitCell.x + 0.2) * cellW,
      my + (maze.exitCell.y + 0.2) * cellH,
      cellW * 1.6,
      cellH * 1.6
    );

    // Pickups on minimap
    for (const p of pickups) {
      if (p.collected) continue;
      ctx.fillStyle = p.type === 'airstrike' ? '#ffea00' : '#ff8800';
      ctx.beginPath();
      ctx.arc(mx + p.x * scaleX, my + p.y * scaleY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Enemies on minimap
    for (const e of enemies) {
      if (!e.alive) continue;
      ctx.fillStyle = e.type === 'hectic' ? '#ff3333' : '#d28236';
      ctx.beginPath();
      ctx.arc(mx + e.x * scaleX, my + e.y * scaleY, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player blip (pulsing green)
    const pPulse = (Math.sin(Date.now() / 150) + 1) * 0.5;
    ctx.fillStyle = '#73d63e';
    ctx.beginPath();
    ctx.arc(mx + player.x * scaleX, my + player.y * scaleY, 3.5 + pPulse, 0, Math.PI * 2);
    ctx.fill();

    // Radar HUD label
    ctx.fillStyle = '#9cb580';
    ctx.font = '10px ' + CONFIG.FONTS.MILITARY_HEADER;
    ctx.fillText('RADAR SCAN', mx + 6, my + 14);

    ctx.restore();
  }
}
