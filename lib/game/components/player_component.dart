import 'dart:math' as math;
import 'package:flame/collisions.dart';
import 'package:flame/components.dart';
import 'package:flutter/material.dart';
import '../retro_game.dart';
import 'vehicle_component.dart';

/// 2D top-down player character controller.
/// Moves on foot via joystick/keyboard and can enter/exit vehicles.
class PlayerComponent extends PositionComponent
    with HasGameReference<RetroGame>, CollisionCallbacks {
  PlayerComponent({required Vector2 position})
      : super(
          position: position,
          size: Vector2(24, 24),
          anchor: Anchor.center,
          priority: 10,
        );

  final double walkSpeed = 150.0;
  final double sprintSpeed = 220.0;

  // Stride animation counter
  double _strideTimer = 0.0;
  bool _footToggle = false;

  // Reference to current vehicle when driving
  VehicleComponent? currentVehicle;
  bool get isInVehicle => currentVehicle != null;

  // Visual styling
  final Paint _skinPaint = Paint()..color = const Color(0xFFFFCC80); // Skin tone
  final Paint _shirtPaint = Paint()..color = const Color(0xFF1ABC9C); // Teal Hawaiian style shirt
  final Paint _hairPaint = Paint()..color = const Color(0xFF42210B); // Dark brown hair
  final Paint _pantsPaint = Paint()..color = const Color(0xFF2C3E50); // Jeans/Dark trousers

  @override
  Future<void> onLoad() async {
    add(CircleHitbox(radius: 12, anchor: Anchor.center, position: size / 2));
  }

  @override
  void update(double dt) {
    super.update(dt);

    if (isInVehicle) {
      // Synchronize player position with the driven vehicle
      position.setFrom(currentVehicle!.position);
      angle = currentVehicle!.angle;
      return;
    }

    final input = game.inputManager;
    final moveVector = input.movementVector;

    if (moveVector.length > 0.1) {
      // Face towards direction of movement
      // In 2D screen coords: angle = math.atan2(moveVector.x, -moveVector.y)
      angle = math.atan2(moveVector.x, -moveVector.y);

      // Apply on-foot velocity
      final speed = input.isHandbraking ? sprintSpeed : walkSpeed;
      position += moveVector * speed * dt;

      // Footstep stride cycle
      _strideTimer += dt * (speed / 20.0);
      if (_strideTimer >= 1.0) {
        _strideTimer = 0.0;
        _footToggle = !_footToggle;
      }
    }

    // Keep player inside city bounds
    position.x = position.x.clamp(20.0, 2380.0);
    position.y = position.y.clamp(20.0, 2380.0);
  }

  /// Attempts to enter the nearest vehicle within interaction range.
  bool tryEnterVehicle(List<VehicleComponent> vehicles) {
    if (isInVehicle) return false;

    const double enterRadius = 65.0;
    VehicleComponent? closest;
    double minDistance = double.infinity;

    for (final v in vehicles) {
      final dist = position.distanceTo(v.position);
      if (dist < enterRadius && dist < minDistance) {
        minDistance = dist;
        closest = v;
      }
    }

    if (closest != null) {
      currentVehicle = closest;
      closest.isDrivenByPlayer = true;
      game.stateManager.setDrivingState(isDriving: true, speed: closest.speed.abs());
      game.audioManager.playDoorSound();
      return true;
    }
    return false;
  }

  /// Exits the current vehicle and spawns the player at the driver-side door.
  void exitVehicle() {
    if (!isInVehicle) return;

    final vehicle = currentVehicle!;
    vehicle.isDrivenByPlayer = false;

    // Place player beside vehicle (to the left relative to car angle)
    final sideOffset = Vector2(-math.cos(vehicle.angle) * 32, -math.sin(vehicle.angle) * 32);
    position.setFrom(vehicle.position + sideOffset);

    currentVehicle = null;
    game.stateManager.setDrivingState(isDriving: false, speed: 0.0);
    game.audioManager.playDoorSound();
  }

  @override
  void render(Canvas canvas) {
    // When inside vehicle, character is hidden inside car
    if (isInVehicle) return;

    super.render(canvas);

    final w = size.x;
    final h = size.y;
    final cx = w / 2;
    final cy = h / 2;

    // 1. Drop shadow
    canvas.drawCircle(Offset(cx + 2, cy + 2), 10, Paint()..color = const Color(0x44000000));

    // 2. Animated Shoes / Feet (swinging with stride)
    final footOffset = _footToggle ? 3.0 : -3.0;
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 8, cy + footOffset, 5, 8), const Radius.circular(2)),
      _pantsPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx + 3, cy - footOffset, 5, 8), const Radius.circular(2)),
      _pantsPaint,
    );

    // 3. Shoulders and Body (Teal shirt)
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(cx - 9, cy - 6, 18, 12), const Radius.circular(4)),
      _shirtPaint,
    );

    // 4. Arms & Hands
    canvas.drawCircle(Offset(cx - 9, cy - 2), 3.2, _skinPaint);
    canvas.drawCircle(Offset(cx + 9, cy - 2), 3.2, _skinPaint);

    // 5. Head & Face
    canvas.drawCircle(Offset(cx, cy), 6.5, _skinPaint);

    // 6. Hair
    canvas.drawCircle(Offset(cx, cy - 1), 6.0, _hairPaint);

    // 7. Direction indicator (sunglasses/eyes looking forward)
    final eyePaint = Paint()..color = Colors.black;
    canvas.drawCircle(Offset(cx - 2.5, cy - 5), 1.2, eyePaint);
    canvas.drawCircle(Offset(cx + 2.5, cy - 5), 1.2, eyePaint);
  }
}
