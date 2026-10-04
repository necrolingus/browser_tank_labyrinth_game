# browser game, tank labyrinth

## Tech stack
Native JS and CSS and HTML. You can use bootstrap and jquery etc, but no JS frameworks like Angular, React, etc
Factor the code properly and parameterize all values. This game and its repo will be made publicly available so users must be able to tweak the values as they see fit
Be sure to create a readme.md explaining how the game works and its parameters
Be sure to update the requirements.md with any new requirements and reafactor it where needed

## How the game works
The game is top down
The game must have 5 levels
Dont use typical AI colors like purple, blue, vaporwave, etc
Dont use typical AI fonts like roboto
Dont worry about mobile controls, only keyboard and mouse.
WASD moves the tank forward, backward, left, right, and the mouse controls the 360 degree turret. 
Left mouse button shoots basic ammo (unlimited) that explodes on enemy impact (1 shot 1 kill)
Right mouse button shoots "big boom" ammo that creates a massive explosion that can kills enemies even if they are behind walls. This ammo must be placed randomly throughout the maze for the user to pick up.
There must be 1 singular "air strike" ammo placed randomly in the maze. Pressing space bar launches the air strike that bombs the entire maze
There must be 20 standard enemies per maze that just drives around, and 5 hectic enemies that charge when they spot you
The tank starts at the entrance of the labyrinth and the user must navigate through the labyrinth to the exit (only 1 exit). Pressing H shows the user the path (in case they feel like cheating!)
The tank has 3 lives. If an enemy hits you you lose a life

## Status & Implementation Notes
- **All 5 Levels Implemented**:
  - **Sector 1**: Bunker Outpost Alpha (27x27 grid, 38 hostiles)
  - **Sector 2**: Desert Stronghold (29x29 grid, 44 hostiles)
  - **Sector 3**: Iron Forge Foundry (31x31 grid, 50 hostiles)
  - **Sector 4**: Subterranean Arsenal (33x33 grid, 56 hostiles)
  - **Sector 5**: Citadel Command Core (35x35 grid, 64 hostiles)
- **Player Armor**: 5 lives default, responsive WASD drive + 360° turret laser guide line.
- **Weaponry & Audio**:
  - LMB standard kinetic shells (1-shot 1-kill).
  - RMB Big Boom bunker busters (kills through solid labyrinth walls).
  - Spacebar Air Strike (maze-wide carpet bomb run).
  - High-intensity power-up sound synthesizer specifically for Air Strike beacon acquisition.
- **Campaign Finale**: Level 5 victory sequence with custom side-view tank illustration frame (`Vanguard Mk-V`) and homecoming story card.
- **Parameters**: Cleanly parameterized in `js/config.js` for community tweaking and modding.

