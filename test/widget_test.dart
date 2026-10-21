import 'package:flutter_test/flutter_test.dart';
import 'package:outlaw/game/managers/game_state_manager.dart';

void main() {
  test('GameStateManager initializes with default values', () {
    final state = GameStateManager.instance;
    expect(state.wantedLevel, 0);
    expect(state.isDriving, isFalse);
    expect(state.currentSpeed, 0.0);
  });

  test('GameStateManager wanted level updates correctly', () {
    final state = GameStateManager.instance;
    state.setWantedLevel(2);
    expect(state.wantedLevel, 2);
    state.clearWantedLevel();
    expect(state.wantedLevel, 0);
  });
}
