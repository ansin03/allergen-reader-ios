import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleProp, Text, TextStyle } from 'react-native';

interface CountUpProps {
  value: number;
  duration?: number;
  delay?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * Counts from 0 up to `value`. Drives text content, so this one can't use the
 * native driver — keep it to a handful on screen at once.
 */
export default function CountUp({ value, duration = 900, delay = 0, style }: CountUpProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const id = progress.addListener(({ value: v }) => setDisplay(Math.round(v)));
    const animation = Animated.timing(progress, {
      toValue: value,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => {
      animation.stop();
      progress.removeListener(id);
    };
  }, [progress, value, duration, delay]);

  return <Text style={style}>{display}</Text>;
}
