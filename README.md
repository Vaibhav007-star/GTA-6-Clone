# Retro City: Outlaw

A 2D top-down, retro open-world action-driving game built for the web with HTML5 Canvas, pure JavaScript, and procedural Web Audio.

---

## 🎮 Features
- **Open-World City Grid**: Procedural asphalt roads, sidewalks, zebra crosswalks, urban buildings, and green parks.
- **On-Foot Player Mechanics**: Top-down character with animated walk/sprint stride cycles, health, and directional facing.
- **Arcade Vehicle Physics**: Multiple drivable vehicles (Executive Sedan, Viper GT, Thunderbolt V8, Police Interceptor) with realistic acceleration, reverse, steering proportional to speed, and lateral drifting with persistent tire skid marks and smoke particles.
- **Civilian AI Traffic & Pedestrians**: Cars following road avenues and pedestrians walking along sidewalks.
- **Police Pursuit & Wanted System**: 5-Star wanted heat system. Colliding with civilian cars or police units triggers pursuit AI that calculates vectors to chase and ram the player with flashing sirens.
- **Tactical Radar Mini-Map**: Real-time HUD radar showing roads, player position, parked cars, civilian traffic, and police units.
- **100% Offline & Zero External Assets**: Procedural Web Audio API sound synthesizer (engine revs, sirens, horns, crashes, cash chimes) and procedural Canvas vector graphics. Zero external images or network dependencies.
- **Local Persistence**: Saves cash balance, high scores, and gameplay statistics entirely on-device via `localStorage`.
- **Multi-Device Input**: Full keyboard support for desktop, plus on-screen touch virtual joystick and action buttons for mobile/tablet.

---

## 🕹️ Controls

### Keyboard (Desktop)
| Action | Key |
|---|---|
| **Move / Steer** | `W` `A` `S` `D` or Arrow keys |
| **Enter / Exit Vehicle** | `F` or `Enter` |
| **Sprint / Handbrake Drift** | `Spacebar` |
| **Car Horn** | `H` |
| **Mute Audio** | `M` |
| **Pause / Stats Menu** | `P` |

### Touch (Mobile / Tablet)
- **Virtual Joystick** (Bottom-Left): Drag with thumb to steer/move.
- **ENTER / EXIT** (Bottom-Right): Toggle vehicle entry.
- **DRIFT / RUN**: Hold for handbrake drift or sprint.
- **HORN**: Sound the car horn.

---

## 🚀 How to Run Locally

You can run the game simply by opening `index.html` directly in any web browser (Chrome, Edge, Firefox, Safari), or using Python's built-in server:

```powershell
python -m http.server 8080
```

Then visit:
`http://localhost:8080`
