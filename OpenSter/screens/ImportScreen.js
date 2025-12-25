import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import SpotifyService from '../services/SpotifyService';
import MusicBrainzService from '../services/MusicBrainzService';

const ImportScreen = ({ navigation }) => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playlistInfo, setPlaylistInfo] = useState(null);

  const handleImportPlaylist = async () => {
    if (!playlistUrl.trim()) {
      Alert.alert('Error', 'Please enter a Spotify playlist URL');
      return;
    }

    setIsLoading(true);
    try {
      // Extract playlist ID from URL
      const playlistId = SpotifyService.extractPlaylistId(playlistUrl);
      
      // Validate the playlist
      const info = await SpotifyService.validatePlaylist(playlistId);
      setPlaylistInfo(info);
      
      // Get all tracks from the playlist
      const tracks = await SpotifyService.getPlaylistTracks(playlistId);
      
      // Enhance tracks with MusicBrainz data to get original release years
      const enhancedTracks = [];
      let processedCount = 0;
      
      for (const track of tracks) {
        try {
          // Get the earliest release year for this track
          const mbInfo = await MusicBrainzService.getEarliestReleaseYear(track.artist, track.name);
          
          enhancedTracks.push({
            ...track,
            originalYear: mbInfo?.earliestYear || null,
            musicBrainzId: mbInfo?.recordingId || null,
          });
          
          processedCount++;
          console.log(`Processed ${processedCount}/${tracks.length}: ${track.name} by ${track.artist}`);
        } catch (error) {
          console.error(`Error getting MusicBrainz info for ${track.name}:`, error);
          enhancedTracks.push({
            ...track,
            originalYear: null,
            musicBrainzId: null,
          });
        }
      }
      
      // Navigate to review screen with the enhanced tracks
      navigation.navigate('Review', { 
        playlistInfo: info, 
        tracks: enhancedTracks 
      });
      
    } catch (error) {
      console.error('Error importing playlist:', error);
      Alert.alert('Error', error.message || 'Failed to import playlist');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Import Spotify Playlist</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Spotify Playlist URL</Text>
          <TextInput
            style={styles.input}
            value={playlistUrl}
            onChangeText={setPlaylistUrl}
            placeholder="Paste Spotify playlist URL here..."
            placeholderTextColor="#8b949e"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.importButton} 
          onPress={handleImportPlaylist}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#0d1117" />
          ) : (
            <Text style={styles.importButtonText}>Import Playlist</Text>
          )}
        </TouchableOpacity>
        
        {playlistInfo && (
          <View style={styles.playlistInfoContainer}>
            <Text style={styles.playlistInfoTitle}>Playlist Info:</Text>
            <Text style={styles.playlistInfoText}>Name: {playlistInfo.name}</Text>
            <Text style={styles.playlistInfoText}>Owner: {playlistInfo.owner}</Text>
            <Text style={styles.playlistInfoText}>Tracks: {playlistInfo.trackCount}</Text>
          </View>
        )}
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How to get a Spotify playlist URL:</Text>
          <Text style={styles.infoText}>1. Open Spotify app or website</Text>
          <Text style={styles.infoText}>2. Find the playlist you want to import</Text>
          <Text style={styles.infoText}>3. Click "Share" → "Copy Link"</Text>
          <Text style={styles.infoText}>4. Paste the link above</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#58a6ff',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c9d1d9',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#30363d',
    backgroundColor: '#161b22',
    color: '#c9d1d9',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  importButton: {
    backgroundColor: '#58a6ff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  importButtonText: {
    color: '#0d1117',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playlistInfoContainer: {
    backgroundColor: '#161b22',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363d',
    marginBottom: 20,
  },
  playlistInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#58a6ff',
    marginBottom: 8,
  },
  playlistInfoText: {
    color: '#c9d1d9',
    marginBottom: 5,
    fontSize: 14,
  },
  infoContainer: {
    backgroundColor: '#161b22',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#58a6ff',
    marginBottom: 10,
  },
  infoText: {
    color: '#c9d1d9',
    marginBottom: 5,
    fontSize: 14,
  },
});

export default ImportScreen;