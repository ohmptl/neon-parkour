# 🏃‍♂️ Neon Parkour - Urban Runner

A smooth and engaging parkour-based video game built with HTML5 Canvas and JavaScript, featuring fluid movement mechanics, particle effects, and progressive level difficulty.

## 🎮 Game Features

### Core Parkour Mechanics
- **Fluid Movement**: Smooth running, jumping, and wall interactions
- **Wall Jumping**: Grab onto walls and launch yourself in new directions
- **Slide Mechanics**: Slide under obstacles while maintaining momentum
- **Dash System**: Double-tap movement keys for quick directional bursts
- **Dynamic Camera**: Smooth camera following that keeps the action centered

### Visual Effects
- **Particle Systems**: Jump trails, landing effects, dash particles, and collection sparkles
- **Glowing Elements**: Neon-themed visual design with dynamic lighting
- **Player Trail**: Motion blur effect that follows the player
- **Animated Environment**: Moving platforms and rotating collectibles

### Level Design
- **Progressive Difficulty**: Each level increases in complexity
- **Multiple Platform Types**: Static, moving, and wall platforms
- **Hazards**: Dangerous obstacles that reset progress
- **Collectibles**: Coins that boost your score
- **Exit Portals**: Swirling goal points with particle effects

## 🎯 Controls

| Key | Action |
|-----|---------|
| **A** / **←** | Move Left |
| **D** / **→** | Move Right |
| **W** / **↑** | Jump / Wall Grab |
| **S** / **↓** | Slide (while running) |
| **Double-tap A/D** | Dash Left/Right |

## 🎨 Visual Design

The game features a **Neon Cyberpunk** aesthetic with:
- Electric blue and cyan color schemes
- Glowing particle effects
- Smooth animations and transitions
- Responsive UI that adapts to different screen sizes

## 🚀 How to Play

1. **Open `index.html`** in your web browser
2. **Click "START GAME"** to begin
3. **Navigate through each level** using parkour moves
4. **Collect coins** to increase your score
5. **Reach the glowing exit portal** to complete the level
6. **Progress through increasingly difficult levels**

## 📊 Scoring System

- **Coins**: 100 points each
- **Time Bonus**: Faster completion = higher score
- **Level Progression**: Each level builds on previous skills

## 🛠️ Technical Features

### Performance Optimizations
- Efficient particle system with automatic cleanup
- Smooth 60fps gameplay loop
- Responsive canvas sizing
- Optimized collision detection

### Code Architecture
- Object-oriented game design
- Modular systems (player, physics, particles, UI)
- Clean separation of game logic and rendering
- Event-driven input handling

## 🎯 Game Mechanics Deep Dive

### Movement Physics
- **Acceleration-based movement** with realistic friction
- **Variable jump height** based on input timing
- **Wall sliding** with reduced fall speed
- **Momentum conservation** during slides and dashes

### Collision System
- **Multi-directional collision detection**
- **Platform-specific behaviors** (ground, walls, moving platforms)
- **Hazard interaction** with visual feedback
- **Collectible pickup** with particle rewards

### Level Generation
- **Procedural platform placement** with complexity scaling
- **Balanced challenge progression**
- **Strategic collectible positioning**
- **Multiple path options** for creative movement

## 🌟 Advanced Features

### Particle Effects
- **Jump particles** when leaving the ground
- **Wall jump sparks** when pushing off walls
- **Landing dust** when hitting platforms at speed
- **Dash energy trails** during boost moves
- **Collection sparkles** when picking up items

### Visual Polish
- **Dynamic shadows and glows**
- **Animated UI elements**
- **Smooth camera interpolation**
- **Responsive design** for different screen sizes

## 🔧 Customization

The game is built with modularity in mind. You can easily:

- **Adjust physics constants** in the player object
- **Modify visual effects** in the particle creation functions
- **Add new platform types** in the level generation system
- **Create custom levels** by modifying the `generateLevel()` function
- **Change the visual theme** by updating the CSS and color schemes

## 🎪 Future Enhancement Ideas

- **Multiple character skins** with different abilities
- **Power-ups** like temporary speed boosts or double jumps
- **Level editor** for creating custom courses
- **Multiplayer race mode** with split-screen or online play
- **Achievement system** with unlockable rewards
- **Sound effects and music** for enhanced immersion

## 🏆 Tips for Players

1. **Master wall jumping** - It's key to reaching higher platforms
2. **Use slides strategically** - Maintain momentum through tight spaces
3. **Time your dashes** - Save them for crossing large gaps
4. **Collect all coins** - They significantly boost your final score
5. **Learn the levels** - Each has multiple possible routes

Enjoy the smooth parkour action and challenge yourself to complete each level with style! 🎮✨
