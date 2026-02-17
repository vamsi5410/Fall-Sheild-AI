import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Line, Rect, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface ECGChartProps {
  ecgValues: number[];
  currentValue: number;
}

const CHART_WIDTH = Dimensions.get('window').width - 48;
const CHART_HEIGHT = 180;
const PADDING_TOP = 10;
const PADDING_BOTTOM = 10;
const DRAWABLE_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
const MAX_POINTS = 80;
const GRID_SPACING = 20;

export function ECGChart({ ecgValues, currentValue }: ECGChartProps) {
  const scanLineX = useSharedValue(0);

  useEffect(() => {
    scanLineX.value = 0;
    scanLineX.value = withRepeat(
      withTiming(CHART_WIDTH, {
        duration: 4000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scanLineX.value }],
  }));

  const values = useMemo(() => {
    if (ecgValues.length === 0) return [0];
    return ecgValues.slice(-MAX_POINTS);
  }, [ecgValues]);

  const { points, minVal, maxVal } = useMemo(() => {
    const min = Math.min(...values) - 0.5;
    const max = Math.max(...values) + 0.5;
    const range = max - min || 1;

    const pts = values
      .map((val, i) => {
        const x = (i / Math.max(values.length - 1, 1)) * CHART_WIDTH;
        const y = PADDING_TOP + DRAWABLE_HEIGHT - ((val - min) / range) * DRAWABLE_HEIGHT;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return { points: pts, minVal: min, maxVal: max };
  }, [values]);

  const lastPoint = useMemo(() => {
    if (values.length === 0) return { x: 0, y: CHART_HEIGHT / 2 };
    const range = maxVal - minVal || 1;
    const lastVal = values[values.length - 1];
    const x = ((values.length - 1) / Math.max(values.length - 1, 1)) * CHART_WIDTH;
    const y = PADDING_TOP + DRAWABLE_HEIGHT - ((lastVal - minVal) / range) * DRAWABLE_HEIGHT;
    return { x, y };
  }, [values, minVal, maxVal]);

  const verticalLines = useMemo(() => {
    const lines = [];
    for (let x = 0; x <= CHART_WIDTH; x += GRID_SPACING) {
      lines.push(x);
    }
    return lines;
  }, []);

  const horizontalLines = useMemo(() => {
    const lines = [];
    for (let y = 0; y <= CHART_HEIGHT; y += GRID_SPACING) {
      lines.push(y);
    }
    return lines;
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.ecgDotOuter}>
            <View style={styles.ecgDotInner} />
          </View>
          <Text style={styles.title}>ECG Monitor</Text>
          <View style={styles.liveTag}>
            <Text style={styles.liveTagText}>LIVE</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.currentVal}>{currentValue.toFixed(2)}</Text>
          <Text style={styles.currentUnit}>mV</Text>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <View style={styles.chartContainer}>
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            <Rect x={0} y={0} width={CHART_WIDTH} height={CHART_HEIGHT} fill="#0A0F14" rx={8} />

            {verticalLines.map((x, i) => (
              <Line
                key={`v${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={CHART_HEIGHT}
                stroke="#1A2A1A"
                strokeWidth={x % (GRID_SPACING * 5) === 0 ? 0.8 : 0.3}
              />
            ))}
            {horizontalLines.map((y, i) => (
              <Line
                key={`h${i}`}
                x1={0}
                y1={y}
                x2={CHART_WIDTH}
                y2={y}
                stroke="#1A2A1A"
                strokeWidth={y % (GRID_SPACING * 5) === 0 ? 0.8 : 0.3}
              />
            ))}

            <Line
              x1={0}
              y1={CHART_HEIGHT / 2}
              x2={CHART_WIDTH}
              y2={CHART_HEIGHT / 2}
              stroke="#1A3A1A"
              strokeWidth={1}
            />

            {values.length > 1 && (
              <Polyline
                points={points}
                fill="none"
                stroke="#00FF41"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            <Circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={3}
              fill="#00FF41"
            />
            <Circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={6}
              fill="#00FF4130"
            />
          </Svg>

          <Animated.View style={[styles.scanLine, scanLineStyle]} />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>{values.length} samples</Text>
        </View>
        <Text style={styles.footerText}>25mm/s | 10mm/mV</Text>
        <Text style={styles.footerText}>Continuous</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ecgDotOuter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00FF4130',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ecgDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00C853',
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  liveTag: {
    backgroundColor: '#F4433610',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveTagText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 8,
    color: '#F44336',
    letterSpacing: 0.8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  currentVal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#00C853',
  },
  currentUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  chartWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  chartContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 3,
    height: CHART_HEIGHT,
    backgroundColor: '#00FF4140',
    borderRadius: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00C853',
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
  },
});
