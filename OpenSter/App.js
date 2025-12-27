import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Using a stack-only navigation: no bottom tab bar
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import ThemeProvider, { ThemeContext } from './theme/ThemeProvider';

// Importiere unsere Screens
import SettingsScreen from './screens/SettingsScreen';
import ImportScreen from './screens/ImportScreen';
import ReviewScreen from './screens/ReviewScreen';
import PrintScreen from './screens/PrintScreen';
import JukeboxScreen from './screens/JukeboxScreen';

const Stack = createNativeStackNavigator();
const Tab = null;

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
  const Main = () => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme.mode === 'dark';
    const bgHeader = isDark ? '#121212' : '#ffffff';
    const tabBg = isDark ? '#1e1e1e' : '#f7f7f7';
    const active = theme.accent || '#8a2be2';

    return (
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Jukebox"
          screenOptions={{
            headerStyle: { backgroundColor: bgHeader },
            headerTintColor: isDark ? '#fff' : '#111',
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: isDark ? '#121212' : '#fff' },
          }}
        >
          <Stack.Screen name="Jukebox" component={JukeboxScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Spielkarten" component={SpielkartenStack} options={{ headerShown: false }} />
          <Stack.Screen name="Einstellungen" component={SettingsScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  };

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <Main />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
