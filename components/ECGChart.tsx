import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Line, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface ECGChartProps {
  ecgValues: number[];
  currentValue: number;
}

const CHART_WIDTH = Dimensions.get('window').width - 64;
const CHART_HEIGHT = 140;
const PADDING_TOP = 10;
const PADDING_BOTTOM = 10;
const DRAWABLE_HEIGHT = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

export function ECGChart({ ecgValues, currentValue }: ECGChartProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const values = ecgValues.length > 0 ? ecgValues : [0];
  const minVal = Math.min(...values) - 0.5;
  const maxVal = Math.max(...values) + 0.5;
  const range = maxVal - minVal || 1;

  const points = values
    .map((val, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * CHART_WIDTH;
      const y = PADDING_TOP + DRAWABLE_HEIGHT - ((val - minVal) / range) * DRAWABLE_HEIGHT;
      return `${x},${y}`;
    })
    .join(' ');

  const gridLines = [0.25, 0.5, 0.75].map((pct) => PADDING_TOP + DRAWABLE_HEIGHT * pct);

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <View style={styles.header}>
        <Text style={styles.title}>ECG Waveform</Text>
        <Text style={styles.currentVal}>{currentValue.toFixed(2)} mV</Text>
      </View>
      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Rect x={0} y={0} width={CHART_WIDTH} height={CHART_HEIGHT} fill="transparent" />
          {gridLines.map((y, i) => (
            <Line
              key={i}
              x1={0}
              y1={y}
              x2={CHART_WIDTH}
              y2={y}
              stroke={Colors.cardBorder}
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
          ))}
          {values.length > 1 && (
            <Polyline
              points={points}
              fill="none"
              stroke={Colors.accent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  currentVal: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.accent,
  },
  chartContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
});
