import 'package:flutter/foundation.dart';
import '../../storage/local_db.dart';

/// Global in-game state manager tracking cash, wanted level, and vehicle status.
class GameStateManager extends ChangeNotifier {
  static final GameStateManager instance = GameStateManager._internal();
  GameStateManager._internal();

  int _cash = 100;
  int _highScore = 0;
  int _wantedLevel = 0;
  bool _isDriving = false;
  double _currentSpeed = 0.0;
  String _statusMessage = 'Welcome to Retro City';

  int get cash => _cash;
  int get highScore => _highScore;
  int get wantedLevel => _wantedLevel;
  bool get isDriving => _isDriving;
  double get currentSpeed => _currentSpeed;
  String get statusMessage => _statusMessage;

  void loadFromStorage() {
    _cash = LocalDb.getCash();
    _highScore = LocalDb.getHighScore();
    _wantedLevel = 0;
    _isDriving = false;
    _currentSpeed = 0.0;
    notifyListeners();
  }

  void addCash(int amount) {
    _cash = (_cash + amount).clamp(0, 99999999);
    LocalDb.setCash(_cash);
    if (_cash > _highScore) {
      _highScore = _cash;
      LocalDb.recordScore(_highScore);
    }
    notifyListeners();
  }

  void setWantedLevel(int level) {
    final clamped = level.clamp(0, 5);
    if (_wantedLevel != clamped) {
      _wantedLevel = clamped;
      if (clamped > 0) {
        _statusMessage = 'WANTED: $clamped STAR${clamped > 1 ? "S" : ""}';
      } else {
        _statusMessage = 'All clear';
      }
      notifyListeners();
    }
  }

  void triggerCrime({int stars = 1, String reason = 'Civilian collision!'}) {
    if (_wantedLevel < stars) {
      setWantedLevel(stars);
    }
    _statusMessage = reason;
    notifyListeners();
  }

  void clearWantedLevel() {
    setWantedLevel(0);
    _statusMessage = 'Evaded the law!';
    notifyListeners();
  }

  void setDrivingState({required bool isDriving, double speed = 0.0}) {
    _isDriving = isDriving;
    _currentSpeed = speed;
    notifyListeners();
  }

  void updateSpeed(double speed) {
    if (_currentSpeed != speed) {
      _currentSpeed = speed;
      notifyListeners();
    }
  }

  void setStatusMessage(String message) {
    _statusMessage = message;
    notifyListeners();
  }
}

