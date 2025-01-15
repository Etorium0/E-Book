import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

// Import your screens
import LibraryScreen from './LibraryScreen';
import ReadingScreen from './ReadingScreen';
import ToReadScreen from './ToReadScreen';
import FinishedScreen from './FinishedScreen';
import CollectionsScreen from './CollectionsScreen';
import BookDetailScreen from './BookDetailScreen';

const Stack = createStackNavigator();

export default function LibraryNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#000000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Library" 
          component={LibraryScreen}
          options={{
            title: 'My Library'
          }}
        />
        <Stack.Screen 
          name="Reading" 
          component={ReadingScreen}
          options={{
            title: 'Currently Reading'
          }}
        />
        <Stack.Screen 
          name="ToRead" 
          component={ToReadScreen}
          options={{
            title: 'To Read'
          }}
        />
        <Stack.Screen 
          name="Finished" 
          component={FinishedScreen}
          options={{
            title: 'Finished Books'
          }}
        />
        <Stack.Screen 
          name="Collections" 
          component={CollectionsScreen}
          options={{
            title: 'My Collections'
          }}
        />
        <Stack.Screen 
          name="BookDetail" 
          component={BookDetailScreen}
          options={({ route }) => ({
            title: route.params?.title || 'Book Details'
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}