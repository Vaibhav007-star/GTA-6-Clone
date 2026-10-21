import 'dart:math' as math;
import 'package:flame/collisions.dart';
import 'package:flame/components.dart';
import 'package:flutter/material.dart';
import '../retro_game.dart';

enum VehicleType { sedan, sports, muscle, police }

/// 2D top-down vehicle with realistic arcade driving physics:
/// acceleration, deceleration, steering, friction, and lateral drifting.
class VehicleComponent extends PositionComponent
    with HasGameReference<RetroGame>, CollisionCallbacks {
  VehicleComponent({
    required Vector2 position,
    this.type = VehicleType.sedan,
    this.isDrivenByPlayer = false,
    double angle = 0,
    Color? customColor,
  }) : super(
          position: position,
          size: Vector2(34, 64), // standard top-down car dimensions
          anchor: Anchor.center,
          angle: angle,
          priority: 5,
        ) {
    bodyColor = customColor ?? _defaultColor(type);
  }

  final VehicleType type;
  bool isDrivenByPlayer;
  late final Color bodyColor;

  // Physics constants
  double maxForwardSpeed = 380.0;
  double maxReverseSpeed = -130.0;
  double accelerationRate = 260.0;
  double brakeRate = 380.0;
  double friction = 140.0; // natural rolling drag
  double turnRate = 2.8; // radians per second at standard speed
  double driftFriction = 0.88; // lateral velocity retention for drifting

  // Dynamic physics state
  double speed = 0.0;
  Vector2 velocity = Vector2.zero();

  // Siren animation for police vehicles
  double _sirenTimer = 0.0;
  bool _sirenState = false;

  static Color _defaultColor(VehicleType type) {
    switch (type) {
      case VehicleType.sports:
        return const Color(0xFFE74C3C); // Vibrant red
      case VehicleType.muscle:
        return const Color(0xFFF39C12); // Orange / Amber
      case VehicleType.police:
        return const Color(0xFF1B1B1B); // Black & White
      case VehicleType.sedan:
        return const Color(0xFF2980B9); // Blue
    }
  }

  @override
  Future<void> onLoad() async {
    // Add collision box
    add(RectangleHitbox(size: size, anchor: Anchor.center, position: size / 2));

    // Vehicle specific stats
    if (type == VehicleType.sports) {
      maxForwardSpeed = 460.0;
      accelerationRate = 340.0;
      turnRate = 3.2;
    } else if (type == VehicleType.police) {
      maxForwardSpeed = 420.0;
      accelerationRate = 300.0;
      turnRate = 3.0;
    }
  }

  @override
  void update(double dt) {
    super.update(dt);

    if (type == VehicleType.police) {
      _sirenTimer += dt;
      if (_sirenTimer >= 0.18) {
        _sirenTimer = 0.0;
        _sirenState = !_sirenState;
      }
    }

    if (isDrivenByPlayer) {
      _handlePlayerDriving(dt);
    } else {
      // Natural coasting to stop if abandoned
      if (speed.abs() > 0.01) {
        final decel = friction * dt;
        if (speed > 0) {
          speed = math.max(0, speed - decel);
        } else {
          speed = math.min(0, speed + decel);
        }
      }
      _applyVelocity(dt);
    }

    // Keep vehicle inside world boundaries
    position.x = position.x.clamp(40.0, 2360.0);
    position.y = position.y.clamp(40.0, 2360.0);
  }

  void _handlePlayerDriving(double dt) {
    final input = game.inputManager;
    final moveVector = input.movementVector;

    // Steering: x axis of joystick or A/D keys
    if (moveVector.x != 0 && speed.abs() > 10.0) {
      // Turn direction flips in reverse for natural car handling
      final reverseMultiplier = speed >= 0 ? 1.0 : -1.0;
      final speedFactor = (speed.abs() / maxForwardSpeed).clamp(0.25, 1.0);
      angle += moveVector.x * turnRate * speedFactor * reverseMultiplier * dt;
    }

    // Acceleration & Braking: y axis of joystick or W/S keys
    final throttle = -moveVector.y; // Up is negative Y in 2D Flame coords
    if (throttle > 0.1) {
      // Accelerating forward
      speed += accelerationRate * throttle * dt;
      if (speed > maxForwardSpeed) speed = maxForwardSpeed;
    } else if (throttle < -0.1) {
      // Braking or reversing
      if (speed > 0) {
        speed -= brakeRate * (-throttle) * dt;
      } else {
        speed -= accelerationRate * 0.6 * (-throttle) * dt;
        if (speed < maxReverseSpeed) speed = maxReverseSpeed;
      }
    } else {
      // Coasting friction
      final decel = friction * dt;
      if (speed > 0) {
        speed = math.max(0, speed - decel);
      } else if (speed < 0) {
        speed = math.min(0, speed + decel);
      }
    }

    // Handbrake / Drift button
    if (input.isHandbraking && speed > 50) {
      speed *= math.pow(0.5, dt).toDouble(); // fast brake
    }

    _applyVelocity(dt);

    // Sync speed with HUD
    game.stateManager.updateSpeed(speed.abs());
  }

  void _applyVelocity(double dt) {
    // Top-down car forward heading vector
    // Heading angle: 0 points UP (so -Y is forward)
    final forward = Vector2(math.sin(angle), -math.cos(angle));

    // Desired forward velocity
    final targetVelocity = forward * speed;

    // Drift physics: interpolate velocity toward target heading
    velocity.lerp(targetVelocity, 1.0 - math.pow(1.0 - driftFriction, dt * 10).toDouble());

    // Update position
    position += velocity * dt;
  }

  @override
  void render(Canvas canvas) {
    super.render(canvas);

    // Note: Flame positions local canvas with (0,0) at top-left of size.
    // Since anchor is center, let's draw relative to size (0 to size.x, 0 to size.y).

    final w = size.x;
    final h = size.y;

    // 1. Vehicle Drop Shadow
    final shadowPaint = Paint()..color = const Color(0x55000000);
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(4, 4, w, h), const Radius.circular(6)),
      shadowPaint,
    );

    // 2. Tires (4 wheels)
    final tirePaint = Paint()..color = const Color(0xFF111111);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(-3, 8, 5, 14), const Radius.circular(2)), tirePaint);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(w - 2, 8, 5, 14), const Radius.circular(2)), tirePaint);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(-3, h - 22, 5, 14), const Radius.circular(2)), tirePaint);
    canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromLTWH(w - 2, h - 22, 5, 14), const Radius.circular(2)), tirePaint);

    // 3. Main Car Chassis
    final bodyPaint = Paint()..color = bodyColor;
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, w, h), const Radius.circular(6)),
      bodyPaint,
    );

    // 4. Roof & Cabin
    final roofPaint = Paint()..color = Color.lerp(bodyColor, Colors.black, 0.25)!;
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(3, 14, w - 6, h - 28), const Radius.circular(4)),
      roofPaint,
    );

    // 5. Windshields (Front & Rear glass)
    final glassPaint = Paint()..color = const Color(0xFF2C3E50);
    // Front windshield
    canvas.drawRect(Rect.fromLTWH(4, 15, w - 8, 9), glassPaint);
    // Rear windshield
    canvas.drawRect(Rect.fromLTWH(4, h - 23, w - 8, 7), glassPaint);

    // 6. Headlights & Taillights
    final headlightPaint = Paint()..color = const Color(0xFFFFF9D2);
    final taillightPaint = Paint()..color = const Color(0xFFE74C3C);

    // Front headlights
    canvas.drawCircle(Offset(4, 2), 2.5, headlightPaint);
    canvas.drawCircle(Offset(w - 4, 2), 2.5, headlightPaint);

    // Rear taillights
    canvas.drawRect(Rect.fromLTWH(2, h - 3, 6, 2.5), taillightPaint);
    canvas.drawRect(Rect.fromLTWH(w - 8, h - 3, 6, 2.5), taillightPaint);

    // 7. Police Lights Bar (Flashing blue & red)
    if (type == VehicleType.police) {
      final redLight = Paint()..color = _sirenState ? const Color(0xFFFF0033) : const Color(0xFF550011);
      final blueLight = Paint()..color = !_sirenState ? const Color(0xFF0066FF) : const Color(0xFF001155);

      canvas.drawRect(Rect.fromLTWH(w / 2 - 10, h / 2 - 3, 9, 6), redLight);
      canvas.drawRect(Rect.fromLTWH(w / 2 + 1, h / 2 - 3, 9, 6), blueLight);
    }
  }
}
