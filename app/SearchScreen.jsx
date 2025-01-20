import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView,
  TouchableOpacity,
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import { database } from '../backend/firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';
import BackButton from '../components/BackButton';
import { useRouter } from 'expo-router';  // Import useRouter

const SearchScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [authors, setAuthors] = useState({});

  useEffect(() => {
    // Fetch authors from Firebase
    const fetchAuthors = async () => {
      try {
        const authorsRef = ref(database, 'authors');
        const snapshot = await get(authorsRef);
        if (snapshot.exists()) {
          setAuthors(snapshot.val());
        }
      } catch (error) {
        console.error('Error fetching authors:', error);
      }
    };
    fetchAuthors();
  }, []);

  // Search function
  const handleSearch = async () => {
    if (searchQuery.trim() === "") {
      setSearchResults([]); // Clear results if no query
      return;
    }

    try {
      const booksRef = ref(database, 'books');
      const snapshot = await get(booksRef);
      const authorsRef = ref(database, 'authors');  // Get authors from Firebase

      if (snapshot.exists()) {
        const books = Object.entries(snapshot.val()).map(([id, book]) => ({
          id,
          ...book
        }));

        // Search and filter books by name or author
        const results = books.filter(book => {
          const bookNameMatch = book.name.toLowerCase().includes(searchQuery.toLowerCase());
          const authorNames = book.authors ? Object.keys(book.authors).map(authorId => authors[authorId]?.name).filter(name => name) : [];
          const authorMatch = authorNames.some(name => name.toLowerCase().includes(searchQuery.toLowerCase()));

          return bookNameMatch || authorMatch;
        });

        // Add author names to each book
        results.forEach(book => {
          const authorNames = book.authors ? Object.keys(book.authors).map(authorId => authors[authorId]?.name).filter(name => name) : [];
          book.authorNames = authorNames.join(', ') || 'Unknown Author';
        });

        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching books:', error);
    }
  };

  const handleChangeText = (text) => {
    setSearchQuery(text);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    const timeout = setTimeout(() => {
      handleSearch();
    }, 300);
    setTypingTimeout(timeout);
  };

  const handleBookClick = (item) => {
    const authorNames = item.authors ? Object.keys(item.authors).map(authorId => authors[authorId]?.name).filter(name => name) : [];
    router.push({
      pathname: '/BookScreen',
      params: {
        id: item.id,
        title: item.name,
        author: authorNames.join(', '),
        description: item.description,
        imageUrl: item.image
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header Search Bar */}
      <View style={styles.searchHeader}>
        <TouchableOpacity>
          <BackButton style={styles.headerIcon} />
        </TouchableOpacity>
        
        <View style={styles.searchInputContainer}>
          <MagnifyingGlassIcon size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={handleChangeText}
          />
        </View>
      </View>

      {/* Search Results */}
      <ScrollView style={styles.resultsContainer}>
        {searchResults.length > 0 ? (
          searchResults.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.resultItem}
              onPress={() => handleBookClick(item)} // Navigate on book click
            >
              <Image source={{ uri: item.image }} style={styles.coverImage} />
              <View style={styles.bookDetails}>
                <Text style={styles.resultText}>{item.name}</Text>
                <Text style={styles.authorText}>{item.authorNames || "Unknown Author"}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noResultsText}>Không tìm thấy kết quả</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F1F1F',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.3,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  coverImage: {
    width: 50,
    height: 75,
    borderRadius: 5,
  },
  bookDetails: {
    marginLeft: 12,
    flex: 1,
  },
  resultText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authorText: {
    color: 'gray',
    fontSize: 14,
  },
  noResultsText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  }
});

export default SearchScreen;
