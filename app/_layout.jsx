import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomNav from '../components/BottomNavigation';

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [hideNav, setHideNav] = useState(false);

  const [fontsLoaded] = useFonts({
    // your fonts here
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container} onLayout={onLayoutRootView}>
        <Stack
          initialRouteName="index"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'white' }
          }}
          screenListeners={{
            state: (e) => {
              const currentRoute = e.data.state.routes[e.data.state.index].name;
              const hideNavRoutes = [
                'BookScreen', 
                'ReadBookScreen', 
                'RatedBooks', 
                'Login', 
                'signUp',
                'NewBooks', 
                'welcome', 
                'index', 
                'AddStoryScreen', 
                'WritingPage', 
                'SearchScreen', 
                'CategoryScreen'
              ];
              setHideNav(hideNavRoutes.includes(currentRoute));
            }
          }}
        >
          <Stack.Screen 
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="BookScreen"
            options={{
              headerShown: false,
              presentation: 'modal'
            }}
          />
          <Stack.Screen 
            name="categories/[id]" 
            options={{ headerShown: false }} 
          />
          {/* Các Stack.Screen khác giữ nguyên */}
        </Stack>
        
        {!hideNav && <BottomNav />}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {  
    flex: 1,
  },
});