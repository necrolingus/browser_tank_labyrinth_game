class Pickup {

  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'bigboom' or 'airstrike'
    this.radius = 16;
    this.collected = false;
    this.pulse = Math.random() * Math.PI * 2;
  }

  update(dt, player) {
    if (this.collected) return;
    this.pulse += dt * 3.5;

    // Check collection
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist < this.radius + player.radius) {
      this.collected = true;

      if (this.type === 'bigboom') {
        sounds.playPickup();
        player.bigBoomAmmo += CONFIG.PICKUPS.BIGBOOM_PER_PICKUP;
      } else if (this.type === 'airstrike') {
        sounds.playAirStrikePickup();
        player.hasAirStrike = true;
      }
    }
  }

  render(ctx) {
    if (this.collected) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    const glow = (Math.sin(this.pulse) + 1) * 0.5;

    if (this.type === 'bigboom') {
      // Ordnance Ammo Crate
      ctx.fillStyle = '#1e1c14';
      ctx.fillRect(-14, -14, 28, 28);

      ctx.fillStyle = CONFIG.PALETTE.AMMO_BIGBOOM;
      ctx.fillRect(-12, -12, 24, 24);

      // Shell icon
      ctx.fillStyle = '#ffdf7e';
      ctx.beginPath();
      ctx.arc(0, -2, 5, Math.PI, 0);
      ctx.lineTo(5, 7);
      ctx.lineTo(-5, 7);
      ctx.closePath();
      ctx.fill();

      // Pulsing glow border
      ctx.strokeStyle = `rgba(255, 170, 50, ${0.4 + glow * 0.5})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(-15, -15, 30, 30);
    } else if (this.type === 'airstrike') {
      // Golden Air Strike Radio Beacon
      ctx.fillStyle = '#181816';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = CONFIG.PALETTE.AMMO_AIRSTRIKE;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();

      // Jet / Radar Wing Silhouette
      ctx.fillStyle = '#11120f';
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(8, 7);
      ctx.lineTo(0, 4);
      ctx.lineTo(-8, 7);
      ctx.closePath();
      ctx.fill();

      // Radar ping wave
      ctx.strokeStyle = `rgba(255, 230, 80, ${0.3 + glow * 0.7})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 18 + glow * 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
