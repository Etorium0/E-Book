import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { View, StyleSheet } from 'react-native';
import BottomNav from '../components/BottomNavigation';

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  // Thêm state để kiểm soát việc ẩn/hiện bottom nav
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
    <View style={styles.container} onLayout={onLayoutRootView}>
      <Stack
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'white' }
        }}
        // Thêm screenListeners để theo dõi thay đổi route
        screenListeners={{
          state: (e) => {
            // Lấy tên route hiện tại
            const currentRoute = e.data.state.routes[e.data.state.index].name;
            // Danh sách các route cần ẩn bottom nav
            const hideNavRoutes = ['BookScreen', 'ReadBookScreen', 'Login', 'signUp', 'welcome', 'index', 'AddStoryScreen', 'WritingPage', 'SearchScreen', 'CategoryScreen'];
            // Set state hideNav dựa vào route hiện tại
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
        {/* Các Stack.Screen khác giữ nguyên */}
      </Stack>
      
      {/* Chỉ hiện BottomNav khi hideNav = false */}
      {!hideNav && <BottomNav />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {  
    flex: 1,
  },
});
