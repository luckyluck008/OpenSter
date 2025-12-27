import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateCardsPDF } from '../components/PDFGenerator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../theme/ThemeProvider';

const PrintScreen = ({ navigation, route }) => {
  const [tracks, setTracks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadTracks();
  }, []);

  const { theme } = useContext(ThemeContext);
  const accent = theme?.accent || '#8a2be2';
  const isDark = theme?.mode === 'dark';

  const loadTracks = async () => {
    try {
      const savedTracks = await AsyncStorage.getItem('selectedTracks');
      if (savedTracks) {
        const parsedTracks = JSON.parse(savedTracks);
        setTracks(parsedTracks);
      }
      setLoaded(true);
    } catch (error) {
      console.error('Fehler beim Laden der Tracks:', error);
      Alert.alert('Fehler', 'Fehler beim Laden der Musikdaten');
    }
  };

  const handleGeneratePDF = async () => {
    if (tracks.length === 0) {
      Alert.alert('Hinweis', 'Keine Musikdaten zum Drucken vorhanden');
      return;
    }

    setIsGenerating(true);
    try {
      await generateCardsPDF(tracks);
    } catch (error) {
      console.error('Fehler bei der PDF-Generierung:', error);
      Alert.alert('Fehler', 'Fehler bei der PDF-Generierung: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!loaded) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? '#121212' : '#fff' }} edges={['left', 'right', 'bottom']}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={accent} />
          <Text className="mt-3 text-gray-400">Lade Daten...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? '#121212' : '#fff' }} edges={['left', 'right', 'bottom']}>
      <ScrollView 
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-lg p-4 mb-5" style={{ backgroundColor: isDark ? '#1e1e1e' : '#fff', borderColor: isDark ? '#333' : '#e5e7eb', borderWidth: 1 }}>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-400">Songs</Text>
            <Text className="text-sm font-bold" style={{ color: accent }}>{tracks.length}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-400">Seiten (A4)</Text>
            <Text className="text-sm font-bold" style={{ color: accent }}>{Math.ceil(tracks.length / 9)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-400">Karten pro Seite</Text>
            <Text className="text-sm font-bold" style={{ color: accent }}>9</Text>
          </View>
        </View>

        <Text className="text-base font-bold text-white mb-3">Vorschau</Text>
        
        <View className="flex-row flex-wrap -mx-1 mb-3">
          {tracks.slice(0, 6).map((track, index) => (
            <View key={index} className="w-1/3 p-1">
              <View className="rounded-lg p-2 items-center" style={{ backgroundColor: isDark ? '#1e1e1e' : '#fff', borderColor: isDark ? '#333' : '#e5e7eb', borderWidth: 1 }}>
                <Text className="text-xs text-gray-400 mb-1" numberOfLines={1}>{track.artist}</Text>
                <Text className="text-xl font-bold mb-1" style={{ color: accent }}>{track.originalYear || '----'}</Text>
                <Text className="text-xs text-white text-center" numberOfLines={1}>{track.name}</Text>
              </View>
            </View>
          ))}
        </View>

        {tracks.length > 6 && (
          <Text className="text-sm text-gray-400 mb-3">+{tracks.length - 6} weitere Karten</Text>
        )}

        {tracks.length === 0 && (
          <View className="rounded-lg p-8 items-center mb-4" style={{ backgroundColor: isDark ? '#1e1e1e' : '#fff', borderColor: isDark ? '#333' : '#e5e7eb', borderWidth: 1 }}>
            <Text className="text-white text-lg font-bold mb-2">Keine Tracks geladen</Text>
            <Text className="text-gray-400">Importiere zuerst eine Playlist</Text>
          </View>
        )}

        <TouchableOpacity 
          className="py-4 rounded-lg items-center mb-4"
          onPress={handleGeneratePDF}
          disabled={isGenerating || tracks.length === 0}
          activeOpacity={0.8}
          style={{ backgroundColor: accent, opacity: (isGenerating || tracks.length === 0) ? 0.7 : 1 }}
        >
          {isGenerating ? (
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#fff" />
              <Text className="text-white ml-2">Generiere PDF...</Text>
            </View>
          ) : (
            <Text className="text-white font-bold">📄 PDF generieren</Text>
          )}
        </TouchableOpacity>
        
        <Text className="text-sm text-gray-400 text-center mt-2">
          Das PDF enthält Vorder- und Rückseiten.{"\n"}Für doppelseitigen Druck verwenden.
        </Text>
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
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    marginTop: 12,
    fontSize: 14,
  },
  statsCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    color: '#999',
    fontSize: 14,
  },
  statValue: {
    color: '#8a2be2',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 12,
  },
  cardPreview: {
    width: '31%',
    aspectRatio: 0.7,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 8,
    margin: '1%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  cardArtist: {
    color: '#999',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardYear: {
    color: '#8a2be2',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 9,
    textAlign: 'center',
  },
  moreText: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyState: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyHint: {
    color: '#666',
    fontSize: 14,
  },
  generateButton: {
    backgroundColor: '#8a2be2',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  hintText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});

export default PrintScreen;