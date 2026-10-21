import 'package:flutter/foundation.dart';

/// Lightweight audio manager for game sound effects.
/// Operates completely offline with safe fallbacks.
class AudioManager {
  static final AudioManager instance = AudioManager._internal();
  AudioManager._internal();

  bool isMuted = false;

  Future<void> init() async {
    // Audio engine initialized locally
    debugPrint('AudioManager: Offline audio manager initialized.');
  }

  void playEngineSound({required double speedRatio}) {
    if (isMuted) return;
    // Pitch-modulated engine feedback (safe offline stub)
  }

  void playCrashSound() {
    if (isMuted) return;
    debugPrint('AudioManager: [SFX] Crash sound triggered');
  }

  void playSiren() {
    if (isMuted) return;
    debugPrint('AudioManager: [SFX] Police siren triggered');
  }

  void playHorn() {
    if (isMuted) return;
    debugPrint('AudioManager: [SFX] Car horn triggered');
  }

  void playDoorSound() {
    if (isMuted) return;
    debugPrint('AudioManager: [SFX] Car door toggle');
  }

  void toggleMute() {
    isMuted = !isMuted;
  }
}

