import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';

// Importiere unsere Screens
import SettingsScreen from './screens/SettingsScreen';
import ImportScreen from './screens/ImportScreen';
import ReviewScreen from './screens/ReviewScreen';
import PrintScreen from './screens/PrintScreen';
import JukeboxScreen from './screens/JukeboxScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack für Spielkarten (Import -> Review -> Print)
function SpielkartenStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#121212' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: '#121212' },
      }}
    >
      <Stack.Screen 
        name="Import" 
        component={ImportScreen} 
        options={{ title: 'Playlist importieren' }}
      />
      <Stack.Screen 
        name="Review" 
        component={ReviewScreen} 
        options={{ title: 'Tracks prüfen' }}
      />
      <Stack.Screen 
        name="Print" 
        component={PrintScreen} 
        options={{ title: 'Karten drucken' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#121212' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            tabBarStyle: {
              backgroundColor: '#1e1e1e',
              borderTopColor: '#333',
              paddingBottom: 8,
              paddingTop: 8,
              height: 65,
            },
            tabBarActiveTintColor: '#8a2be2',
            tabBarInactiveTintColor: '#666',
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
          }}
        >
          <Tab.Screen 
            name="Spielkarten" 
            component={SpielkartenStack}
            options={{
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Text style={{ fontSize: 24 }}>🃏</Text>
              ),
            }}
          />
          <Tab.Screen 
            name="Jukebox" 
            component={JukeboxScreen}
            options={{
              title: 'Jukebox',
              tabBarIcon: ({ color, size }) => (
                <Text style={{ fontSize: 24 }}>🎵</Text>
              ),
            }}
          />
          <Tab.Screen 
            name="Einstellungen" 
            component={SettingsScreen}
            options={{
              title: 'Einstellungen',
              tabBarIcon: ({ color, size }) => (
                <Text style={{ fontSize: 24 }}>⚙️</Text>
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
