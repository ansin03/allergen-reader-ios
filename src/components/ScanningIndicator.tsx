import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

const PURPLE = '#6D28D9';
const MUTED = '#9CA3AF';

const BOX_WIDTH = 170;
const BOX_HEIGHT = 210;
const BEAM_HEIGHT = 3;

// Faux ingredient lines, so the card reads as a label being scanned.
const LINE_WIDTHS = ['86%', '94%', '72%', '90%', '64%', '88%', '78%'] as const;

const MESSAGES = [
  'Reading the label',
  'Extracting ingredients',
  'Checking your allergens',
];

export default function ScanningIndicator() {
  const sweep = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(1)).current;
  const [messageIndex, setMessageIndex] = useState(0);

  // Continuous top-to-bottom-and-back scan beam.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(sweep, {
          toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  // Cross-fade through the status messages.
  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(messageOpacity, {
        toValue: 0, duration: 200, useNativeDriver: true,
      }).start(() => {
        setMessageIndex(i => (i + 1) % MESSAGES.length);
        Animated.timing(messageOpacity, {
          toValue: 1, duration: 200, useNativeDriver: true,
        }).start();
      });
    }, 2100);
    return () => clearInterval(id);
  }, [messageOpacity]);

  const beamTranslate = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BOX_HEIGHT - BEAM_HEIGHT],
  });

  // The beam softens at the extremes so it reads as a sweep, not a hard bar.
  const beamOpacity = sweep.interpolate({
    inputRange: [0, 0.12, 0.88, 1],
    outputRange: [0.25, 1, 1, 0.25],
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.box}>
        <View style={styles.lines}>
          {LINE_WIDTHS.map((width, i) => (
            <View key={i} style={[styles.line, { width }]} />
          ))}
        </View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.beam,
            { opacity: beamOpacity, transform: [{ translateY: beamTranslate }] },
          ]}
        />

        {/* Corner brackets — a viewfinder framing the label. */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>

      <Animated.Text style={[styles.message, { opacity: messageOpacity }]}>
        {MESSAGES[messageIndex]}
      </Animated.Text>
      <Text style={styles.hint}>This usually takes a few seconds</Text>
    </View>
  );
}

const CORNER = 18;
const CORNER_WIDTH = 2.5;

const styles = StyleSheet.create({
  wrap:      { alignItems: 'center' },
  box:       { width: BOX_WIDTH, height: BOX_HEIGHT, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', justifyContent: 'center' },
  lines:     { paddingHorizontal: 18, gap: 10 },
  line:      { height: 7, borderRadius: 4, backgroundColor: '#EEF0F3' },
  beam:      { position: 'absolute', left: 0, right: 0, height: BEAM_HEIGHT, backgroundColor: PURPLE, shadowColor: PURPLE, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },

  corner:    { position: 'absolute', width: CORNER, height: CORNER, borderColor: PURPLE },
  cornerTL:  { top: 8,    left: 8,  borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH,  borderTopLeftRadius: 6 },
  cornerTR:  { top: 8,    right: 8, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderTopRightRadius: 6 },
  cornerBL:  { bottom: 8, left: 8,  borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH,  borderBottomLeftRadius: 6 },
  cornerBR:  { bottom: 8, right: 8, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderBottomRightRadius: 6 },

  message:   { marginTop: 28, fontSize: 16, fontWeight: '700', color: '#111827', letterSpacing: -0.2 },
  hint:      { marginTop: 6, fontSize: 13, color: MUTED },
});
