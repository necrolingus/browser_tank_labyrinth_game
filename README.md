# Tank Labyrinth 🎮

A fast-paced top-down military tank labyrinth combat game built with pure native HTML5 Canvas, JavaScript (ES modules), and CSS.

---

## 🕹️ Gameplay & Controls

| Action | Control | Description |
| :--- | :--- | :--- |
| **Move Hull** | `W`, `A`, `S`, `D` | Steers the tank tracks forward, back, left, and right with smooth hull rotation |
| **Aim Turret** | `Mouse Cursor` | 360-degree precision independent turret aiming |
| **Standard Fire** | `Left Mouse Button` | Unlimited standard kinetic shells (1-shot 1-kill on impact) |
| **Big Boom Ordnance** | `Right Mouse Button` | Heavy explosive shells that generate a massive blast wave killing enemies even through solid maze walls! Placed as collectible crates throughout the maze |
| **Air Strike** | `Spacebar` | Summons an apocalyptic carpet bombing run across the entire labyrinth (strictly 1 beacon pickup per maze) |
| **Tactical Path (Cheat)**| `H` | Toggles dynamic BFS breadcrumb navigation showing the exact path to the exit |
| **Pause Game** | `Escape` / `P` | Pause and resume operation |

---

## 🗺️ Campaign Sectors (Levels 1 to 5)

Each sector features unique labyrinth dimensions, escalating enemy armored regiments, and distinctive military environmental palettes:

1. **Sector 1: Bunker Outpost Alpha**
   - *Dimensions:* 27x27 | *Hostiles:* 38 (28 Patrol, 10 Berserkers)
   - *Palette:* Reinforced military concrete & compound tarmac.
2. **Sector 2: Desert Stronghold**
   - *Dimensions:* 29x29 | *Hostiles:* 44 (32 Patrol, 12 Berserkers)
   - *Palette:* Weathered adobe sandstone & desert silt.
3. **Sector 3: Iron Forge Foundry**
   - *Dimensions:* 31x31 | *Hostiles:* 50 (36 Patrol, 14 Berserkers)
   - *Palette:* Rust alloy steel & foundry slag.
4. **Sector 4: Subterranean Arsenal**
   - *Dimensions:* 33x33 | *Hostiles:* 56 (40 Patrol, 16 Berserkers)
   - *Palette:* Dark slate bunker bedrock & deep trench iron.
5. **Sector 5: Citadel Command Core**
   - *Dimensions:* 35x35 | *Hostiles:* 64 (44 Patrol, 20 Berserkers)
   - *Palette:* Heavy hardened bunker composite & armored command decking.

---

## 🎖️ Campaign Finale & Tank Showcase
Upon clearing Sector 5, players are rewarded with an authentic military debriefing and a custom side-profile illustration frame of their **Main Battle Tank - Vanguard Mk-V** complete with road wheels, tread links, sloped armor skirts, and 120mm cannon:
> *"You defeated the bad guys with the support from your hectic ammo and airstrikes, and now you can drive home in your tank—but you're always ready for another call to arms."*


---

## 📟 Retro Bottom Status Bar (Doom / Duke Nukem Style)
The HUD is docked neatly along the bottom of the screen, ensuring the top-left player starting entrance is 100% visible and unobstructed at all times:
- **ARMOR STATUS**: Current lives (`♥♥♥`).
- **SECTOR**: Current level.
- **BIG BOOM [RMB]**: Heavy bunker-busting ammo count.
- **AIR STRIKE [SPACE]**: Standby / Ready status indicator.
- **HOSTILES**: Real-time tally of surviving tanks.
- **TACTICAL COMM / CONTROLS**: Quick reference for controls and path breadcrumbs cheat toggle.

---

## ⚙️ Game Architecture & Configuration Tuning

The codebase is factored into clean, modular ES6 classes with **zero external dependencies** or heavyweight JS frameworks:

- [`index.html`](file:///c:/devstuff/browser_tank_labyrinth_game/index.html) - Main layout, canvas, and HUD overlays.
- [`css/style.css`](file:///c:/devstuff/browser_tank_labyrinth_game/css/style.css) - Gritty dieselpunk / military bunker aesthetic styling (custom military fonts, drab greens, rust accents).
- [`js/config.js`](file:///c:/devstuff/browser_tank_labyrinth_game/js/config.js) - **Tuning parameters!** Every single variable in the game (tank speeds, blast radii, counts, colors, pickup rates) is exposed and easily customized.
- [`js/maze.js`](file:///c:/devstuff/browser_tank_labyrinth_game/js/maze.js) - Procedural labyrinth generation (Recursive Backtracker + tactical corridor loops) and BFS pathfinder solver.
- [`js/player.js`](file:///c:/devstuff/browser_tank_labyrinth_game/js/player.js) - Player tank physics, 360° turret articulation, lives, and collision detection.
- [`js/enemy.js`](file:///c:/devstuff/browser_tank_labyrinth_game/js/enemy.js) - AI patrolling, line-of-sight checks, and hectic charging behaviors.
- [`js/projectiles.js`](file:///c:/devstuff/browser_tank_labyrinth_game/js/projectiles.js) - Shell ballistics, penetrating blast waves, spark particles, and smoke puffs.
- [`js/airstrike.js`](file:///c:/devstuff/browser_tank_labyrinth_game/js/airstrike.js) - Air strike carpet bombardment system with screen shake and warning sirens.
- [`js/camera.js`](file:///c:/devstuff/browser_tank_labyrinth_game/js/camera.js) - Smooth camera tracking and real-time tactical radar minimap.
- [`js/audio.js`](file:///c:/devstuff/browser_tank_labyrinth_game/js/audio.js) - Procedural Web Audio API sound synthesizer (shots, explosions, sirens, pickups).
- [`js/game.js`](file:///c:/devstuff/browser_tank_labyrinth_game/js/game.js) - Game loop, level progression, and input orchestration.

### How to Tweak Parameters

Open [`js/config.js`](file:///c:/devstuff/browser_tank_labyrinth_game/js/config.js):
```javascript
export const CONFIG = {
  PLAYER: {
    SPEED: 220,             // Pixels per second
    INITIAL_LIVES: 3,       // Starting lives
    BIGBOOM_SPLASH_RADIUS: 220, // Blast wave reach (hits behind walls)
  },
  ENEMIES: {
    STANDARD_COUNT: 20,     // Standard wandering enemies
    HECTIC_COUNT: 5,        // Charging berserk enemies
    HECTIC_CHARGE_SPEED: 270,
  },
  // ... and many more
};
```

---

## 🚀 Running the Game

You can run the game in either of two ways:

### Option 1: Direct Double Click
Simply **double-click [`index.html`](file:///c:/devstuff/browser_tank_labyrinth_game/index.html)** in Windows File Explorer! The game runs out-of-the-box using the `file://` protocol with zero setup or servers needed.

### Option 2: Local Web Server
You can also serve it with any static server:
```bash
python -m http.server 8000
```
Navigate to `http://localhost:8000` to play!

