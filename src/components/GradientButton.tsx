import React, { useRef } from 'react';
import { Animated, StyleProp, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GRADIENTS, GradientName, RADIUS, glow } from '../theme';

interface GradientButtonProps extends TouchableOpacityProps {
  label: string;
  gradient?: GradientName;
  size?: 'md' | 'lg';
  containerStyle?: StyleProp<ViewStyle>;
  // Set false for secondary/low-stakes actions that shouldn't buzz.
  haptic?: boolean;
}

export default function GradientButton({
  label,
  gradient = 'purple',
  size = 'lg',
  containerStyle,
  haptic = true,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: GradientButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const colors = GRADIENTS[gradient];

  const pressIn = (e: any) => {
    Animated.spring(scale, { toValue: 0.96, speed: 45, bounciness: 0, useNativeDriver: true }).start();
    onPressIn?.(e);
  };

  const pressOut = (e: any) => {
    Animated.spring(scale, { toValue: 1, speed: 18, bounciness: 10, useNativeDriver: true }).start();
    onPressOut?.(e);
  };

  return (
    <Animated.View
      style={[
        styles.wrap,
        glow(colors[1], disabled ? 0 : 0.4),
        containerStyle,
        { transform: [{ scale }], opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <TouchableOpacity
        {...rest}
        disabled={disabled}
        activeOpacity={0.9}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={e => {
          if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.(e);
        }}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.inner, size === 'md' && styles.innerMd]}
        >
          <Text style={[styles.label, size === 'md' && styles.labelMd]}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap:    { borderRadius: RADIUS.lg, overflow: 'visible' },
  inner:   { borderRadius: RADIUS.lg, paddingVertical: 20, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  innerMd: { paddingVertical: 14, borderRadius: RADIUS.md },
  label:   { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  labelMd: { fontSize: 15, fontWeight: '700' },
});
