import React, { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';

interface PopProps extends ViewProps {
  children: React.ReactNode;
  delay?: number;
  // Starting scale — lower values give a punchier entrance.
  from?: number;
}

/** Springs its children in from a smaller scale. Use for chips, badges and tiles. */
export default function Pop({ children, delay = 0, from = 0.6, style, ...rest }: PopProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.spring(progress, {
      toValue: 1,
      delay,
      speed: 14,
      bounciness: 10,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, delay]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [from, 1] });
  const opacity = progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' });

  return (
    <Animated.View {...rest} style={[style, { opacity, transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}
