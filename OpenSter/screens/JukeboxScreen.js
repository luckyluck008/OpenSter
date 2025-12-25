import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  AppState
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRScanner from '../components/QRScanner';
import SpotifyPlaybackService from '../services/SpotifyPlaybackService';

const JukeboxScreen = ({ navigation }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [devices, setDevices] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stopTimer, setStopTimer] = useState(null);
  const [pendingTrack, setPendingTrack] = useState(null);
  const [waitingForReturn, setWaitingForReturn] = useState(false);
  
  const appStateRef = useRef(AppState.currentState);

  // Handle App zurück aus Spotify
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // App kommt in den Vordergrund zurück
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App wieder aktiv!');
        
        // Wenn wir auf Rückkehr von Spotify warten
        if (waitingForReturn && pendingTrack) {
          console.log('Versuche pending Track abzuspielen:', pendingTrack);
          setWaitingForReturn(false);
          
          // Kurz warten bis Spotify sich registriert hat
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Jetzt Track per API abspielen
          try {
            await playTrackViaAPI(pendingTrack);
          } catch (e) {
            console.log('API Playback nach Return fehlgeschlagen:', e.message);
          }
          setPendingTrack(null);
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [waitingForReturn, pendingTrack]);

  // Prüfe Login-Status wenn Screen fokussiert wird
  useFocusEffect(
    useCallback(() => {
      checkLoginStatus();
    }, [])
  );

  const checkLoginStatus = async () => {
    try {
      setLoading(true);
      const loggedIn = await SpotifyPlaybackService.isLoggedIn();
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        try {
          const profile = await SpotifyPlaybackService.getUserProfile();
          setUserName(profile.display_name || profile.id);
          
          const deviceList = await SpotifyPlaybackService.getDevices();
          setDevices(deviceList);
        } catch (e) {
          console.log('Fehler beim Laden der Spotify-Daten:', e);
        }
      }
    } catch (error) {
      console.error('Fehler beim Prüfen des Login-Status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      await SpotifyPlaybackService.login();
      await checkLoginStatus();
      Alert.alert('Erfolg', 'Mit Spotify verbunden!');
    } catch (error) {
      console.error('Login Fehler:', error);
      Alert.alert('Login Fehler', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Abmelden',
      'Möchtest du dich von Spotify abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Abmelden',
          style: 'destructive',
          onPress: async () => {
            await SpotifyPlaybackService.logout();
            setIsLoggedIn(false);
            setUserName(null);
            setDevices([]);
          }
        }
      ]
    );
  };

  const handleScanStart = () => {
    if (!isLoggedIn) {
      Alert.alert(
        'Nicht verbunden',
        'Bitte verbinde dich zuerst mit Spotify.',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Verbinden', onPress: handleLogin }
        ]
      );
      return;
    }
    
    // Geräte-Check entfernt - wird beim Abspielen automatisch gehandhabt
    setIsScanning(true);
    setIsProcessing(false);
  };

  const handleScanComplete = async (qrData) => {
    // Verhindere Mehrfachverarbeitung
    if (isProcessing) {
      console.log('Bereits in Verarbeitung, ignoriere...');
      return;
    }
    
    // Sofort Status setzen und Scanner schließen
    setIsProcessing(true);
    setIsScanning(false);
    
    const qrText = qrData.data;
    console.log('Verarbeite QR-Code:', qrText);
    
    // Extrahiere Track ID
    let trackId = null;
    
    if (qrText.includes('open.spotify.com/track/')) {
      const match = qrText.match(/track\/([a-zA-Z0-9]+)/);
      if (match) trackId = match[1];
    } else if (qrText.startsWith('spotify:track:')) {
      trackId = qrText.replace('spotify:track:', '');
    } else if (qrText.startsWith('os:sp:')) {
      trackId = qrText.substring(6);
    } else if (qrText.match(/^[a-zA-Z0-9]{22}$/)) {
      trackId = qrText;
    }
    
    if (trackId) {
      await playTrack(trackId);
    } else {
      Alert.alert(
        'Ungültiger QR-Code',
        'Der gescannte Code ist kein gültiger Spotify-Track.'
      );
    }
    
    setIsProcessing(false);
  };

  // Spiele Track nur per API ab (kein App-Öffnen)
  const playTrackViaAPI = async (trackId) => {
    try {
      // Mehrere Versuche, Geräte zu finden
      let devices = [];
      for (let i = 0; i < 5; i++) {
        devices = await SpotifyPlaybackService.getDevices();
        if (devices.length > 0) break;
        console.log(`Versuch ${i + 1}: Warte auf Geräte...`);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      if (devices.length > 0) {
        const deviceId = devices[0].id;
        console.log('Gerät gefunden:', devices[0].name);
        
        // Transfer mit play:true um Gerät zu aktivieren
        await SpotifyPlaybackService.transferPlayback(deviceId, true);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Jetzt den richtigen Track starten
        await SpotifyPlaybackService.playTrackDirectly(trackId, deviceId);
        setIsPlaying(true);
        await startAutoStopTimer();
        
        // Geräte-Liste aktualisieren
        const updatedDevices = await SpotifyPlaybackService.getDevices();
        setDevices(updatedDevices);
        
        console.log('Track erfolgreich gestartet:', trackId);
        return true;
      }
      
      console.log('Keine Geräte nach mehreren Versuchen');
      return false;
    } catch (e) {
      console.log('playTrackViaAPI Fehler:', e.message);
      return false;
    }
  };

  // Auto-Stop Timer starten
  const startAutoStopTimer = async () => {
    const timerEnabled = await AsyncStorage.getItem('playbackTimerEnabled');
    const timerSeconds = await AsyncStorage.getItem('playbackTimerSeconds');
    
    if (timerEnabled === 'true' && timerSeconds) {
      const seconds = parseInt(timerSeconds);
      console.log(`Auto-Stop Timer: ${seconds} Sekunden`);
      
      if (stopTimer) {
        clearTimeout(stopTimer);
      }
      
      const timer = setTimeout(async () => {
        try {
          await SpotifyPlaybackService.pause();
          setIsPlaying(false);
          console.log('Auto-Stop: Wiedergabe beendet');
        } catch (e) {
          console.log('Auto-Stop fehlgeschlagen:', e);
        }
      }, seconds * 1000);
      
      setStopTimer(timer);
    }
  };

  const playTrack = async (trackId) => {
    setPlaybackLoading(true);
    try {
      // Hole aktuelle Geräte
      const currentDevices = await SpotifyPlaybackService.getDevices();
      
      // Wenn Geräte vorhanden, direkt per API abspielen
      if (currentDevices.length > 0) {
        await SpotifyPlaybackService.playTrackDirectly(trackId, currentDevices[0].id);
        setIsPlaying(true);
        await startAutoStopTimer();
        
        // Aktualisiere Geräte-Liste
        setTimeout(async () => {
          try {
            const updatedDevices = await SpotifyPlaybackService.getDevices();
            setDevices(updatedDevices);
          } catch (e) {
            console.log('Geräte-Update fehlgeschlagen:', e);
          }
        }, 1000);
      } else {
        // Keine Geräte - öffne Spotify kurz um es zu aktivieren
        console.log('Keine Geräte, öffne Spotify zum Aktivieren...');
        setPendingTrack(trackId);
        setWaitingForReturn(true);
        
        // Öffne nur Spotify (nicht den Track!) damit es sich aktiviert
        await SpotifyPlaybackService.wakeUpSpotifyApp();
        
        // User muss zurück zur App tippen, dann wird Track per API gestartet
      }
    } catch (error) {
      console.error('Playback Fehler:', error);
      Alert.alert('Fehler', error.message);
    } finally {
      setPlaybackLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      await SpotifyPlaybackService.pause();
      setIsPlaying(false);
      if (stopTimer) {
        clearTimeout(stopTimer);
        setStopTimer(null);
      }
    } catch (error) {
      console.error('Pause Fehler:', error);
    }
  };

  const handleResume = async () => {
    try {
      await SpotifyPlaybackService.resume();
      setIsPlaying(true);
    } catch (error) {
      console.error('Resume Fehler:', error);
    }
  };

  const handleScanCancel = () => {
    setIsScanning(false);
    setIsProcessing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    checkLoginStatus();
  };

  if (isScanning) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <QRScanner 
          onScan={handleScanComplete} 
          onCancel={handleScanCancel} 
        />
      </SafeAreaView>
    );
  }

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8a2be2" />
          <Text style={styles.loadingText}>Lade...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8a2be2"
          />
        }
      >
        {/* Spotify Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusIcon}>🎵</Text>
            <Text style={styles.statusTitle}>Spotify</Text>
          </View>
          
          {isLoggedIn ? (
            <>
              <View style={styles.connectedRow}>
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedText}>✓ Verbunden als {userName}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout}>
                  <Text style={styles.logoutText}>Abmelden</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.devicesRow}>
                <Text style={styles.devicesLabel}>Geräte:</Text>
                {devices.length > 0 ? (
                  <Text style={styles.devicesValue}>
                    {devices.map(d => d.name).join(', ')}
                  </Text>
                ) : (
                  <Text style={styles.devicesNone}>Keine aktiven Geräte</Text>
                )}
              </View>
            </>
          ) : (
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Mit Spotify verbinden</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Playback Loading */}
        {playbackLoading && (
          <View style={styles.playbackLoadingCard}>
            <ActivityIndicator size="small" color="#8a2be2" />
            <Text style={styles.playbackLoadingText}>Starte Wiedergabe...</Text>
          </View>
        )}

        {/* Play/Pause Controls */}
        {isLoggedIn && (
          <View style={styles.controlsCard}>
            <Text style={styles.controlsTitle}>Wiedergabe</Text>
            <View style={styles.controlsRow}>
              {isPlaying ? (
                <TouchableOpacity style={styles.controlButton} onPress={handlePause}>
                  <Text style={styles.controlButtonEmoji}>⏸️</Text>
                  <Text style={styles.controlButtonText}>Pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.controlButton} onPress={handleResume}>
                  <Text style={styles.controlButtonEmoji}>▶️</Text>
                  <Text style={styles.controlButtonText}>Fortsetzen</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Scan Button */}
        <TouchableOpacity 
          style={[styles.scanButton, !isLoggedIn && styles.scanButtonDisabled]} 
          onPress={handleScanStart}
          disabled={playbackLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.scanButtonEmoji}>📷</Text>
          <Text style={styles.scanButtonText}>QR-Code scannen</Text>
          {!isLoggedIn && (
            <Text style={styles.scanButtonHint}>Zuerst mit Spotify verbinden</Text>
          )}
        </TouchableOpacity>

        {/* Help Card */}
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>💡 So funktioniert's</Text>
          <Text style={styles.helpText}>1. Mit Spotify verbinden (oben)</Text>
          <Text style={styles.helpText}>2. Spotify auf einem Gerät öffnen</Text>
          <Text style={styles.helpText}>3. QR-Code scannen → Song spielt!</Text>
          <Text style={styles.helpNote}>
            Spotify Premium erforderlich für Playback-Steuerung.
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statusCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  connectedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectedBadge: {
    backgroundColor: '#1db954',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  connectedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutText: {
    color: '#999',
    fontSize: 14,
  },
  devicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  devicesLabel: {
    color: '#999',
    fontSize: 14,
    marginRight: 8,
  },
  devicesValue: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  devicesNone: {
    color: '#ff6b6b',
    fontSize: 14,
    fontStyle: 'italic',
  },
  loginButton: {
    backgroundColor: '#1db954',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nowPlayingCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1db954',
  },
  nowPlayingLabel: {
    color: '#1db954',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  nowPlayingName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nowPlayingArtist: {
    color: '#999',
    fontSize: 14,
    marginBottom: 12,
  },
  controlsCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  controlsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  controlButton: {
    backgroundColor: '#8a2be2',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButtonEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playbackLoadingCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playbackLoadingText: {
    color: '#999',
    marginLeft: 12,
  },
  scanButton: {
    backgroundColor: '#8a2be2',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanButtonHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 8,
  },
  helpCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    paddingLeft: 8,
  },
  helpNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default JukeboxScreen;
