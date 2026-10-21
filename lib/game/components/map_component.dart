import 'dart:ui';
import 'package:flame/components.dart';
import 'package:flutter/material.dart';

/// Top-down retro city environment drawn directly using Canvas primitives.
/// No external image textures needed.
class MapComponent extends PositionComponent {
  MapComponent() : super(priority: -10);

  // Map dimensions: 2400 x 2400 world units
  static const double worldWidth = 2400.0;
  static const double worldHeight = 2400.0;
  static const double roadWidth = 140.0;

  final Paint _groundPaint = Paint()..color = const Color(0xFF2C3E50); // Dark urban ground
  final Paint _grassPaint = Paint()..color = const Color(0xFF27AE60);
  final Paint _roadPaint = Paint()..color = const Color(0xFF1E272C); // Dark asphalt
  final Paint _sidewalkPaint = Paint()..color = const Color(0xFF7F8C8D);
  final Paint _buildingPaint = Paint()..color = const Color(0xFF34495E);
  final Paint _buildingRoofPaint = Paint()..color = const Color(0xFF475E77);
  final Paint _buildingTrimPaint = Paint()..color = const Color(0xFFE67E22);
  final Paint _laneDividerPaint = Paint()
    ..color = const Color(0xFFF1C40F)
    ..strokeWidth = 3.0
    ..style = PaintingStyle.stroke;
  final Paint _crosswalkPaint = Paint()
    ..color = const Color(0xFFECF0F1)
    ..strokeWidth = 4.0;

  @override
  Future<void> onLoad() async {
    size = Vector2(worldWidth, worldHeight);
    position = Vector2.zero();
  }

  @override
  void render(Canvas canvas) {
    super.render(canvas);

    // 1. Draw base ground
    canvas.drawRect(Rect.fromLTWH(0, 0, size.x, size.y), _groundPaint);

    // 2. Draw parks / green areas
    canvas.drawRect(const Rect.fromLTWH(80, 80, 360, 360), _grassPaint);
    canvas.drawRect(const Rect.fromLTWH(1300, 1300, 420, 420), _grassPaint);

    // 3. Grid road network (Vertical and Horizontal avenues)
    final verticalRoadXs = [200.0, 700.0, 1200.0, 1700.0, 2200.0];
    final horizontalRoadYs = [200.0, 700.0, 1200.0, 1700.0, 2200.0];

    // Horizontal roads with sidewalks
    for (final y in horizontalRoadYs) {
      // Sidewalks
      canvas.drawRect(
        Rect.fromLTWH(0, y - (roadWidth / 2) - 10, worldWidth, roadWidth + 20),
        _sidewalkPaint,
      );
      // Asphalt
      canvas.drawRect(
        Rect.fromLTWH(0, y - (roadWidth / 2), worldWidth, roadWidth),
        _roadPaint,
      );
      // Center dashed lane markings
      for (double x = 0; x < worldWidth; x += 30) {
        canvas.drawLine(
          Offset(x, y),
          Offset(x + 16, y),
          _laneDividerPaint,
        );
      }
    }

    // Vertical roads with sidewalks
    for (final x in verticalRoadXs) {
      // Sidewalks
      canvas.drawRect(
        Rect.fromLTWH(x - (roadWidth / 2) - 10, 0, roadWidth + 20, worldHeight),
        _sidewalkPaint,
      );
      // Asphalt
      canvas.drawRect(
        Rect.fromLTWH(x - (roadWidth / 2), 0, roadWidth, worldHeight),
        _roadPaint,
      );
      // Center dashed lane markings
      for (double y = 0; y < worldHeight; y += 30) {
        canvas.drawLine(
          Offset(x, y),
          Offset(x, y + 16),
          _laneDividerPaint,
        );
      }
    }

    // 4. Intersections Crosswalks
    for (final x in verticalRoadXs) {
      for (final y in horizontalRoadYs) {
        _drawCrosswalk(canvas, Offset(x, y));
      }
    }

    // 5. Buildings in blocks
    _drawCityBlockBuildings(canvas, 320, 320, 260, 260);
    _drawCityBlockBuildings(canvas, 820, 320, 260, 260);
    _drawCityBlockBuildings(canvas, 1320, 320, 260, 260);
    _drawCityBlockBuildings(canvas, 1820, 320, 260, 260);

    _drawCityBlockBuildings(canvas, 320, 820, 260, 260);
    _drawCityBlockBuildings(canvas, 820, 820, 260, 260);
    _drawCityBlockBuildings(canvas, 1820, 820, 260, 260);

    _drawCityBlockBuildings(canvas, 320, 1320, 260, 260);
    _drawCityBlockBuildings(canvas, 820, 1320, 260, 260);
    _drawCityBlockBuildings(canvas, 1820, 1320, 260, 260);

    _drawCityBlockBuildings(canvas, 320, 1820, 260, 260);
    _drawCityBlockBuildings(canvas, 820, 1820, 260, 260);
    _drawCityBlockBuildings(canvas, 1320, 1820, 260, 260);
    _drawCityBlockBuildings(canvas, 1820, 1820, 260, 260);
  }

  void _drawCrosswalk(Canvas canvas, Offset center) {
    const double span = roadWidth / 2;
    // North crosswalk
    for (double i = -span + 10; i < span - 10; i += 12) {
      canvas.drawLine(
        Offset(center.dx + i, center.dy - span - 10),
        Offset(center.dx + i, center.dy - span),
        _crosswalkPaint,
      );
      // South crosswalk
      canvas.drawLine(
        Offset(center.dx + i, center.dy + span),
        Offset(center.dx + i, center.dy + span + 10),
        _crosswalkPaint,
      );
    }
  }

  void _drawCityBlockBuildings(Canvas canvas, double left, double top, double width, double height) {
    // Drop shadow
    canvas.drawRect(
      Rect.fromLTWH(left + 8, top + 8, width, height),
      Paint()..color = const Color(0x66000000),
    );
    // Base building
    canvas.drawRect(Rect.fromLTWH(left, top, width, height), _buildingPaint);
    // Roof inner ledge
    canvas.drawRect(
      Rect.fromLTWH(left + 12, top + 12, width - 24, height - 24),
      _buildingRoofPaint,
    );
    // Helipad or air unit on rooftop
    canvas.drawCircle(
      Offset(left + width / 2, top + height / 2),
      20,
      _buildingTrimPaint,
    );
  }
}

