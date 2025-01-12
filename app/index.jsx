import { StyleSheet, ImageBackground, Pressable } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

const backgroundImage = require('../assets/images/LoadingScreen.png'); // Replace with your image path

const index = () => {
  const router = useRouter();

  const handlePress = () => {
    router.push('Login'); // Navigate to the 'signUp' screen
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <ImageBackground source={backgroundImage} style={styles.background} />
    </Pressable>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    resizeMode: 'cover', // Ensures the image covers the entire screen
  },
});
