// HomeScreens.jsx
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Bars3CenterLeftIcon, MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import TrendingBooks from '../components/TrendingBooks';
import BookList from '../components/bookList';
import { useRouter } from 'expo-router';  // Add this import

const HomeScreens = () => {
  const [trending] = useState([
    { id: 1, title: 'Book 1' },
    { id: 2, title: 'Book 2' },
    { id: 3, title: 'Book 3' },
  ]);
  const [upcoming, setUpcoming] = useState([1,2,3]);
  const [topRated, setTopRated] = useState([1,2,3]);

  const router = useRouter();  // Add this

  const handleClick = (item) => {
    console.log('Clicked on:', item.title);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => router.push('/CategoryScreen')}  // Add this
          >
            <Bars3CenterLeftIcon size={30} strokeWidth={2} color="white" />
          </TouchableOpacity>
          <Text style={styles.logoText}>
            <Text style={styles.logoHighlight}>E</Text>-Books
          </Text>
          <TouchableOpacity onPress={() => router.push('/SearchScreen')}>
            <MagnifyingGlassIcon size={30} strokeWidth={2} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Trending Books */}
        <TrendingBooks data={trending} handleClick={handleClick} />

        {/* Upcoming Books */}
        <BookList title="Upcoming Books" data={upcoming} />

        {/* TopRated Books */}
        <BookList title="Top Rated Books" data={topRated} />

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    paddingTop: 25,
  },
  safeArea: {
    backgroundColor: '#1F1F1F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingVertical: 10,
  },
  logoText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  logoHighlight: {
    color: '#eab308',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});

export default HomeScreens;