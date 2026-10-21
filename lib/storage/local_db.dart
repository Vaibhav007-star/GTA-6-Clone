import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';

/// Offline local database service for player persistence.
/// Ensures zero network calls and complete offline functionality.
class LocalDb {
  LocalDb._();

  static const String _boxName = 'retro_city_save';
  static const String _keyCash = 'cash';
  static const String _keyHighScore = 'high_score';
  static const String _keyReputation = 'reputation';
  static const String _keyLastWantedLevel = 'wanted_level';

  static Box<dynamic>? _box;

  /// Initializes Hive on the local device storage.
  static Future<void> init() async {
    await Hive.initFlutter();
    _box = await Hive.openBox<dynamic>(_boxName);
    debugPrint('LocalDb: Offline storage successfully initialized.');
  }

  static Box<dynamic> get _activeBox {
    if (_box == null || !_box!.isOpen) {
      throw StateError('LocalDb is not initialized. Call LocalDb.init() first.');
    }
    return _box!;
  }

  /// Current saved player cash balance. Defaults to $100 starting cash.
  static int getCash() {
    return _activeBox.get(_keyCash, defaultValue: 100) as int;
  }

  /// Update saved player cash balance.
  static Future<void> setCash(int amount) async {
    await _activeBox.put(_keyCash, amount);
  }

  /// Add or deduct player cash.
  static Future<int> addCash(int delta) async {
    final current = getCash();
    final updated = (current + delta).clamp(0, 99999999);
    await setCash(updated);
    return updated;
  }

  /// Player high score / max reputation achieved.
  static int getHighScore() {
    return _activeBox.get(_keyHighScore, defaultValue: 0) as int;
  }

  /// Updates high score if new score exceeds record.
  static Future<void> recordScore(int score) async {
    final current = getHighScore();
    if (score > current) {
      await _activeBox.put(_keyHighScore, score);
    }
  }

  /// Stored reputation points.
  static int getReputation() {
    return _activeBox.get(_keyReputation, defaultValue: 0) as int;
  }

  /// Updates reputation points.
  static Future<void> addReputation(int amount) async {
    final current = getReputation();
    await _activeBox.put(_keyReputation, current + amount);
  }

  /// Saved wanted level across sessions (resets to 0 if cleared).
  static int getWantedLevel() {
    return _activeBox.get(_keyLastWantedLevel, defaultValue: 0) as int;
  }

  static Future<void> setWantedLevel(int level) async {
    await _activeBox.put(_keyLastWantedLevel, level);
  }

  /// Reset save data (for debugging or new game).
  static Future<void> resetAll() async {
    await _activeBox.clear();
    await setCash(100);
  }
}

