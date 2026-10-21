import 'dart:math' as math;
import 'dart:ui';
import 'package:flame/collisions.dart';
import 'package:flame/components.dart';
import 'package:flutter/material.dart';
import '../retro_game.dart';
import 'player_component.dart';
import 'vehicle_component.dart';

/// Civil AI traffic vehicle following predefined waypoints along the city grid.
class NpcTrafficVehicle extends PositionComponent
    with HasGameReference<RetroGame>, CollisionCallbacks {
  NpcTrafficVehicle({
    required Vector2 startPosition,
    required this.waypoints,
    this.cruiseSpeed = 160.0,
    Color? carColor,
  }) : super(
          position: startPosition,
          size: Vector2(32, 60),
          anchor: Anchor.center,
          priority: 4,
        ) {
    paintColor = carColor ?? const Color(0xFF8E44AD); // Purple/Various civil colors
  }

  final List<Vector2> waypoints;
  final double cruiseSpeed;
  late final Color paintColor;

  int _currentWaypointIndex = 0;
  bool _hasCollided = false;

  @override
  Future<void> onLoad() async {
    add(RectangleHitbox(size: size, anchor: Anchor.center, position: size / 2));
  }

  @override
  void update(double dt) {
    super.update(dt);

    if (waypoints.isEmpty) return;

    final target = waypoints[_currentWaypointIndex];
    final toTarget = target - position;
    final dist = toTarget.length;

    if (dist < 20.0) {
      _currentWaypointIndex = (_currentWaypointIndex + 1) % waypoints.length;
    } else {
      final dir = toTarget.normalized();
      // Smoothly steer towards target waypoint
      final targetAngle = math.atan2(dir.x, -dir.y);
      angle = targetAngle;

      position += dir * cruiseSpeed * dt;
    }
  }

  @override
  void onCollisionStart(Set<Vector2> intersectionPoints, PositionComponent other) {
    super.onCollisionStart(intersectionPoints, other);

    // If player or player-driven car crashes into this civil NPC
    if (!_hasCollided) {
      final isPlayer = other is PlayerComponent;
      final isDrivenCar = other is VehicleComponent && other.isDrivenByPlayer;

      if (isPlayer || isDrivenCar) {
        _hasCollided = true;
        game.audioManager.playCrashSound();
        game.triggerCivilianHit();

        // Brief delay before re-enabling collision trigger
        Future.delayed(const Duration(seconds: 3), () {
          _hasCollided = false;
        });
      }
    }
  }

  @override
  void render(Canvas canvas) {
    super.render(canvas);

    final w = size.x;
    final h = size.y;

    // Drop shadow
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(3, 3, w, h), const Radius.circular(5)),
      Paint()..color = const Color(0x44000000),
    );

    // Tires
    final tirePaint = Paint()..color = const Color(0xFF111111);
    canvas.drawRect(Rect.fromLTWH(-2, 8, 4, 12), tirePaint);
    canvas.drawRect(Rect.fromLTWH(w - 2, 8, 4, 12), tirePaint);
    canvas.drawRect(Rect.fromLTWH(-2, h - 20, 4, 12), tirePaint);
    canvas.drawRect(Rect.fromLTWH(w - 2, h - 20, 4, 12), tirePaint);

    // Car Body
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, w, h), const Radius.circular(5)),
      Paint()..color = paintColor,
    );

    // Windshield & Rear glass
    final glassPaint = Paint()..color = const Color(0xFF1F2937);
    canvas.drawRect(Rect.fromLTWH(3, 14, w - 6, 8), glassPaint);
    canvas.drawRect(Rect.fromLTWH(3, h - 20, w - 6, 6), glassPaint);

    // Headlights
    final headlightPaint = Paint()..color = const Color(0xFFFFFF99);
    canvas.drawCircle(Offset(4, 2), 2, headlightPaint);
    canvas.drawCircle(Offset(w - 4, 2), 2, headlightPaint);
  }
}

/// Primitive police vehicle that actively pursues the player locally when wanted level >= 1.
class PolicePursuitVehicle extends PositionComponent
    with HasGameReference<RetroGame>, CollisionCallbacks {
  PolicePursuitVehicle({required Vector2 spawnPosition})
      : super(
          position: spawnPosition,
          size: Vector2(34, 64),
          anchor: Anchor.center,
          priority: 6,
        );

  final double topSpeed = 310.0;
  final double acceleration = 240.0;
  double currentSpeed = 0.0;

  double _sirenTimer = 0.0;
  bool _sirenToggle = false;

  @override
  Future<void> onLoad() async {
    add(RectangleHitbox(size: size, anchor: Anchor.center, position: size / 2));
  }

  @override
  void update(double dt) {
    super.update(dt);

    // Siren strobe
    _sirenTimer += dt;
    if (_sirenTimer >= 0.15) {
      _sirenTimer = 0.0;
      _sirenToggle = !_sirenToggle;
    }

    // Only chase if wanted level >= 1
    if (game.stateManager.wantedLevel < 1) {
      // Idle or stop
      currentSpeed = math.max(0, currentSpeed - 200 * dt);
      return;
    }

    final targetPos = game.playerTargetPosition;
    final toTarget = targetPos - position;
    final dist = toTarget.length;

    if (dist > 15.0) {
      // Calculate angle towards player
      final targetAngle = math.atan2(toTarget.x, -toTarget.y);

      // Smooth angle interpolation
      var diff = targetAngle - angle;
      while (diff < -math.pi) {
        diff += 2 * math.pi;
      }
      while (diff > math.pi) {
        diff -= 2 * math.pi;
      }
      angle += diff.clamp(-3.5 * dt, 3.5 * dt);

      // Accelerate towards player
      currentSpeed = math.min(topSpeed, currentSpeed + acceleration * dt);

      // Apply forward velocity
      final forward = Vector2(math.sin(angle), -math.cos(angle));
      position += forward * currentSpeed * dt;
    }
  }

  @override
  void onCollisionStart(Set<Vector2> intersectionPoints, PositionComponent other) {
    super.onCollisionStart(intersectionPoints, other);

    if (other is PlayerComponent || (other is VehicleComponent && other.isDrivenByPlayer)) {
      game.audioManager.playCrashSound();
      // Increase wanted level if colliding with law enforcement
      if (game.stateManager.wantedLevel < 3) {
        game.stateManager.triggerCrime(
          stars: game.stateManager.wantedLevel + 1,
          reason: 'Ramming law enforcement unit!',
        );
      }
    }
  }

  @override
  void render(Canvas canvas) {
    super.render(canvas);

    final w = size.x;
    final h = size.y;

    // Drop shadow
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(4, 4, w, h), const Radius.circular(6)),
      Paint()..color = const Color(0x55000000),
    );

    // Tires
    final tirePaint = Paint()..color = const Color(0xFF111111);
    canvas.drawRect(Rect.fromLTWH(-3, 8, 5, 14), tirePaint);
    canvas.drawRect(Rect.fromLTWH(w - 2, 8, 5, 14), tirePaint);
    canvas.drawRect(Rect.fromLTWH(-3, h - 22, 5, 14), tirePaint);
    canvas.drawRect(Rect.fromLTWH(w - 2, h - 22, 5, 14), tirePaint);

    // Black & White squad body
    final blackPaint = Paint()..color = const Color(0xFF1A1A1A);
    final whitePaint = Paint()..color = const Color(0xFFEEEEEE);

    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, w, h), const Radius.circular(6)), blackPaint);
    // White doors / roof section
    canvas.drawRect(Rect.fromLTWH(2, 14, w - 4, h - 28), whitePaint);

    // Windshield
    final glassPaint = Paint()..color = const Color(0xFF2C3E50);
    canvas.drawRect(Rect.fromLTWH(4, 15, w - 8, 8), glassPaint);
    canvas.drawRect(Rect.fromLTWH(4, h - 22, w - 8, 6), glassPaint);

    // Flashing emergency lightbar on roof
    final redLight = Paint()..color = _sirenToggle ? const Color(0xFFFF1E27) : const Color(0xFF550505);
    final blueLight = Paint()..color = !_sirenToggle ? const Color(0xFF0066FF) : const Color(0xFF051155);

    canvas.drawRect(Rect.fromLTWH(w / 2 - 11, h / 2 - 4, 10, 8), redLight);
    canvas.drawRect(Rect.fromLTWH(w / 2 + 1, h / 2 - 4, 10, 8), blueLight);
  }
}

