import React, { useState } from 'react';
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
import MusicBrainzService from '../services/MusicBrainzService';

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
      
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        setProgress({ current: i + 1, total: tracks.length });
        
        let originalYear = null;
        let musicBrainzId = null;
        
        if (!skipMusicBrainz) {
          try {
            const mbInfo = await MusicBrainzService.getEarliestReleaseYear(track.artist, track.name);
            if (mbInfo) {
              originalYear = mbInfo.earliestYear;
              musicBrainzId = mbInfo.recordingId;
            }
          } catch (error) {
            // Ignore MusicBrainz errors, continue without year
            console.log(`MusicBrainz skip for: ${track.name}`);
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

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inputSection}>
            <Text style={styles.label}>Spotify Playlist URL</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.inputWithButton}
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
                style={styles.pasteButton}
                onPress={handlePasteFromClipboard}
                activeOpacity={0.7}
              >
                <Text style={styles.pasteButtonText}>📋</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setSkipMusicBrainz(!skipMusicBrainz)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, skipMusicBrainz && styles.checkboxChecked]}>
              {skipMusicBrainz && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Schnell-Import (ohne Jahressuche)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.importButton, isLoading && styles.buttonDisabled]} 
            onPress={handleImportPlaylist}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.importButtonText}>
                  {progress.total > 0 ? `${progress.current}/${progress.total}` : 'Lade...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.importButtonText}>📥 Playlist importieren</Text>
            )}
          </TouchableOpacity>
          
          {playlistInfo && (
            <View style={styles.playlistCard}>
              <Text style={styles.cardTitle}>Playlist Info</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{playlistInfo.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ersteller:</Text>
                <Text style={styles.infoValue}>{playlistInfo.owner}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tracks:</Text>
                <Text style={styles.infoValue}>{playlistInfo.trackCount}</Text>
              </View>
            </View>
          )}
          
          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>💡 So findest du die URL</Text>
            <Text style={styles.helpText}>1. Öffne Spotify</Text>
            <Text style={styles.helpText}>2. Gehe zur gewünschten Playlist</Text>
            <Text style={styles.helpText}>3. Tippe auf "Teilen" → "Link kopieren"</Text>
            <Text style={styles.helpText}>4. Füge den Link hier ein</Text>
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