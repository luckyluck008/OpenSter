import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Button
} from 'react-native';
import QRScanner from '../components/QRScanner';
import { useSecureStore } from '../services/SecureStoreService';

const JukeboxScreen = ({ navigation }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { getSecureItem } = useSecureStore();

  // Überprüfe Spotify-Verbindung beim Start
  useEffect(() => {
    checkSpotifyConnection();
  }, []);

  const checkSpotifyConnection = async () => {
    try {
      const clientId = await getSecureItem('spotifyClientId');
      const clientSecret = await getSecureItem('spotifyClientSecret');
      
      if (clientId && clientSecret) {
        // In einer echten Implementierung würde hier eine Verbindung zu Spotify hergestellt
        setSpotifyConnected(true);
      } else {
        setSpotifyConnected(false);
      }
    } catch (error) {
      console.error('Fehler beim Überprüfen der Spotify-Verbindung:', error);
      setSpotifyConnected(false);
    }
  };

  const handleScanStart = () => {
    setIsScanning(true);
  };

  const handleScanComplete = (qrData) => {
    setIsScanning(false);
    const qrText = qrData.data;
    
    if (qrText.startsWith('os:sp:')) {
      const trackId = qrText.substring(6); // Entferne 'os:sp:' Präfix
      playTrack(trackId);
    } else {
      Alert.alert('Ungültiger QR-Code', 'Der gescannte Code ist kein gültiger OpenSter-Code.');
    }
  };

  const handleScanCancel = () => {
    setIsScanning(false);
  };

  const playTrack = async (trackId) => {
    setLoading(true);
    try {
      // Simuliere das Wiedergabeverhalten
      if (spotifyConnected) {
        // In einer echten Implementierung würde hier das Spotify Remote SDK verwendet
        console.log('Spiele Track auf Spotify ab:', trackId);
        setCurrentTrack({ id: trackId, name: 'Aktueller Track', artist: 'Aktueller Künstler' });
        setIsPlaying(true);
        
        // Simuliere das Ende der Wiedergabe nach 30 Sekunden
        setTimeout(() => {
          setIsPlaying(false);
          setCurrentTrack(null);
        }, 30000);
      } else {
        // Fallback zu YouTube-Player
        console.log('Spotify nicht verbunden, nutze YouTube-Player als Fallback');
        setCurrentTrack({ id: trackId, name: 'Aktueller Track', artist: 'Aktueller Künstler' });
        setIsPlaying(true);
        
        // Simuliere das Ende der Wiedergabe nach 30 Sekunden
        setTimeout(() => {
          setIsPlaying(false);
          setCurrentTrack(null);
        }, 30000);
      }
    } catch (error) {
      console.error('Fehler beim Abspielen des Tracks:', error);
      Alert.alert('Fehler', 'Fehler beim Abspielen des Tracks: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setCurrentTrack(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jukebox-Modus</Text>
      
      <View style={styles.statusSection}>
        <Text style={styles.statusText}>
          Spotify-Verbindung: {spotifyConnected ? '✅ Verbunden' : '❌ Nicht verbunden'}
        </Text>
        <Text style={styles.statusText}>
          Status: {isPlaying ? '🎵 Wiedergabe aktiv' : '⏸️ Bereit'}
        </Text>
      </View>

      {currentTrack && (
        <View style={styles.currentTrackSection}>
          <Text style={styles.currentTrackText}>Aktueller Track:</Text>
          <Text style={styles.trackName}>{currentTrack.name}</Text>
          <Text style={styles.trackArtist}>{currentTrack.artist}</Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8a2be2" />
          <Text style={styles.loadingText}>Starte Wiedergabe...</Text>
        </View>
      )}

      {!isScanning && !loading && (
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={handleScanStart}
            disabled={loading}
          >
            <Text style={styles.buttonText}>QR-Code scannen</Text>
          </TouchableOpacity>
          
          {isPlaying && (
            <TouchableOpacity 
              style={styles.stopButton} 
              onPress={stopPlayback}
            >
              <Text style={styles.buttonText}>Wiedergabe stoppen</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isScanning && (
        <View style={styles.scannerContainer}>
          <QRScanner 
            onScan={handleScanComplete} 
            onCancel={handleScanCancel} 
          />
        </View>
      )}

      <View style={styles.spacer} />
      
      <Button
        title="Zurück"
        onPress={() => navigation.goBack()}
        color="#8a2be2"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    color: '#8a2be2', // Neon-Violett
  },
  statusSection: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  currentTrackSection: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  currentTrackText: {
    color: '#00ced1', // Neon-Cyan
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  trackName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  trackArtist: {
    color: '#ccc',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  controls: {
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#8a2be2', // Neon-Violett
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  stopButton: {
    backgroundColor: '#ff4b5c', // Rot
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scannerContainer: {
    flex: 1,
    marginBottom: 20,
  },
  spacer: {
    flex: 1,
  },
});

export default JukeboxScreen;