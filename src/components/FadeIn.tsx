import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ViewProps } from 'react-native';

interface FadeInProps extends ViewProps {
  children: React.ReactNode;
  // Stagger sibling entrances by passing an increasing delay (ms).
  delay?: number;
  duration?: number;
  // Distance in px the content travels upward as it fades in.
  offsetY?: number;
}

export default function FadeIn({
  children,
  delay = 0,
  duration = 380,
  offsetY = 14,
  style,
  ...rest
}: FadeInProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, delay, duration]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [offsetY, 0],
  });

  return (
    <Animated.View {...rest} style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
