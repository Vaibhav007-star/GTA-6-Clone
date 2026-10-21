# Retro City: Outlaw (3D Web Edition)

A 3D open-world retro action-driving game built for the web with Three.js (WebGL), procedural Canvas tactical radar, and procedural Web Audio.

---

## 🎮 3D Features
- **3D Open-World City**: Fully rendered in WebGL with asphalt roads, elevated sidewalks, crosswalks, 3D city skyscrapers with rooftop utilities, and Central Green Park with 3D trees and water fountain pond.
- **Third-Person Dynamic Camera**: Cinematic follow camera tracking the player on foot and dynamically pulling back into a chase camera during high-speed driving.
- **3D Vehicle Physics & Drifting**: Drivable 3D vehicles (Executive Sedan, Viper GT, Thunderbolt V8, Metro Interceptor Police Cruiser, Yellow Cab) with individual rotating 3D wheels, front steering angles, suspension body roll, and drifting.
- **Dynamic 3D Lighting & Shadows**: Real-time directional sun casting soft shadows, 3D vehicle spotlights illuminating the street, and emergency strobe lights on police cruisers.
- **Civilian AI Traffic & Pedestrians**: 3D civilian cars navigating avenues and pedestrians traversing sidewalks.
- **5-Star Police Pursuit AI**: Interceptor cruisers spawn and pursue the player in 3D space with dual sirens and ramming maneuvers.
- **Interactive Open-Source Missions**: In-game mission dispatcher for car theft deliveries, checkpoint sprints, and police evasion.
- **In-Game Garage / Spawner**: Spawn any vehicle from `data/vehicles.json` with custom colors and stats right from the pause menu.
- **100% Offline**: Includes offline local Three.js bundle (`js/libs/three.min.js`), offline Web Audio sound synthesizer, and `localStorage` persistence. Zero external network calls.

---

## 🕹️ Controls

### Keyboard (Desktop)
| Action | Key |
|---|---|
| **Move / Steer** | `W` `A` `S` `D` or Arrow keys |
| **Enter / Exit Vehicle** | `F` or `Enter` |
| **Sprint / Handbrake Drift** | `Spacebar` |
| **Punch / Shoot Weapon** | `Left Click` |
| **Switch Weapons** | `1` `2` `3` `4` |
| **Car Horn** | `H` |
| **Mute Audio** | `M` |
| **Pause / Garage / Missions** | `P` |

### Touch (Mobile / Tablet)
- **Virtual Joystick** (Bottom-Left): Steer and move in 3D.
- **ENTER / EXIT** (Bottom-Right): Toggle vehicle entry.
- **DRIFT / RUN**: Hold for handbrake drift or sprint.
- **HORN**: Sound the car horn.

---

## 🚀 How to Run Locally

Serve with Python:
```powershell
python -m http.server 8080
```
Then visit:
`http://localhost:8080` (or open in VS Code Live Server).

