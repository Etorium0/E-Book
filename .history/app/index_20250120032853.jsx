import { StyleSheet, ImageBackground, Pressable, View, Text } from 'react-native';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  withTiming,
} from 'react-native-reanimated';

const backgroundImage = require('../assets/images/LoadingScreen.png');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedText = Animated.createAnimatedComponent(Text);

const index = () => {
  const router = useRouter();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate background opacity
    opacity.value = withTiming(1, {
      duration: 1000,
      easing: Easing.ease,
    });

    // Animate text with delay
    textOpacity.value = withDelay(
      500,
      withTiming(1, {
        duration: 800,
      })
    );

    // Subtle pulsing animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.ease }),
        withTiming(1, { duration: 1000, easing: Easing.ease })
      ),
      -1, // Infinite repeat
      true // Reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [
      {
        translateY: withSpring(textOpacity.value * -20),
      },
    ],
  }));

  const handlePress = () => {
    // Animate out
    opacity.value = withTiming(0, {
      duration: 500,
      easing: Easing.ease,
    });
    textOpacity.value = withTiming(0, {
      duration: 300,
      easing: Easing.ease,
    });

    // Navigate after animation
    setTimeout(() => {
      router.push('RatedBooks')
    }, 500);
  };

  return (
    <AnimatedPressable style={[styles.container]} onPress={handlePress}>
      <Animated.View style={[styles.backgroundContainer, animatedStyle]}>
        <ImageBackground source={backgroundImage} style={styles.background}>
        </ImageBackground>
      </Animated.View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundContainer: {
    flex: 1,
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 100,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
});

export default index;