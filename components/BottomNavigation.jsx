import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

const TabButton = ({ label, icon, isCurrent, onPress }) => {
  const scaleValue = new Animated.Value(1);

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={animatePress} style={styles.tabButtonContainer}>
      <Animated.View 
        style={[
          styles.tabButton,
          isCurrent && styles.activeTabButton,
          { transform: [{ scale: scaleValue }] }
        ]}
      >
        <Ionicons
          name={icon}
          size={24}
          color={isCurrent ? '#FFFFFF' : '#666666'}
        />
        {isCurrent && (
          <Text style={styles.tabLabel}>
            {label}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const BottomNav = () => {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { label: 'Home', icon: 'home-outline', route: '/HomeScreens' },
    { label: 'Library', icon: 'library-outline', route: '/LibraryScreen' },
    { label: 'Write', icon: 'create-outline', route: '/WriteScreen' },
    { label: 'Profile', icon: 'person-outline', route: '/ProfileScreen' },
  ];

  const hideOnRoutes = ['/Login', '/signUp', '/welcome', '/ReadBookScreen', '/index', '/AudioScreen'];
  if (hideOnRoutes.includes(pathname)) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.navContent}>
        {tabs.map((tab) => (
          <TabButton
            key={tab.route}
            label={tab.label}
            icon={tab.icon}
            isCurrent={pathname === tab.route}
            onPress={() => router.push(tab.route)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: -10, // Thay đổi từ 20 thành 0
    left: 0, // Thay đổi từ 20 thành 0
    right: 0, // Thay đổi từ 20 thành 0
    backgroundColor: '#1F1F1F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10, // Thêm padding bottom cho iOS
  },
  navContent: {
    flexDirection: 'row',
    padding: 8,
    justifyContent: 'space-around',
    // Bỏ backgroundColor và borderRadius vì đã move lên container
  },
  tabButtonContainer: {
    flex: 1,
    alignItems: 'center',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 20,
    minWidth: 60,
    gap: 8,
  },
  activeTabButton: {
    backgroundColor: '#A2B2FC',
  },
  tabLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BottomNav;
