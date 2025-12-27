import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import SpotifyService from '../services/SpotifyService';
import { ThemeContext } from '../theme/ThemeProvider';

const ImportScreen = ({ navigation }) => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [skipMusicBrainz, setSkipMusicBrainz] = useState(false);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setPlaylistUrl(text);
      } else {
        Alert.alert('Hinweis', 'Die Zwischenablage ist leer');
      }
    } catch (error) {
      console.error('Clipboard error:', error);
      Alert.alert('Fehler', 'Konnte nicht aus Zwischenablage einfügen');
    }
  };

  const handleImportPlaylist = async () => {
    if (!playlistUrl.trim()) {
      Alert.alert('Fehler', 'Bitte gib eine Spotify Playlist URL ein');
      return;
    }

    console.log('=== IMPORT START ===');
    console.log('Raw URL input:', playlistUrl);

    setIsLoading(true);
    setProgress({ current: 0, total: 0 });
    
    try {
      const playlistId = SpotifyService.extractPlaylistId(playlistUrl.trim());
      console.log('Extracted ID from URL:', playlistId);
      
      const info = await SpotifyService.validatePlaylist(playlistId);
      setPlaylistInfo(info);
      
      const tracks = await SpotifyService.getPlaylistTracks(playlistId);
      setProgress({ current: 0, total: tracks.length });
      
      const enhancedTracks = [];
      
      // Use Spotify API to fetch release dates for imported tracks (faster and often more accurate)
      const trackIds = tracks.map(t => t.id).filter(Boolean);
      let tracksInfoMap = {};
      if (trackIds.length > 0) {
        try {
          const tracksInfo = await SpotifyService.getTracksInfo(trackIds);
          tracksInfoMap = tracksInfo.reduce((acc, t) => {
            acc[t.id] = t;
            return acc;
          }, {});
        } catch (e) {
          console.log('Spotify tracks info fetch failed, will fallback to MusicBrainz where available', e.message);
        }
      }

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        setProgress({ current: i + 1, total: tracks.length });

        let originalYear = null;
        let musicBrainzId = null;

        // Try Spotify first
        const sInfo = tracksInfoMap[track.id];
        if (sInfo && sInfo.release_date) {
          const year = parseInt((sInfo.release_date || '').toString().substring(0, 4));
          if (!isNaN(year)) {
            originalYear = year;
          }
        }

        // If Spotify didn't provide a year and the user didn't opt out, fallback to MusicBrainz
        if (!originalYear && !skipMusicBrainz) {
          try {
            const mbInfo = await MusicBrainzService.getEarliestReleaseYear(track.artist, track.name);
            if (mbInfo) {
              originalYear = mbInfo.earliestYear;
              musicBrainzId = mbInfo.recordingId;
            }
          } catch (error) {
            console.log(`MusicBrainz fallback failed for: ${track.name}`);
          }
        }

        enhancedTracks.push({
          ...track,
          originalYear,
          musicBrainzId,
        });
      }
      
      navigation.navigate('Review', { 
        playlistInfo: info, 
        tracks: enhancedTracks 
      });
      
    } catch (error) {
      console.error('Error importing playlist:', error);
      Alert.alert('Fehler', error.message || 'Playlist konnte nicht importiert werden');
    } finally {
      setIsLoading(false);
    }
  };

  const { theme } = useContext(ThemeContext);
  const accent = theme?.accent || '#8a2be2';
  const isDark = theme?.mode === 'dark';

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? '#121212' : '#fff' }} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          className="flex-1"
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-4">
            <Text className="text-sm font-semibold mb-2" style={{ color: isDark ? '#fff' : '#111' }}>Spotify Playlist URL</Text>
            <View className="flex-row items-center">
              <TextInput
                className="flex-1 border border-gray-700 bg-gray-800 text-white p-3 rounded-l-lg"
                style={{ backgroundColor: isDark ? '#1e1e1e' : '#fff', color: isDark ? '#fff' : '#111' }}
                value={playlistUrl}
                onChangeText={(text) => setPlaylistUrl(text)}
                placeholder="Playlist-Link hier einfügen..."
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
                editable={true}
                selectTextOnFocus={true}
                multiline={false}
                keyboardType="url"
              />
              <TouchableOpacity 
                className="w-12 h-12 justify-center items-center rounded-r-lg"
                style={{ backgroundColor: accent }}
                onPress={handlePasteFromClipboard}
                activeOpacity={0.7}
              >
                <Text className="text-xl">📋</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            className="flex-row items-center mb-4 py-2"
            onPress={() => setSkipMusicBrainz(!skipMusicBrainz)}
            activeOpacity={0.7}
          >
            <View className="w-6 h-6 rounded-md mr-3 justify-center items-center" style={{ borderWidth: 2, borderColor: '#666', backgroundColor: skipMusicBrainz ? accent : 'transparent' }}>
              {skipMusicBrainz && <Text className="text-white">✓</Text>}
            </View>
            <Text className="text-sm text-gray-400">Schnell-Import (ohne Jahressuche)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="py-4 rounded-lg items-center mb-4"
            style={{ backgroundColor: accent, opacity: isLoading ? 0.7 : 1 }}
            onPress={handleImportPlaylist}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#fff" size="small" />
                <Text className="text-white ml-2">{progress.total > 0 ? `${progress.current}/${progress.total}` : 'Lade...'}</Text>
              </View>
            ) : (
              <Text className="text-white font-bold">📥 Playlist importieren</Text>
            )}
          </TouchableOpacity>

          {playlistInfo && (
            <View className="rounded-lg p-4 mb-4 border" style={{ backgroundColor: isDark ? '#1e1e1e' : '#fff', borderColor: accent }}>
              <Text className="text-sm font-bold text-purple-400 mb-3">Playlist Info</Text>
              <View className="flex-row mb-2">
                <Text className="text-sm text-gray-400 w-20">Name:</Text>
                <Text className="text-sm text-white flex-1">{playlistInfo.name}</Text>
              </View>
              <View className="flex-row mb-2">
                <Text className="text-sm text-gray-400 w-20">Ersteller:</Text>
                <Text className="text-sm text-white flex-1">{playlistInfo.owner}</Text>
              </View>
              <View className="flex-row">
                <Text className="text-sm text-gray-400 w-20">Tracks:</Text>
                <Text className="text-sm text-white flex-1">{playlistInfo.trackCount}</Text>
              </View>
            </View>
          )}

          <View className="rounded-lg p-4" style={{ backgroundColor: isDark ? '#1e1e1e' : '#fff', borderColor: '#333', borderWidth: 1 }}>
            <Text className="text-sm font-bold text-teal-400 mb-2">💡 So findest du die URL</Text>
            <Text className="text-sm text-gray-400">1. Öffne Spotify</Text>
            <Text className="text-sm text-gray-400">2. Gehe zur gewünschten Playlist</Text>
            <Text className="text-sm text-gray-400">3. Tippe auf "Teilen" → "Link kopieren"</Text>
            <Text className="text-sm text-gray-400">4. Füge den Link hier ein</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  inputSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWithButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 14,
    borderRadius: 10,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    fontSize: 16,
  },
  pasteButton: {
    backgroundColor: '#8a2be2',
    padding: 14,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
  },
  pasteButtonText: {
    fontSize: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#666',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#8a2be2',
    borderColor: '#8a2be2',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#999',
    fontSize: 14,
  },
  importButton: {
    backgroundColor: '#8a2be2',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  playlistCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#8a2be2',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8a2be2',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    color: '#999',
    fontSize: 14,
    width: 70,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  helpCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00ced1',
    marginBottom: 12,
  },
  helpText: {
    color: '#999',
    marginBottom: 6,
    fontSize: 13,
  },
});

export default ImportScreen;