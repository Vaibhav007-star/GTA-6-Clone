import 'dart:math' as math;
import 'package:flame/events.dart';
import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'components/map_component.dart';
import 'components/npc_component.dart';
import 'components/player_component.dart';
import 'components/vehicle_component.dart';
import 'managers/audio_manager.dart';
import 'managers/game_state_manager.dart';
import 'managers/input_manager.dart';

/// Main Flame Game class powering the top-down retro action-driving experience.
class RetroGame extends FlameGame
    with HasCollisionDetection, KeyboardEvents {
  RetroGame({
    required this.stateManager,
    required this.inputManager,
    required this.audioManager,
  });

  final GameStateManager stateManager;
  final InputManager inputManager;
  final AudioManager audioManager;

  late final MapComponent cityMap;
  late final PlayerComponent player;
  final List<VehicleComponent> parkedVehicles = [];
  final List<NpcTrafficVehicle> trafficVehicles = [];
  PolicePursuitVehicle? policePursuit;

  // Chase heat timer to gradually lower wanted level when staying clear of police
  double _wantedCooldownTimer = 0.0;

  Vector2 get playerTargetPosition {
    if (player.isInVehicle) {
      return player.currentVehicle!.position;
    }
    return player.position;
  }

  @override
  Future<void> onLoad() async {
    super.onLoad();

    // 1. Initialize City Map
    cityMap = MapComponent();
    await add(cityMap);

    // 2. Spawn Player at central street
    player = PlayerComponent(position: Vector2(700, 700));
    await add(player);

    // 3. Spawn Parked & Driveable Vehicles
    final carSpawns = [
      (Vector2(650, 700), VehicleType.sedan, math.pi / 2, const Color(0xFF2980B9)),
      (Vector2(750, 680), VehicleType.sports, 0.0, const Color(0xFFE74C3C)),
      (Vector2(1200, 740), VehicleType.muscle, math.pi, const Color(0xFFE67E22)),
      (Vector2(1700, 1180), VehicleType.police, -math.pi / 2, const Color(0xFF1B1B1B)),
      (Vector2(700, 1220), VehicleType.sedan, 0.0, const Color(0xFF16A085)),
    ];

    for (final spawn in carSpawns) {
      final v = VehicleComponent(
        position: spawn.$1,
        type: spawn.$2,
        angle: spawn.$3,
        customColor: spawn.$4,
      );
      parkedVehicles.add(v);
      await add(v);
    }

    // 4. Spawn Civil Traffic along grid corridors
    _spawnCivilTraffic();

    // 5. Setup Action Callback (Enter/Exit Vehicle)
    inputManager.onActionTap = handleActionToggle;

    // 6. Camera follows player
    camera.follow(player, maxSpeed: 600);
  }

  void _spawnCivilTraffic() {
    // Route 1: Vertical 700 Ave
    final route1 = [
      Vector2(700, 150),
      Vector2(700, 2250),
    ];
    final traffic1 = NpcTrafficVehicle(
      startPosition: Vector2(700, 200),
      waypoints: route1,
      cruiseSpeed: 170,
      carColor: const Color(0xFF9B59B6),
    );
    trafficVehicles.add(traffic1);
    add(traffic1);

    // Route 2: Horizontal 1200 Ave
    final route2 = [
      Vector2(200, 1200),
      Vector2(2200, 1200),
    ];
    final traffic2 = NpcTrafficVehicle(
      startPosition: Vector2(300, 1200),
      waypoints: route2,
      cruiseSpeed: 150,
      carColor: const Color(0xFFF39C12),
    );
    trafficVehicles.add(traffic2);
    add(traffic2);

    // Route 3: Loop Corridor
    final route3 = [
      Vector2(1200, 700),
      Vector2(1700, 700),
      Vector2(1700, 1200),
      Vector2(1200, 1200),
    ];
    final traffic3 = NpcTrafficVehicle(
      startPosition: Vector2(1200, 700),
      waypoints: route3,
      cruiseSpeed: 160,
      carColor: const Color(0xFF1ABC9C),
    );
    trafficVehicles.add(traffic3);
    add(traffic3);
  }

  /// Toggle Enter or Exit nearest vehicle
  void handleActionToggle() {
    if (player.isInVehicle) {
      player.exitVehicle();
      camera.follow(player, maxSpeed: 600);
    } else {
      final entered = player.tryEnterVehicle(parkedVehicles);
      if (entered && player.currentVehicle != null) {
        camera.follow(player.currentVehicle!, maxSpeed: 800);
      }
    }
  }

  /// Triggered on collision with civilian traffic
  void triggerCivilianHit() {
    stateManager.triggerCrime(stars: 1, reason: 'Hit & Run! 1-Star Wanted');
    _ensurePoliceSpawned();
  }

  void _ensurePoliceSpawned() {
    if (policePursuit == null) {
      // Spawn police squad car slightly off-screen relative to player
      final offset = Vector2(300, 300);
      final spawnPoint = playerTargetPosition + offset;
      policePursuit = PolicePursuitVehicle(spawnPosition: spawnPoint);
      add(policePursuit!);
      audioManager.playSiren();
    }
  }

  @override
  void update(double dt) {
    super.update(dt);

    // Wanted cooldown logic: if wanted and far from police, gradually reduce
    if (stateManager.wantedLevel > 0) {
      if (policePursuit != null) {
        final dist = policePursuit!.position.distanceTo(playerTargetPosition);
        if (dist > 500) {
          _wantedCooldownTimer += dt;
          if (_wantedCooldownTimer >= 12.0) {
            _wantedCooldownTimer = 0.0;
            final newLevel = stateManager.wantedLevel - 1;
            stateManager.setWantedLevel(newLevel);
            if (newLevel == 0) {
              stateManager.clearWantedLevel();
              if (policePursuit != null) {
                policePursuit!.removeFromParent();
                policePursuit = null;
              }
            }
          }
        } else {
          _wantedCooldownTimer = 0.0;
        }
      }
    }
  }

  @override
  KeyEventResult onKeyEvent(KeyEvent event, Set<LogicalKeyboardKey> keysPressed) {
    inputManager.handleKeyEvent(event, keysPressed);
    return KeyEventResult.handled;
  }
}
