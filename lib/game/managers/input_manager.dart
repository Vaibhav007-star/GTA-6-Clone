import 'package:flame/extensions.dart';
import 'package:flutter/services.dart';

/// Central input manager coordinating keyboard and touch/joystick events.
class InputManager {
  static final InputManager instance = InputManager._internal();
  InputManager._internal();

  /// Direction vector (-1.0 to 1.0 on both axes).
  Vector2 movementVector = Vector2.zero();

  /// Action flags
  bool isActionPressed = false; // Enter/Exit vehicle
  bool isAccelerating = false;
  bool isBraking = false;
  bool isHandbraking = false;
  bool isHornPressed = false;

  /// Callbacks
  VoidCallback? onActionTap;

  void updateJoystick(Vector2 direction) {
    movementVector.setFrom(direction);
  }

  void resetMovement() {
    movementVector.setZero();
  }

  void triggerAction() {
    onActionTap?.call();
  }

  /// Keyboard handling for desktop/testing
  bool handleKeyEvent(KeyEvent event, Set<LogicalKeyboardKey> keysPressed) {
    double x = 0;
    double y = 0;

    if (keysPressed.contains(LogicalKeyboardKey.keyA) ||
        keysPressed.contains(LogicalKeyboardKey.arrowLeft)) {
      x -= 1;
    }
    if (keysPressed.contains(LogicalKeyboardKey.keyD) ||
        keysPressed.contains(LogicalKeyboardKey.arrowRight)) {
      x += 1;
    }
    if (keysPressed.contains(LogicalKeyboardKey.keyW) ||
        keysPressed.contains(LogicalKeyboardKey.arrowUp)) {
      y -= 1;
    }
    if (keysPressed.contains(LogicalKeyboardKey.keyS) ||
        keysPressed.contains(LogicalKeyboardKey.arrowDown)) {
      y += 1;
    }

    movementVector.setValues(x, y);
    if (movementVector.length > 1.0) {
      movementVector.normalize();
    }

    isAccelerating = keysPressed.contains(LogicalKeyboardKey.keyW) ||
        keysPressed.contains(LogicalKeyboardKey.arrowUp);
    isBraking = keysPressed.contains(LogicalKeyboardKey.keyS) ||
        keysPressed.contains(LogicalKeyboardKey.arrowDown);
    isHandbraking = keysPressed.contains(LogicalKeyboardKey.space);

    if (event is KeyDownEvent &&
        (event.logicalKey == LogicalKeyboardKey.keyF ||
            event.logicalKey == LogicalKeyboardKey.enter)) {
      triggerAction();
    }

    return true;
  }
}
