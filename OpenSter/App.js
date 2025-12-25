import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importiere unsere Screens
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import ImportScreen from './screens/ImportScreen';
import ReviewScreen from './screens/ReviewScreen';
import PrintScreen from './screens/PrintScreen';
import JukeboxScreen from './screens/JukeboxScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#121212', // Dunkler Hintergrund
            },
            headerTintColor: '#fff', // Weiße Textfarbe
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            cardStyle: {
              backgroundColor: '#121212', // Dunkler Hintergrund für alle Screens
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'OpenSter' }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ title: 'Einstellungen' }}
          />
          <Stack.Screen 
            name="Import" 
            component={ImportScreen} 
            options={{ title: 'Playlist importieren' }}
          />
          <Stack.Screen 
            name="Review" 
            component={ReviewScreen} 
            options={{ title: 'Musikdaten überprüfen' }}
          />
          <Stack.Screen 
            name="Print" 
            component={PrintScreen} 
            options={{ title: 'Spielkarten drucken' }}
          />
          <Stack.Screen 
            name="Jukebox" 
            component={JukeboxScreen} 
            options={{ title: 'Jukebox-Modus' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
