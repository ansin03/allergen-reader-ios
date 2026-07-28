import React, { useRef } from 'react';
import { Animated, TouchableOpacity, TouchableOpacityProps, StyleProp, ViewStyle } from 'react-native';

const RING_COLOR = '#6D28D9';

interface PressRingProps extends TouchableOpacityProps {
  children: React.ReactNode;
  borderRadius?: number;
  // Styles the outer wrapper rather than the button itself. Layout props that
  // position the button in its parent (flex, alignSelf…) belong here — on
  // `style` they'd apply inside the wrapper, which sizes itself to content.
  containerStyle?: StyleProp<ViewStyle>;
}

export default function PressRing({ children, borderRadius = 16, style, containerStyle, onPressIn, onPressOut, ...rest }: PressRingProps) {
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.parallel([
      Animated.timing(ringOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 0.97, speed: 45, bounciness: 0, useNativeDriver: true }),
    ]).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.parallel([
      Animated.timing(ringOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, speed: 20, bounciness: 8, useNativeDriver: true }),
    ]).start();
    onPressOut?.(e);
  };

  return (
    <Animated.View style={[{ borderRadius: borderRadius + 4 }, containerStyle, { transform: [{ scale }] }]}>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -2, left: -2, right: -2, bottom: -2,
          borderRadius: borderRadius + 2,
          borderWidth: 2,
          borderColor: RING_COLOR,
          opacity: ringOpacity,
        }}
      />
      <TouchableOpacity
        {...rest}
        style={[{ borderRadius }, style]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
