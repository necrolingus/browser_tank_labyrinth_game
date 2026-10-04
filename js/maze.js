class Maze {
  constructor(width, height, themeColors = {}) {
    // Ensure odd dimensions for proper labyrinth corridor walls
    this.width = width % 2 === 0 ? width + 1 : width;
    this.height = height % 2 === 0 ? height + 1 : height;
    this.tileSize = CONFIG.DISPLAY.TILE_SIZE;
    
    this.theme = {
      wall: themeColors.wall || CONFIG.PALETTE.MAZE_WALL,
      wallTop: themeColors.wallTop || CONFIG.PALETTE.MAZE_WALL_TOP,
      floor: themeColors.floor || CONFIG.PALETTE.MAZE_FLOOR,
      floorAlt: themeColors.floorAlt || CONFIG.PALETTE.MAZE_FLOOR_ALT,
    };

    // 1 = Wall, 0 = Floor, 2 = Entrance, 3 = Exit
    this.grid = [];
    this.startCell = { x: 1, y: 1 };
    this.exitCell = { x: this.width - 2, y: this.height - 2 };
    this.solutionPath = []; // Solved path from start to exit for 'H' cheat
    
    this.generate();
  }

  generate() {
    // Initialize all as walls
    this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(1));

    // Randomized Depth-First Search / Recursive Backtracker
    const stack = [];
    const startX = 1;
    const startY = 1;
    
    this.grid[startY][startX] = 0;
    stack.push({ x: startX, y: startY });

    const directions = [
      { dx: 0, dy: -2 }, // Up
      { dx: 2, dy: 0 },  // Right
      { dx: 0, dy: 2 },  // Down
      { dx: -2, dy: 0 }  // Left
    ];

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = [];

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;

        if (nx > 0 && nx < this.width - 1 && ny > 0 && ny < this.height - 1) {
          if (this.grid[ny][nx] === 1) {
            neighbors.push({ x: nx, y: ny, wallX: current.x + dir.dx / 2, wallY: current.y + dir.dy / 2 });
          }
        }
      }

      if (neighbors.length > 0) {
        // Pick random unvisited neighbor
        const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
        this.grid[chosen.wallY][chosen.wallX] = 0; // Knock down wall
        this.grid[chosen.y][chosen.x] = 0;         // Carve passage
        stack.push({ x: chosen.x, y: chosen.y });
      } else {
        stack.pop();
      }
    }

    // Add extra loops/crossings (approx 10% of walls inside knocked down to allow tactical flanking)
    for (let y = 2; y < this.height - 2; y += 2) {
      for (let x = 2; x < this.width - 2; x += 2) {
        if (this.grid[y][x] === 1 && Math.random() < 0.12) {
          // Check if connecting two pathways
          const horizontal = this.grid[y][x - 1] === 0 && this.grid[y][x + 1] === 0;
          const vertical = this.grid[y - 1][x] === 0 && this.grid[y + 1][x] === 0;
          if (horizontal || vertical) {
            this.grid[y][x] = 0;
          }
        }
      }
    }

    // Set entrance and exit
    this.startCell = { x: 1, y: 1 };
    this.exitCell = { x: this.width - 2, y: this.height - 2 };
    this.grid[this.startCell.y][this.startCell.x] = 2;
    this.grid[this.exitCell.y][this.exitCell.x] = 3;

    // Precalculate solution path from start to exit using BFS
    this.calculateSolutionPath();
  }

  calculateSolutionPath(fromX = this.startCell.x, fromY = this.startCell.y) {
    const queue = [{ x: fromX, y: fromY, path: [{ x: fromX, y: fromY }] }];
    const visited = Array.from({ length: this.height }, () => Array(this.width).fill(false));
    visited[fromY][fromX] = true;

    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }
    ];

    while (queue.length > 0) {
      const { x, y, path } = queue.shift();

      if (x === this.exitCell.x && y === this.exitCell.y) {
        this.solutionPath = path;
        return path;
      }

      for (const d of dirs) {
        const nx = x + d.dx;
        const ny = y + d.dy;

        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          if (!visited[ny][nx] && this.grid[ny][nx] !== 1) {
            visited[ny][nx] = true;
            queue.push({ x: nx, y: ny, path: [...path, { x: nx, y: ny }] });
          }
        }
      }
    }
    return [];
  }

  isWall(cellX, cellY) {
    if (cellX < 0 || cellX >= this.width || cellY < 0 || cellY >= this.height) {
      return true;
    }
    return this.grid[cellY][cellX] === 1;
  }

  // World coordinates collision check with bounding circle/box
  checkCircleWallCollision(worldX, worldY, radius) {
    const minCellX = Math.floor((worldX - radius) / this.tileSize);
    const maxCellX = Math.floor((worldX + radius) / this.tileSize);
    const minCellY = Math.floor((worldY - radius) / this.tileSize);
    const maxCellY = Math.floor((worldY + radius) / this.tileSize);

    for (let cy = minCellY; cy <= maxCellY; cy++) {
      for (let cx = minCellX; cx <= maxCellX; cx++) {
        if (this.isWall(cx, cy)) {
          // Nearest point on cell rectangle
          const nearestX = Math.max(cx * this.tileSize, Math.min(worldX, (cx + 1) * this.tileSize));
          const nearestY = Math.max(cy * this.tileSize, Math.min(worldY, (cy + 1) * this.tileSize));
          const distX = worldX - nearestX;
          const distY = worldY - nearestY;
          if (distX * distX + distY * distY < radius * radius) {
            return {
              collided: true,
              wallRect: {
                x: cx * this.tileSize,
                y: cy * this.tileSize,
                w: this.tileSize,
                h: this.tileSize
              },
              normal: {
                x: distX !== 0 ? Math.sign(distX) : 0,
                y: distY !== 0 ? Math.sign(distY) : 0
              }
            };
          }
        }
      }
    }
    return { collided: false };
  }

  // Check line of sight between two world positions
  hasLineOfSight(x1, y1, x2, y2) {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / (this.tileSize * 0.25));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      const cellX = Math.floor(x / this.tileSize);
      const cellY = Math.floor(y / this.tileSize);
      if (this.isWall(cellX, cellY)) {
        return false;
      }
    }
    return true;
  }

  // Find all open floor cells (excluding start & exit)
  getOpenFloorCells() {
    const floorCells = [];
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.grid[y][x] === 0) {
          // Avoid immediate spawn area near entrance
          const distStart = Math.hypot(x - this.startCell.x, y - this.startCell.y);
          if (distStart > 3) {
            floorCells.push({ x, y });
          }
        }
      }
    }
    return floorCells;
  }

  render(ctx, camera, showPathCheat = false) {
    const startCol = Math.max(0, Math.floor(camera.x / this.tileSize));
    const endCol = Math.min(this.width - 1, Math.floor((camera.x + camera.viewportWidth) / this.tileSize) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / this.tileSize));
    const endRow = Math.min(this.height - 1, Math.floor((camera.y + camera.viewportHeight) / this.tileSize) + 1);

    // 1. Draw floor and walls in visible viewport
    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        const px = x * this.tileSize;
        const py = y * this.tileSize;
        const cell = this.grid[y][x];

        if (cell === 1) {
          // Wall - Sector bunker / alloy concrete style
          ctx.fillStyle = this.theme.wall;
          ctx.fillRect(px, py, this.tileSize, this.tileSize);

          // Top bevel highlight
          ctx.fillStyle = this.theme.wallTop;
          ctx.fillRect(px + 3, py + 3, this.tileSize - 6, this.tileSize - 6);

          // Rivet / bunker seam detail
          ctx.strokeStyle = '#1b1e16';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 4, py + 4, this.tileSize - 8, this.tileSize - 8);
        } else {
          // Floor - Sector specific terrain
          ctx.fillStyle = (x + y) % 2 === 0 ? this.theme.floor : this.theme.floorAlt;
          ctx.fillRect(px, py, this.tileSize, this.tileSize);

          // Grid floor texture lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, this.tileSize, this.tileSize);

          // Exit cell special styling
          if (cell === 3) {
            ctx.fillStyle = CONFIG.PALETTE.EXIT_AREA;
            ctx.fillRect(px + 6, py + 6, this.tileSize - 12, this.tileSize - 12);

            // Pulsing exit beacon
            const pulse = (Math.sin(Date.now() / 250) + 1) * 0.5;
            ctx.strokeStyle = CONFIG.PALETTE.EXIT_LIGHT;
            ctx.lineWidth = 3 + pulse * 2;
            ctx.strokeRect(px + 8, py + 8, this.tileSize - 16, this.tileSize - 16);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px ' + CONFIG.FONTS.MILITARY_HEADER;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('EXIT', px + this.tileSize / 2, py + this.tileSize / 2);
          } else if (cell === 2) {
            // Entrance
            ctx.strokeStyle = 'rgba(218, 165, 32, 0.4)';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 8, py + 8, this.tileSize - 16, this.tileSize - 16);
          }
        }
      }
    }

    // 2. Draw Cheat Path (H key) if toggled
    if (showPathCheat && this.solutionPath.length > 0) {
      ctx.save();
      ctx.strokeStyle = CONFIG.PALETTE.HINT_PATH;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([12, 12]);
      ctx.lineDashOffset = -Date.now() / 40;

      ctx.beginPath();
      const first = this.solutionPath[0];
      ctx.moveTo(first.x * this.tileSize + this.tileSize / 2, first.y * this.tileSize + this.tileSize / 2);
      for (let i = 1; i < this.solutionPath.length; i++) {
        const pt = this.solutionPath[i];
        ctx.lineTo(pt.x * this.tileSize + this.tileSize / 2, pt.y * this.tileSize + this.tileSize / 2);
      }
      ctx.stroke();
      ctx.restore();
    }
  }
}
