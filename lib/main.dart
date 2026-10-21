import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'game/managers/audio_manager.dart';
import 'game/managers/game_state_manager.dart';
import 'game/managers/input_manager.dart';
import 'game/retro_game.dart';
import 'storage/local_db.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Full-screen immersive mode for mobile
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  // Initialize offline persistence
  await LocalDb.init();

  // Prepare game state
  final stateManager = GameStateManager.instance;
  stateManager.loadFromStorage();

  final inputManager = InputManager.instance;
  final audioManager = AudioManager.instance;
  await audioManager.init();

  runApp(
    RetroCityApp(
      stateManager: stateManager,
      inputManager: inputManager,
      audioManager: audioManager,
    ),
  );
}

class RetroCityApp extends StatelessWidget {
  const RetroCityApp({
    super.key,
    required this.stateManager,
    required this.inputManager,
    required this.audioManager,
  });

  final GameStateManager stateManager;
  final InputManager inputManager;
  final AudioManager audioManager;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Retro Outlaw',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: Colors.black,
      ),
      home: GameScreen(
        stateManager: stateManager,
        inputManager: inputManager,
        audioManager: audioManager,
      ),
    );
  }
}

class GameScreen extends StatefulWidget {
  const GameScreen({
    super.key,
    required this.stateManager,
    required this.inputManager,
    required this.audioManager,
  });

  final GameStateManager stateManager;
  final InputManager inputManager;
  final AudioManager audioManager;

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  late final RetroGame _game;
  Offset _joystickKnob = Offset.zero;
  final double _joystickRadius = 55.0;

  @override
  void initState() {
    super.initState();
    _game = RetroGame(
      stateManager: widget.stateManager,
      inputManager: widget.inputManager,
      audioManager: widget.audioManager,
    );
  }

  void _updateJoystickOffset(Offset local) {
    final offset = local - Offset(_joystickRadius, _joystickRadius);
    final distance = offset.distance;
    final clamped = distance > _joystickRadius
        ? Offset(offset.dx / distance * _joystickRadius, offset.dy / distance * _joystickRadius)
        : offset;

    setState(() {
      _joystickKnob = clamped;
    });

    final normalized = Vector2(
      clamped.dx / _joystickRadius,
      clamped.dy / _joystickRadius,
    );
    widget.inputManager.updateJoystick(normalized);
  }

  void _onJoystickEnd() {
    setState(() {
      _joystickKnob = Offset.zero;
    });
    widget.inputManager.resetMovement();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // 1. Flame Game Engine Canvas
          Positioned.fill(
            child: GameWidget(game: _game),
          ),

          // 2. Top HUD Overlay (Cash, Wanted Stars, Speedometer, Status)
          Positioned(
            top: 12,
            left: 24,
            right: 24,
            child: AnimatedBuilder(
              animation: widget.stateManager,
              builder: (context, _) {
                return Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Left HUD: Cash & Status Banner
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.black87,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFF2ECC71), width: 2),
                          ),
                          child: Text(
                            '\$${widget.stateManager.cash.toString().padLeft(6, '0')}',
                            style: const TextStyle(
                              color: Color(0xFF2ECC71),
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 2,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            widget.stateManager.statusMessage,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),

                    // Right HUD: Wanted Stars & Speedometer
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        // Wanted Stars
                        Row(
                          children: List.generate(5, (index) {
                            final isActive = index < widget.stateManager.wantedLevel;
                            return Icon(
                              Icons.star_rounded,
                              size: 28,
                              color: isActive ? const Color(0xFFFFCC00) : Colors.white24,
                              shadows: isActive
                                  ? [
                                      const Shadow(
                                        color: Colors.orange,
                                        blurRadius: 10,
                                      )
                                    ]
                                  : null,
                            );
                          }),
                        ),
                        const SizedBox(height: 6),
                        if (widget.stateManager.isDriving)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.black87,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: Colors.cyanAccent.withValues(alpha: 0.5)),
                            ),
                            child: Text(
                              '${(widget.stateManager.currentSpeed * 0.25).round()} MPH',
                              style: const TextStyle(
                                color: Colors.cyanAccent,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                );
              },
            ),
          ),

          // 3. Bottom-Left Touch Joystick
          Positioned(
            bottom: 24,
            left: 24,
            child: GestureDetector(
              onPanStart: (details) => _updateJoystickOffset(details.localPosition),
              onPanUpdate: (details) => _updateJoystickOffset(details.localPosition),
              onPanEnd: (_) => _onJoystickEnd(),
              onPanCancel: () => _onJoystickEnd(),
              child: Container(
                width: _joystickRadius * 2,
                height: _joystickRadius * 2,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.black45,
                  border: Border.all(color: Colors.white30, width: 2),
                ),
                child: Center(
                  child: Transform.translate(
                    offset: _joystickKnob,
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.8),
                        boxShadow: const [
                          BoxShadow(color: Colors.black54, blurRadius: 6),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),

          // 4. Bottom-Right Action Controls (Enter/Exit Car, Drift/Sprint)
          Positioned(
            bottom: 24,
            right: 24,
            child: AnimatedBuilder(
              animation: widget.stateManager,
              builder: (context, _) {
                final isDriving = widget.stateManager.isDriving;
                return Row(
                  children: [
                    // Drift / Sprint Button
                    GestureDetector(
                      onTapDown: (_) => widget.inputManager.isHandbraking = true,
                      onTapUp: (_) => widget.inputManager.isHandbraking = false,
                      onTapCancel: () => widget.inputManager.isHandbraking = false,
                      child: Container(
                        width: 58,
                        height: 58,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.black54,
                          border: Border.all(color: Colors.orangeAccent, width: 2),
                        ),
                        child: Center(
                          child: Text(
                            isDriving ? 'DRIFT' : 'RUN',
                            style: const TextStyle(
                              color: Colors.orangeAccent,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),

                    // Main Vehicle Toggle Button
                    GestureDetector(
                      onTap: () => widget.inputManager.triggerAction(),
                      child: Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: isDriving
                                ? [const Color(0xFFE74C3C), const Color(0xFFC0392B)]
                                : [const Color(0xFF27AE60), const Color(0xFF2ECC71)],
                          ),
                          boxShadow: const [
                            BoxShadow(color: Colors.black54, blurRadius: 8),
                          ],
                        ),
                        child: Icon(
                          isDriving ? Icons.exit_to_app : Icons.directions_car,
                          color: Colors.white,
                          size: 34,
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
