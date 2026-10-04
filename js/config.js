/**
 * Game Configuration & Tuning Parameters
 * Easily tweakable for custom balance and gameplay feel.
 */
const CONFIG = {
  // Canvas & Display
  DISPLAY: {
    CANVAS_WIDTH: window.innerWidth,
    CANVAS_HEIGHT: window.innerHeight,
    TILE_SIZE: 64, // Pixels per grid cell
    CAMERA_SMOOTHING: 0.1,
    MINIMAP_SIZE: 180,
    MINIMAP_SCALE: 0.12,
  },

  // Color Palette (Gritty Military / Dieselpunk, strictly no purple/vaporwave/AI tropes)
  PALETTE: {
    BACKGROUND: '#1c1e19',
    MAZE_FLOOR: '#242720',
    MAZE_FLOOR_ALT: '#282c23',
    MAZE_WALL: '#3d4436',
    MAZE_WALL_TOP: '#4e5745',
    MAZE_WALL_SHADOW: 'rgba(10, 12, 8, 0.65)',
    EXIT_AREA: '#4a7c38',
    EXIT_LIGHT: '#8ec766',
    HINT_PATH: 'rgba(218, 165, 32, 0.45)', // Golden amber breadcrumbs
    
    // Player - High visibility contrast military camo with distinct bright chevron & brass trims
    PLAYER_HULL: '#4f7d32',       // Vibrant Olive Green (stands out sharply against dark tarmac)
    PLAYER_HULL_HIGHLIGHT: '#7bbd50',
    PLAYER_TURRET: '#2d4d1d',     // Deep Forest Green
    PLAYER_TURRET_RIM: '#b8d68f',
    PLAYER_TREADS: '#1a1f17',
    PLAYER_ACCENT: '#ffca28',     // Bright Amber / Brass Chevron & identification star
    PLAYER_LASER_SIGHT: 'rgba(255, 202, 40, 0.35)', // Laser guide line from turret barrel
    
    // Standard Enemy
    ENEMY_STD_HULL: '#7a5a3a',    // Rusty Sand / Mud
    ENEMY_STD_TURRET: '#5e4328',
    ENEMY_STD_TREADS: '#2a2622',
    
    // Hectic / Berserk Enemy
    ENEMY_HECTIC_HULL: '#8c3528', // Dark Rust Red / Aggressive
    ENEMY_HECTIC_TURRET: '#6b251c',
    ENEMY_HECTIC_TREADS: '#221a19',
    
    // Pickups
    AMMO_BIGBOOM: '#d97724',      // Heavy Ordnance Orange
    AMMO_AIRSTRIKE: '#e0a926',    // Amber Warning Yellow
    
    // Projectiles & FX
    BULLET_STANDARD: '#f5d376',
    EXPLOSION_CORE: '#fff2a1',
    EXPLOSION_OUTER: '#cf4417',
    SMOKE: 'rgba(70, 70, 65, 0.5)',
  },

  // Typography
  FONTS: {
    MILITARY_HEADER: '"Courier New", "Lucida Console", monospace',
    MILITARY_HUD: '"Trebuchet MS", "Lucida Console", monospace',
  },

  // Player Settings
  PLAYER: {
    SPEED: 220,             // Pixels per second
    ROTATION_SPEED: 4.5,    // Radians per second for hull realignment
    WIDTH: 42,
    HEIGHT: 34,
    INITIAL_LIVES: 5,         // Starts with 5 lives for tough labyrinth battles
    INVULNERABILITY_TIME: 2.5, // Seconds after getting hit
    BASIC_AMMO_COOLDOWN: 0.25, // Seconds between basic shots
    BASIC_BULLET_SPEED: 520,
    BASIC_BULLET_RANGE: 1200,
    BIGBOOM_SPLASH_RADIUS: 220, // Huge blast that hits through walls
    START_BIGBOOM_AMMO: 1,      // Starts with 1 to test right away, or pickup
  },

  // Default Enemy Balance
  ENEMIES: {
    STANDARD_COUNT: 28,     // +40% increase from 20
    STANDARD_SPEED: 110,
    STANDARD_TURN_RATE: 2.0,
    STANDARD_DETECTION_RANGE: 260,

    HECTIC_COUNT: 10,        // Doubled from 5
    HECTIC_PATROL_SPEED: 130,
    HECTIC_CHARGE_SPEED: 270,
    HECTIC_CHARGE_TURN_RATE: 4.2,
    HECTIC_DETECTION_RANGE: 380,
    HECTIC_LOSE_TARGET_TIME: 3.0,
  },

  // Spawns & Pickups
  PICKUPS: {
    BIGBOOM_AMMO_SPAWNS: 6,     // Placed throughout maze
    BIGBOOM_PER_PICKUP: 2,
    AIRSTRIKE_SPAWNS: 1,        // Strictly 1 per maze
  },

  // Air Strike Settings
  AIRSTRIKE: {
    BOMB_COUNT: 48,
    DURATION: 3.5, // Seconds total bombing run
    CAMERA_SHAKE_MAGNITUDE: 14,
  },

  // 5 Progressive Campaign Sectors
  LEVELS: {
    1: {
      NAME: "BUNKER OUTPOST ALPHA",
      GRID_WIDTH: 27,
      GRID_HEIGHT: 27,
      STANDARD_COUNT: 28,
      HECTIC_COUNT: 10,
      BIGBOOM_SPAWNS: 6,
      WALL_COLOR: '#3d4436',
      WALL_TOP_COLOR: '#4e5745',
      FLOOR_COLOR: '#242720',
      FLOOR_ALT: '#282c23',
    },
    2: {
      NAME: "DESERT STRONGHOLD",
      GRID_WIDTH: 29,
      GRID_HEIGHT: 29,
      STANDARD_COUNT: 32,
      HECTIC_COUNT: 12,
      BIGBOOM_SPAWNS: 7,
      WALL_COLOR: '#544632',
      WALL_TOP_COLOR: '#665740',
      FLOOR_COLOR: '#2d281f',
      FLOOR_ALT: '#332d23',
    },
    3: {
      NAME: "IRON FORGE FOUNDRY",
      GRID_WIDTH: 31,
      GRID_HEIGHT: 31,
      STANDARD_COUNT: 36,
      HECTIC_COUNT: 14,
      BIGBOOM_SPAWNS: 8,
      WALL_COLOR: '#453835',
      WALL_TOP_COLOR: '#5a4945',
      FLOOR_COLOR: '#292221',
      FLOOR_ALT: '#302827',
    },
    4: {
      NAME: "SUBTERRANEAN ARSENAL",
      GRID_WIDTH: 33,
      GRID_HEIGHT: 33,
      STANDARD_COUNT: 40,
      HECTIC_COUNT: 16,
      BIGBOOM_SPAWNS: 9,
      WALL_COLOR: '#343c40',
      WALL_TOP_COLOR: '#444e54',
      FLOOR_COLOR: '#1d2326',
      FLOOR_ALT: '#22292d',
    },
    5: {
      NAME: "CITADEL COMMAND CORE",
      GRID_WIDTH: 35,
      GRID_HEIGHT: 35,
      STANDARD_COUNT: 44,
      HECTIC_COUNT: 20,
      BIGBOOM_SPAWNS: 10,
      WALL_COLOR: '#383a33',
      WALL_TOP_COLOR: '#4d5046',
      FLOOR_COLOR: '#1e201b',
      FLOOR_ALT: '#242621',
    }
  }
};
