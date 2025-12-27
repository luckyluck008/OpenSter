import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../theme/ThemeProvider';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const accent = theme?.accent || '#8a2be2';
  const isDark = theme?.mode === 'dark';

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? '#121212' : '#fff' }} edges={['left', 'right', 'bottom']}>
      <ScrollView 
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View className="py-6 px-4 items-center">
          <Text className="text-3xl font-bold" style={{ color: accent }}>🎵 OpenSter</Text>
          <Text className="text-sm text-center mt-1" style={{ color: '#00ced1' }}>Musik-Quiz-Spiel für deine Party</Text>
        </View>

        <View className="px-4">
          <TouchableOpacity 
            className="bg-gray-800 rounded-2xl p-4 mb-3 border"
            style={{ borderColor: isDark ? '#333' : '#e5e7eb' }}
            onPress={() => navigation.navigate('Import')}
            activeOpacity={0.8}
          >
            <View className="w-11 h-11 rounded-full bg-gray-700 justify-center items-center mb-3">
              <Text className="text-xl">🎴</Text>
            </View>
            <Text className="text-lg font-bold text-white mb-2">Spielkarten erstellen</Text>
            <Text className="text-sm text-gray-400 mb-3">Importiere eine Spotify-Playlist und generiere Spielkarten zum Ausdrucken.</Text>
            <View className="bg-purple-600 py-3 px-4 rounded">
              <Text className="text-white text-sm font-semibold">Playlist importieren →</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-gray-800 rounded-2xl p-4 mb-3 border"
            style={{ borderColor: isDark ? '#333' : '#e5e7eb' }}
            onPress={() => navigation.navigate('Jukebox')}
            activeOpacity={0.8}
          >
            <View className="w-11 h-11 rounded-full bg-gray-700 justify-center items-center mb-3">
              <Text className="text-xl">📱</Text>
            </View>
            <Text className="text-lg font-bold text-white mb-2">Jukebox-Modus</Text>
            <Text className="text-sm text-gray-400 mb-3">Scanne QR-Codes und spiele Musik über Spotify oder YouTube ab.</Text>
            <View className="bg-purple-600 py-3 px-4 rounded">
              <Text className="text-white text-sm font-semibold">QR-Scanner starten →</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-gray-800 rounded-2xl p-4 mb-3 border"
            style={{ borderColor: isDark ? '#333' : '#e5e7eb' }}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.8}
          >
            <View className="w-11 h-11 rounded-full bg-gray-700 justify-center items-center mb-3">
              <Text className="text-xl">⚙️</Text>
            </View>
            <Text className="text-lg font-bold text-white mb-2">Einstellungen</Text>
            <Text className="text-sm text-gray-400 mb-3">API-Schlüssel für Spotify, YouTube und OpenAI verwalten.</Text>
            <View className="bg-purple-600 py-3 px-4 rounded">
              <Text className="text-white text-sm font-semibold">Einstellungen öffnen →</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="py-4 items-center">
          <Text className="text-xs text-gray-400">OpenSter - Open Source Musik-Quiz</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8a2be2',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#00ced1',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  featureCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardEmoji: {
    fontSize: 22,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    marginBottom: 12,
  },
  featureButton: {
    backgroundColor: '#8a2be2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  featureButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
  },
});

export default HomeScreen;