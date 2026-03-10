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
  Platform,
  FlatList
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import YouTubeService from '../services/YouTubeService';
import { ThemeContext } from '../theme/ThemeProvider';
import { Youtube, Search, Clipboard as ClipboardIcon } from 'lucide-react-native';

const ImportScreen = ({ navigation }) => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const { theme } = useContext(ThemeContext);
  const accent = theme?.accent || '#FF0000'; // YouTube Rot als Default
  const isDark = theme?.mode === 'dark';

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setPlaylistUrl(text);
        // Auto-extract wenn es eine YouTube URL ist
        const playlistId = YouTubeService.extractPlaylistId(text);
        if (playlistId) {
          Alert.alert('Playlist erkannt!', 'Möchtest du diese Playlist importieren?', [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Importieren', onPress: () => handleImportPlaylist(text) }
          ]);
        }
      } else {
        Alert.alert('Hinweis', 'Die Zwischenablage ist leer');
      }
    } catch (error) {
      console.error('Clipboard error:', error);
      Alert.alert('Fehler', 'Konnte nicht aus Zwischenablage einfügen');
    }
  };

  const handleImportPlaylist = async (url = playlistUrl) => {
    if (!url.trim()) {
      Alert.alert('Fehler', 'Bitte gib eine YouTube Playlist URL ein');
      return;
    }

    const playlistId = YouTubeService.extractPlaylistId(url.trim());
    
    if (!playlistId) {
      Alert.alert('Fehler', 'Keine gültige YouTube Playlist URL erkannt\n\nBeispiele:\n• youtube.com/playlist?list=...\n• youtube.com/watch?v=...&list=...');
      return;
    }

    console.log('=== IMPORT START ===');
    console.log('Playlist ID:', playlistId);

    setIsLoading(true);
    setProgress({ current: 0, total: 0 });
    
    try {
      // Zeige ein loading indicator mit Status
      const info = await YouTubeService.getPlaylistVideos(playlistId);
      setPlaylistInfo(info);
      setProgress({ current: 0, total: info.videos.length });
      
      // Verarbeite Videos zu Track-Format
      const tracks = info.videos.map((video, index) => {
        setProgress({ current: index + 1, total: info.videos.length });
        
        return {
          id: video.id,
          name: video.title,
          artist: video.artist,
          originalYear: video.year,
          youtubeId: video.id,
          youtubeUrl: video.youtubeUrl,
          thumbnail: video.thumbnail,
          type: 'youtube'
        };
      });
      
      navigation.navigate('Review', { 
        playlistInfo: { 
          name: info.title, 
          owner: info.author,
          trackCount: info.videoCount 
        }, 
        tracks: tracks 
      });
      
    } catch (error) {
      console.error('Error importing playlist:', error);
      const errorMessage = error.message || 'Playlist konnte nicht importiert werden.\n\nTippe: Öffentliche Playlists funktionieren am besten.';
      
      Alert.alert('Fehler', errorMessage, [
        { text: 'Verstanden' },
        { text: 'Erneut versuchen', onPress: () => handleImportPlaylist(url) }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchVideos = async () => {
    if (!playlistUrl.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Suchbegriff ein');
      return;
    }

    setIsLoading(true);
    try {
      const results = await YouTubeService.searchVideos(playlistUrl, 20);
      
      if (results.length === 0) {
        Alert.alert('Keine Ergebnisse', 'Keine Videos gefunden.');
        return;
      }

      // Erstelle "Playlist" aus Suchergebnissen
      const tracks = results.map(video => ({
        id: video.id,
        name: video.title,
        artist: video.artist,
        originalYear: video.year,
        youtubeId: video.id,
        youtubeUrl: video.youtubeUrl,
        thumbnail: video.thumbnail,
        type: 'youtube'
      }));

      navigation.navigate('Review', { 
        playlistInfo: { 
          name: `Suche: "${playlistUrl.substring(0, 30)}..."`, 
          owner: 'YouTube Suche',
          trackCount: tracks.length 
        }, 
        tracks: tracks 
      });
      
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Fehler', 'Suche fehlgeschlagen. Bitte versuche es erneut.', [
        { text: 'Verstanden' },
        { text: 'Erneut suchen', onPress: handleSearchVideos }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

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
          {/* YouTube Logo / Header */}
          <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 12 }}>
            <View style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 40, 
              backgroundColor: '#FF0000',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12
            }}>
              <Youtube size={48} color="white" />
            </View>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: 'bold', 
              color: isDark ? '#fff' : '#1a1a1a' 
            }}>
              YouTube Import
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: isDark ? '#aaa' : '#666',
              textAlign: 'center',
              marginTop: 4
            }}>
              Importiere Playlists oder suche nach Videos
            </Text>
          </View>

          {/* Input Section */}
          <View className="mb-4">
            <Text className="text-sm font-semibold mb-2" style={{ color: isDark ? '#fff' : '#111' }}>
              YouTube Playlist URL oder Suchbegriff
            </Text>
            <View className="flex-row items-center">
              <TextInput
                className="flex-1 border border-gray-700 bg-gray-800 text-white p-3 rounded-l-lg"
                style={{ 
                  backgroundColor: isDark ? '#1e1e1e' : '#fff', 
                  color: isDark ? '#fff' : '#111',
                  borderColor: isDark ? '#333' : '#ddd',
                  borderWidth: 1,
                  borderRightWidth: 0
                }}
                value={playlistUrl}
                onChangeText={(text) => setPlaylistUrl(text)}
                placeholder="Link einfügen oder suchen..."
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
                editable={true}
                selectTextOnFocus={true}
                multiline={false}
              />
              <TouchableOpacity 
                className="w-12 h-12 justify-center items-center rounded-r-lg"
                style={{ backgroundColor: accent }}
                onPress={handlePasteFromClipboard}
                activeOpacity={0.7}
              >
                <ClipboardIcon size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <TouchableOpacity 
              className="flex-1 py-4 rounded-lg items-center"
              style={{ 
                backgroundColor: '#FF0000', 
                opacity: isLoading ? 0.7 : 1,
                flexDirection: 'row',
                justifyContent: 'center'
              }}
              onPress={() => handleImportPlaylist()}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator color="#fff" size="small" />
                  <Text className="text-white ml-2">
                    {progress.total > 0 ? `${progress.current}/${progress.total}` : 'Lade...'}
                  </Text>
                </View>
              ) : (
                <>
                  <Youtube size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-bold">Playlist importieren</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 py-4 rounded-lg items-center"
              style={{ 
                backgroundColor: isDark ? '#2c2c2c' : '#f0f0f0', 
                opacity: isLoading ? 0.7 : 1,
                flexDirection: 'row',
                justifyContent: 'center'
              }}
              onPress={handleSearchVideos}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Search size={20} color={isDark ? '#fff' : '#333'} style={{ marginRight: 8 }} />
              <Text className="font-bold" style={{ color: isDark ? '#fff' : '#333' }}>Suchen</Text>
            </TouchableOpacity>
          </View>

          {/* Playlist Info */}
          {playlistInfo && (
            <View className="rounded-lg p-4 mb-4 border" 
              style={{ 
                backgroundColor: isDark ? '#1e1e1e' : '#fff', 
                borderColor: accent,
                borderWidth: 1
              }}
            >
              <Text className="text-sm font-bold mb-3" style={{ color: '#FF0000' }}>
                Playlist Info
              </Text>
              <View className="flex-row mb-2">
                <Text className="text-sm text-gray-400 w-20">Name:</Text>
                <Text className="text-sm flex-1" style={{ color: isDark ? '#fff' : '#111' }} numberOfLines={2}>
                  {playlistInfo.title}
                </Text>
              </View>
              <View className="flex-row mb-2">
                <Text className="text-sm text-gray-400 w-20">Kanal:</Text>
                <Text className="text-sm flex-1" style={{ color: isDark ? '#fff' : '#111' }}>
                  {playlistInfo.author}
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-sm text-gray-400 w-20">Videos:</Text>
                <Text className="text-sm flex-1" style={{ color: isDark ? '#fff' : '#111' }}>
                  {playlistInfo.videoCount}
                </Text>
              </View>
            </View>
          )}

          {/* Help Card */}
          <View className="rounded-lg p-4" 
            style={{ 
              backgroundColor: isDark ? '#1e1e1e' : '#fff', 
              borderColor: isDark ? '#333' : '#e5e7eb', 
              borderWidth: 1 
            }}
          >
            <Text className="text-sm font-bold mb-2" style={{ color: '#FF0000' }}>
              💡 So funktioniert's
            </Text>
            <Text className="text-sm text-gray-400" style={{ marginBottom: 4 }}>
              1. Öffne YouTube
            </Text>
            <Text className="text-sm text-gray-400" style={{ marginBottom: 4 }}>
              2. Finde eine Playlist oder suche Videos
            </Text>
            <Text className="text-sm text-gray-400" style={{ marginBottom: 4 }}>
              3. Kopiere den Link oder gib Stichwörter ein
            </Text>
            <Text className="text-sm text-gray-400">
              4. Wir generieren die QR-Codes automatisch!
            </Text>
            
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDark ? '#333' : '#eee' }}>
              <Text className="text-xs text-gray-500">
                Hinweis: Nur öffentliche Playlists können importiert werden. 
                Private oder "Mix" Playlists (beginnend mit RD) werden nicht unterstützt.
              </Text>
            </View>
          </View>

          {/* Example URLs */}
          <View style={{ marginTop: 16 }}>
            <Text className="text-xs text-gray-500 mb-2">Unterstützte Formate:</Text>
            <Text className="text-xs text-gray-600" style={{ fontFamily: 'monospace' }}>
              • youtube.com/playlist?list=PL...
            </Text>
            <Text className="text-xs text-gray-600" style={{ fontFamily: 'monospace' }}>
              • youtube.com/watch?v=...&list=PL...
            </Text>
            <Text className="text-xs text-gray-600" style={{ fontFamily: 'monospace' }}>
              • Playlist ID direkt (z.B. PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf)
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
});

export default ImportScreen;
