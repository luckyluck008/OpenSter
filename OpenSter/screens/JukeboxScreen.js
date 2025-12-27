import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  Animated,
  Easing,
  Pressable,
  PanResponder,
  Linking,
  Vibration,
  TextInput,
  ScrollView,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera'; 
import SpotifyPlaybackService from '../services/SpotifyPlaybackService';
import { ThemeContext } from '../theme/ThemeProvider';
import { Camera, Play, Pause, Smartphone, QrCode, Settings, X, HelpCircle, LogOut, Plus, Check, FileText } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { generateCardsPDF } from '../components/PDFGenerator';
import SpotifyService from '../services/SpotifyService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ringOuterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <circle cx="150" cy="150" r="100" fill="none" stroke="#6BCF77" stroke-width="12" stroke-linecap="round" stroke-dasharray="560 70" transform="rotate(-90 150 150)" />
</svg>`;

const ringMiddleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <circle cx="150" cy="150" r="70" fill="none" stroke="#6BCF77" stroke-width="10" stroke-linecap="round" stroke-dasharray="380 50" transform="rotate(-90 150 150)" />
</svg>`;

const ringInnerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <circle cx="150" cy="150" r="45" fill="none" stroke="#6BCF77" stroke-width="8" stroke-linecap="round" stroke-dasharray="260 40" transform="rotate(-90 150 150)" />
</svg>`;

const JukeboxScreen = ({ navigation }) => {
  const { theme: contextTheme } = useContext(ThemeContext);
  const [permission, requestPermission] = useCameraPermissions();

  const isDark = contextTheme?.mode === 'dark';
  const accentColor = contextTheme?.accent || '#634E34';
  
  const theme = {
    background: isDark ? '#121212' : '#FCD385',
    card: isDark ? '#1E1E1E' : '#FDF8F1',        
    primary: accentColor,                        
    text: isDark ? '#FFFFFF' : '#634E34',        
    secondary: isDark ? '#2C2C2C' : '#EBC47C',   
  };

  const [isScanning, setIsScanning] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [devices, setDevices] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [showInstructions, setShowInstructions] = useState(false);
  const [buttonCooldown, setButtonCooldown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [showSetCreator, setShowSetCreator] = useState(false);
  const [setLinks, setSetLinks] = useState([]);
  const [currentLinkInput, setCurrentLinkInput] = useState('');
  const [isProcessingPlaylists, setIsProcessingPlaylists] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processedTracks, setProcessedTracks] = useState([]);

  const lastInteractionTime = useRef(0);
  const smoothProgress = useRef(new Animated.Value(0)).current;
  const progressBarRef = useRef(null);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const reverseRotateAnim = useRef(new Animated.Value(0)).current;
  const thirdRotateAnim = useRef(new Animated.Value(0)).current;
  const likeWidth = useRef(new Animated.Value(1)).current;
  const scanWidth = useRef(new Animated.Value(1.2)).current;
  const playWidth = useRef(new Animated.Value(1)).current;
  const uiOpacity = useRef(new Animated.Value(1)).current;
  
  const ringAnimation1 = useRef(null);
  const ringAnimation2 = useRef(null);
  const ringAnimation3 = useRef(null);

  const startRingAnimations = () => {
    ringAnimation1.current?.stop();
    ringAnimation2.current?.stop();
    ringAnimation3.current?.stop();
    
    ringAnimation1.current = Animated.loop(Animated.timing(rotateAnim, { toValue: 10, duration: 100000, easing: Easing.linear, useNativeDriver: true }));
    ringAnimation2.current = Animated.loop(Animated.timing(reverseRotateAnim, { toValue: 10, duration: 80000, easing: Easing.linear, useNativeDriver: true }));
    ringAnimation3.current = Animated.loop(Animated.timing(thirdRotateAnim, { toValue: 10, duration: 120000, easing: Easing.linear, useNativeDriver: true }));
    
    ringAnimation1.current.start();
    ringAnimation2.current.start();
    ringAnimation3.current.start();
  };

  const stopRingAnimations = () => {
    ringAnimation1.current?.stop();
    ringAnimation2.current?.stop();
    ringAnimation3.current?.stop();
  };

  const spin = rotateAnim.interpolate({ inputRange: [0, 10], outputRange: ['0deg', '3600deg'] });
  const reverseSpin = reverseRotateAnim.interpolate({ inputRange: [0, 10], outputRange: ['0deg', '-3600deg'] });
  const thirdSpin = thirdRotateAnim.interpolate({ inputRange: [0, 10], outputRange: ['0deg', '3600deg'] });

  useEffect(() => {
    let syncInterval;
    if (isPlaying && !isDragging) {
      syncPlaybackState();
      syncInterval = setInterval(syncPlaybackState, 1000);
    }
    return () => { if (syncInterval) clearInterval(syncInterval); };
  }, [isPlaying, isDragging]);

  useEffect(() => {
    if (isPlaying) startRingAnimations();
    else stopRingAnimations();
  }, [isPlaying]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { setIsDragging(true); },
      onPanResponderMove: (evt, gestureState) => {
        if (progressBarRef.current) {
          progressBarRef.current.measure((x, y, width, height, pageX, pageY) => {
            const touchX = gestureState.moveX - pageX;
            const progress = Math.max(0, Math.min(1, touchX / width));
            smoothProgress.setValue(progress);
          });
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);
        if (progressBarRef.current) {
          progressBarRef.current.measure((x, y, width, height, pageX, pageY) => {
            const touchX = gestureState.moveX - pageX;
            const progress = Math.max(0, Math.min(1, touchX / width));
            const newPositionMs = Math.round(progress * duration * 1000);
            seekToPosition(newPositionMs);
          });
        }
      },
    })
  ).current;

  const syncPlaybackState = async () => {
    if (Date.now() - lastInteractionTime.current < 2000) return;
    try {
      const state = await SpotifyPlaybackService.getPlaybackState();
      if (state && state.item) {
        setCurrentTime(state.progress_ms / 1000);
        setDuration(state.item.duration_ms / 1000);
        setIsPlaying(state.is_playing);
      }
    } catch (error) { console.error('Sync failed:', error); }
  };

  const seekToPosition = async (positionMs) => {
    try {
      await SpotifyPlaybackService.seekToPosition(positionMs);
      setCurrentTime(positionMs / 1000);
      setTimeout(() => syncPlaybackState(), 1000);
    } catch (error) { console.error('Seek failed:', error); }
  };

  const animateButtons = (type) => {
    const expandValue = type === 'scan' ? 1.5 : 1.25;
    const shrinkValue = 0.9;
    const configExpand = { duration: 80, useNativeDriver: false, easing: Easing.out(Easing.quad) };
    const configReset = { useNativeDriver: false, friction: 8, tension: 200 };
    Animated.sequence([
      Animated.parallel([
        Animated.timing(likeWidth, { toValue: type === 'like' ? expandValue : shrinkValue, ...configExpand }),
        Animated.timing(scanWidth, { toValue: type === 'scan' ? expandValue : shrinkValue, ...configExpand }),
        Animated.timing(playWidth, { toValue: type === 'play' ? expandValue : shrinkValue, ...configExpand }),
      ]),
      Animated.parallel([
        Animated.spring(likeWidth, { toValue: 1, ...configReset }),
        Animated.spring(scanWidth, { toValue: 1.2, ...configReset }),
        Animated.spring(playWidth, { toValue: 1, ...configReset }),
      ])
    ]).start();
  };

  const fadeUIOpacity = (toValue) => {
    Animated.timing(uiOpacity, { toValue, duration: 200, useNativeDriver: false }).start();
  };

  const handleSetCreatorPress = () => {
    animateButtons('like');
    setShowSetCreator(true);
  };

  const addLinkToSet = () => {
    if (!currentLinkInput.trim()) {
      Alert.alert("Fehler", "Bitte gib einen Spotify-Link ein.");
      return;
    }

    let itemId = '';
    let itemType = '';

    // Versuche verschiedene Spotify-Link-Formate zu erkennen
    const input = currentLinkInput.trim();

    // Format 1: https://open.spotify.com/track/TRACK_ID
    if (input.includes('open.spotify.com/track/')) {
      const match = input.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
      if (match) {
        itemId = match[1];
        itemType = 'track';
      }
    }
    // Format 2: https://open.spotify.com/playlist/PLAYLIST_ID
    else if (input.includes('open.spotify.com/playlist/')) {
      const match = input.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
      if (match) {
        itemId = match[1];
        itemType = 'playlist';
      }
    }
    // Format 3: spotify:track:TRACK_ID
    else if (input.startsWith('spotify:track:')) {
      const match = input.match(/spotify:track:([a-zA-Z0-9]+)/);
      if (match) {
        itemId = match[1];
        itemType = 'track';
      }
    }
    // Format 4: spotify:playlist:PLAYLIST_ID
    else if (input.startsWith('spotify:playlist:')) {
      const match = input.match(/spotify:playlist:([a-zA-Z0-9]+)/);
      if (match) {
        itemId = match[1];
        itemType = 'playlist';
      }
    }
    // Format 5: Nur ID (22 Zeichen alphanumerisch) - default zu track
    else if (/^[a-zA-Z0-9]{22}$/.test(input)) {
      itemId = input;
      itemType = 'track';
    }

    // Validiere die extrahierte ID
    if (itemId && /^[a-zA-Z0-9]{22}$/.test(itemId) && itemType) {
      const itemName = itemType === 'playlist' ? `Playlist ${setLinks.length + 1}` : `Track ${setLinks.length + 1}`;
      setSetLinks([...setLinks, { id: itemId, url: input, name: itemName, type: itemType, verified: false }]);
      setCurrentLinkInput('');
    } else {
      Alert.alert("Ungültiger Link", "Dies ist kein gültiger Spotify-Link.\n\nUnterstützte Formate:\n• Track: https://open.spotify.com/track/...\n• Playlist: https://open.spotify.com/playlist/...\n• spotify:track:... oder spotify:playlist:...\n• 22-stellige ID");
    }
  };

  const verifyLinks = async () => {
    if (setLinks.length === 0) {
      Alert.alert("Keine Links", "Füge zuerst einige Spotify-Links hinzu.");
      return;
    }

    try {
      const verifiedLinks = [];
      for (const link of setLinks) {
        try {
          // Validiere die ID Format
          const isValidFormat = /^[a-zA-Z0-9]{22}$/.test(link.id);

          if (isValidFormat) {
            // Hier könnte man die Spotify API verwenden um Details zu holen
            // Für jetzt markieren wir sie als verifiziert wenn das Format stimmt
            const displayName = link.type === 'playlist'
              ? `Playlist ${link.id.substring(0, 8)}...`
              : `Track ${link.id.substring(0, 8)}...`;
            verifiedLinks.push({ ...link, verified: true, name: displayName });
          } else {
            verifiedLinks.push({ ...link, verified: false });
          }
        } catch (error) {
          console.error('Fehler beim Verifizieren:', error);
          verifiedLinks.push({ ...link, verified: false });
        }
      }
      setSetLinks(verifiedLinks);
      const verifiedCount = verifiedLinks.filter(l => l.verified).length;
      Alert.alert("Verifizierung abgeschlossen", `${verifiedCount} von ${verifiedLinks.length} Links wurden erfolgreich verifiziert.`);
    } catch (error) {
      Alert.alert("Fehler", "Fehler bei der Verifizierung der Links.");
    }
  };

  const processPlaylistsAndTracks = async () => {
    const verifiedLinks = setLinks.filter(link => link.verified);
    if (verifiedLinks.length === 0) {
      Alert.alert("Keine verifizierten Links", "Verifiziere zuerst deine Links.");
      return;
    }

    setIsProcessingPlaylists(true);
    setProcessingProgress(0);
    setProcessedTracks([]);

    try {
      const allTracks = [];
      let totalItems = 0;

      // Zähle zuerst alle Items für Fortschrittsberechnung
      for (const link of verifiedLinks) {
        if (link.type === 'playlist') {
          const playlistTracks = await SpotifyService.getPlaylistTracks(link.id);
          totalItems += playlistTracks.length;
        } else {
          totalItems += 1;
        }
      }

      let processedItems = 0;

      // Verarbeite alle Playlists und Tracks
      for (const link of verifiedLinks) {
        if (link.type === 'playlist') {
          // Hole alle Tracks aus der Playlist
          const playlistTracks = await SpotifyService.getPlaylistTracks(link.id);

          // Sammle alle Track-IDs für Batch-Verarbeitung
          const trackIds = playlistTracks.map(track => track.id);

          // Hole detaillierte Infos für alle Tracks (inkl. release_date)
          const trackDetails = await SpotifyService.getTracksInfo(trackIds);

          // Kombiniere Playlist-Tracks mit Details
          for (let i = 0; i < playlistTracks.length; i++) {
            const track = playlistTracks[i];
            const details = trackDetails.find(d => d.id === track.id);

            if (details) {
              allTracks.push({
                id: track.id,
                name: track.name,
                artist: details.artist || track.artist || 'Unbekannt',
                originalYear: details.release_date ? new Date(details.release_date).getFullYear().toString() : '????',
                album: details.album,
                duration_ms: details.duration_ms,
                external_urls: details.external_urls,
                type: 'track',
                from_playlist: link.name
              });
            }

            processedItems++;
            setProcessingProgress((processedItems / totalItems) * 100);
            Animated.timing(smoothProgress, {
              toValue: (processedItems / totalItems) * 100,
              duration: 200,
              useNativeDriver: false,
            }).start();
          }
        } else {
          // Einzelner Track - hole Details
          const trackDetails = await SpotifyService.getTracksInfo([link.id]);

          if (trackDetails.length > 0) {
            const details = trackDetails[0];
            allTracks.push({
              id: link.id,
              name: details.name,
              artist: details.artist || 'Unbekannt',
              originalYear: details.release_date ? new Date(details.release_date).getFullYear().toString() : '????',
              album: details.album,
              duration_ms: details.duration_ms,
              external_urls: details.external_urls,
              type: 'track',
              from_playlist: null
            });
          }

          processedItems++;
          setProcessingProgress((processedItems / totalItems) * 100);
          Animated.timing(smoothProgress, {
            toValue: (processedItems / totalItems) * 100,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      }

      setProcessedTracks(allTracks);
      setIsProcessingPlaylists(false);

      // Zeige Erfolg und wechsle zur PDF-Generierung
      Alert.alert(
        "Verarbeitung abgeschlossen",
        `${allTracks.length} Tracks wurden erfolgreich verarbeitet.`,
        [
          { text: "Abbrechen", style: "cancel" },
          { text: "PDF generieren", onPress: () => generatePDFWithProcessedTracks(allTracks) }
        ]
      );

    } catch (error) {
      console.error('Fehler bei der Verarbeitung:', error);
      setIsProcessingPlaylists(false);
      Alert.alert("Fehler", "Fehler bei der Verarbeitung der Playlists und Tracks. Überprüfe deine Spotify-Verbindung.");
    }
  };

  const generatePDFWithProcessedTracks = async (tracks) => {
    try {
      await generateCardsPDF(tracks);
      Alert.alert("PDF generiert", "Das PDF wurde erfolgreich erstellt und gespeichert.");
      setShowSetCreator(false);
      setSetLinks([]);
      setProcessedTracks([]);
    } catch (error) {
      Alert.alert("Fehler", "Fehler bei der PDF-Generierung.");
      console.error(error);
    }
  };

  const generatePDF = async () => {
    const verifiedLinks = setLinks.filter(link => link.verified);
    if (verifiedLinks.length === 0) {
      Alert.alert("Keine verifizierten Links", "Verifiziere zuerst deine Links bevor du ein PDF generierst.");
      return;
    }

    // Prüfe ob Playlists vorhanden sind - wenn ja, starte Processing
    const hasPlaylists = verifiedLinks.some(link => link.type === 'playlist');

    if (hasPlaylists) {
      Alert.alert(
        "Playlists gefunden",
        "Deine Auswahl enthält Playlists. Diese müssen verarbeitet werden, um alle Tracks zu extrahieren.",
        [
          { text: "Abbrechen", style: "cancel" },
          { text: "Verarbeiten", onPress: processPlaylistsAndTracks }
        ]
      );
    } else {
      // Nur einzelne Tracks - direkt verarbeiten
      await processPlaylistsAndTracks();
    }
  };

  const handleScanPress = async () => {
    if (isScanning) { 
      animateButtons('scan');
      fadeUIOpacity(1); // Fade UI back in
      setTimeout(() => {
        setIsScanning(false); 
        setScanned(false);
      }, 150);
      return; 
    }
    if (!permission || !permission.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("Kamera benötigt", "Bitte erlaube den Zugriff in den Einstellungen.", [
          { text: "Abbrechen", style: "cancel" },
          { text: "Einstellungen", onPress: () => Linking.openSettings() }
        ]);
        return;
      }
    }
    animateButtons('scan');
    fadeUIOpacity(0); // Fade UI out
    setTimeout(() => setIsScanning(true), 150);
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(100);

    try {
      let trackId = '';
      if (data.includes('spotify.com/track/')) {
        trackId = data.split('track/')[1].split('?')[0];
      } else if (data.startsWith('spotify:track:')) {
        trackId = data.split('spotify:track:')[1];
      }

      if (trackId) {
        await SpotifyPlaybackService.playTrack(trackId);
        animateButtons('scan');
        fadeUIOpacity(1); // Fade UI back in
        setTimeout(() => {
          setIsScanning(false);
          setScanned(false);
          setIsPlaying(true);
          setTimeout(() => syncPlaybackState(), 1000);
        }, 150);
      } else {
        Alert.alert("Ungültiger Code", "Dies ist kein gültiger Spotify-Track Link.", [{ text: "OK", onPress: () => setScanned(false) }]);
      }
    } catch (error) {
      Alert.alert("Fehler", "Song konnte nicht abgespielt werden. Ist Spotify aktiv?");
      setScanned(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkLoginStatus();
      const statusInterval = setInterval(() => { if (isLoggedIn) syncPlaybackState(); }, 5000);
      return () => clearInterval(statusInterval);
    }, [isLoggedIn])
  );

  const checkLoginStatus = async () => {
    try {
      const loggedIn = await SpotifyPlaybackService.isLoggedIn();
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        const deviceList = await SpotifyPlaybackService.getDevices();
        setDevices(deviceList);
      }
    } catch (error) { console.error(error); }
  };

  const handleLoginLogout = async () => {
    try {
      if (isLoggedIn) {
        await SpotifyPlaybackService.logout();
        setIsLoggedIn(false);
        setDevices([]);
        setIsPlaying(false);
      } else {
        await SpotifyPlaybackService.login();
        await checkLoginStatus();
      }
    } catch (error) { Alert.alert('Fehler', 'Login/Logout fehlgeschlagen'); }
  };

  const handlePause = async () => { 
    if (buttonCooldown) return;
    setButtonCooldown(true);
    lastInteractionTime.current = Date.now();
    setIsPlaying(false);
    try { await SpotifyPlaybackService.pause(); } catch (e) { setIsPlaying(true); } 
    setTimeout(() => setButtonCooldown(false), 800);
  };
  
  const handleResume = async () => { 
    if (buttonCooldown) return;
    setButtonCooldown(true);
    lastInteractionTime.current = Date.now();
    setIsPlaying(true);
    try { await SpotifyPlaybackService.resume(); } catch (e) { setIsPlaying(false); } 
    setTimeout(() => setButtonCooldown(false), 1000);
  };

  useEffect(() => {
    if (!isDragging) {
      Animated.timing(smoothProgress, {
        toValue: duration > 0 ? currentTime / duration : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [currentTime, duration, isDragging]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right', 'bottom']}>
      
      {isScanning && permission?.granted && (
        <View style={StyleSheet.absoluteFillObject}>
           <CameraView 
             style={StyleSheet.absoluteFillObject} 
             facing="back"
             onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
             barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
           />
           <View style={styles.scannerOverlay}>
              <View style={styles.unfocusedContainer} />
              <View style={styles.focusedRow}>
                <View style={styles.unfocusedContainer} />
                <View style={[styles.focusedContainer, { borderColor: theme.primary }]} />
                <View style={styles.unfocusedContainer} />
              </View>
              <View style={styles.unfocusedContainer} />
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  animateButtons('scan');
                  fadeUIOpacity(1);
                  setTimeout(() => {
                    setIsScanning(false);
                    setScanned(false);
                  }, 150);
                }}
                activeOpacity={0.7}
              >
                <X size={32} color="white" />
              </TouchableOpacity>
           </View>
        </View>
      )}

      <Animated.View style={[styles.header, { opacity: uiOpacity }]}>
        <TouchableOpacity onPress={() => setShowInstructions(true)} style={[styles.iconButton, { backgroundColor: theme.secondary }]}>
          <HelpCircle size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.logoText, { color: theme.primary }]}>OpenSter</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Einstellungen')} style={[styles.iconButton, { backgroundColor: theme.secondary }]}>
          <Settings size={24} color={theme.primary} />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.mainContent}>
        <Animated.View style={{ opacity: uiOpacity }}>
          <View style={styles.visualizerContainer}>
            <View style={styles.ringWrapper}>
              <Animated.View style={[styles.ringContainer, { transform: [{ rotate: thirdSpin }] }]}>
                <SvgXml xml={ringOuterSvg.replace('#6BCF77', theme.primary)} width={230} height={230} />
              </Animated.View>
              <Animated.View style={[styles.ringContainer, { transform: [{ rotate: reverseSpin }] }]}>
                <SvgXml xml={ringMiddleSvg.replace('#6BCF77', theme.primary)} width={170} height={170} />
              </Animated.View>
              <Animated.View style={[styles.ringContainer, { transform: [{ rotate: spin }] }]}>
                <SvgXml xml={ringInnerSvg.replace('#6BCF77', theme.primary)} width={100} height={100} />
              </Animated.View>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View ref={progressBarRef} style={[styles.progressBarBg, { backgroundColor: theme.secondary, opacity: 0.8 }]}>
              <Animated.View style={[styles.playedAreaContainer, { width: smoothProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: theme.primary }]} />
              <Animated.View {...panResponder.panHandlers} style={[styles.playhead, { left: smoothProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: theme.primary }]} />
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.bottomControls}>
        <Animated.View style={{ flex: likeWidth, opacity: uiOpacity }}>
          <Pressable style={[styles.controlBox, { backgroundColor: theme.secondary }]} onPress={handleSetCreatorPress} disabled={isScanning}>
            <FileText size={30} color={theme.primary} />
          </Pressable>
        </Animated.View>
        <Animated.View style={{ flex: scanWidth }}>
          <Pressable style={[styles.controlBox, { backgroundColor: theme.primary }]} onPress={handleScanPress}>
            {isScanning ? <X size={34} color={theme.card} /> : <Camera size={34} color={theme.card} />}
          </Pressable>
        </Animated.View>
        <Animated.View style={{ flex: playWidth, opacity: uiOpacity }}>
          <Pressable style={[styles.controlBox, { backgroundColor: theme.secondary }]} onPress={() => { isPlaying ? handlePause() : handleResume(); animateButtons('play'); }} disabled={buttonCooldown || isScanning}>
            {isPlaying ? <Pause size={30} color={theme.primary} fill={theme.primary} /> : <Play size={30} color={theme.primary} fill={theme.primary} />}
          </Pressable>
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottomPillContainer, { opacity: uiOpacity }]}>
        <View style={[styles.deviceLogoutPill, { backgroundColor: theme.secondary }]}>
          <View style={styles.deviceInfoPart}>
            <Smartphone size={14} color={theme.primary} />
            <Text style={[styles.deviceText, { color: theme.text }]} numberOfLines={1}>{devices.length > 0 ? devices[0].name : 'Suche Gerät...'}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.text, opacity: 0.1 }]} />
          <TouchableOpacity onPress={handleLoginLogout} style={styles.logoutPart} disabled={isScanning}>
             <LogOut size={14} color={isLoggedIn ? theme.primary : '#ff4444'} />
             <Text style={[styles.onlineText, { color: isLoggedIn ? theme.text : '#ff4444' }]}>{isLoggedIn ? 'LOGOUT' : 'LOGIN'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Modal visible={showSetCreator} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.setCreatorCard, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Set erstellen</Text>
              <TouchableOpacity onPress={() => setShowSetCreator(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={[styles.linkInput, { color: theme.text, borderColor: theme.secondary, backgroundColor: theme.card, flex: 1, marginRight: 12 }]}
                placeholder="Spotify-Link einfügen..."
                placeholderTextColor={theme.text + '60'}
                value={currentLinkInput}
                onChangeText={setCurrentLinkInput}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity 
                style={[styles.smallAddButton, { backgroundColor: theme.primary }]} 
                onPress={addLinkToSet}
              >
                <Plus size={20} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.setCreatorScroll}>
              {setLinks.map((link, index) => (
                <View key={index} style={[styles.linkItem, { backgroundColor: theme.secondary + '20' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.linkText, { color: theme.text, fontWeight: '600' }]}>
                      {link.name}
                    </Text>
                    <Text style={[styles.linkType, { color: theme.text + '80' }]}>
                      {link.type === 'playlist' ? '📋 Playlist' : '🎵 Track'}
                    </Text>
                  </View>
                  {link.verified && <Check size={16} color="#4CAF50" style={styles.verifiedIcon} />}
                </View>
              ))}
            </ScrollView>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.secondary }]} 
                onPress={verifyLinks}
              >
                <Text style={{ color: theme.primary, fontWeight: '600' }}>Überprüfen</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.primary }]} 
                onPress={generatePDF}
              >
                <FileText size={20} color="white" />
                <Text style={{ color: 'white', marginLeft: 8 }}>PDF generieren</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isProcessingPlaylists} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.processingCard, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Verarbeitung läuft...</Text>
            </View>

            <View style={styles.processingContent}>
              <Text style={[styles.processingText, { color: theme.text }]}>
                Extrahiere Tracks aus Playlists und hole Jahreszahlen...
              </Text>

              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: theme.secondary }]}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: theme.primary,
                        width: smoothProgress.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%']
                        })
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: theme.text }]}>
                  {Math.round(processingProgress)}%
                </Text>
              </View>

              <Text style={[styles.processingSubtext, { color: theme.text + '80' }]}>
                {processedTracks.length} Tracks verarbeitet
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showInstructions} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.instructionCard, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Anleitung</Text>
              <TouchableOpacity onPress={() => setShowInstructions(false)}><X size={24} color={theme.text} /></TouchableOpacity>
            </View>
            {[{ id: 1, t: "Spotify verbinden" }, { id: 2, t: "Kamera klicken" }, { id: 3, t: "QR-Code scannen" }].map(step => (
              <View key={step.id} style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}><Text style={{ color: theme.card, fontWeight: 'bold' }}>{step.id}</Text></View>
                <Text style={[styles.stepText, { color: theme.text }]}>{step.t}</Text>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainContent: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 10 },
  logoText: { fontSize: 24, fontWeight: '900' },
  iconButton: { width: 48, height: 48, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  visualizerContainer: { alignItems: 'center', marginTop: 60, marginBottom: 20 },
  ringWrapper: { width: 250, height: 250, justifyContent: 'center', alignItems: 'center' },
  ringContainer: { position: 'absolute' },
  progressContainer: { marginTop: 50, marginBottom: 10, paddingHorizontal: 4 },
  progressBarBg: { height: 6, borderRadius: 3, width: '100%', position: 'relative' },
  playedAreaContainer: { height: '100%', borderRadius: 3 },
  playhead: { position: 'absolute', width: 20, height: 20, borderRadius: 10, marginLeft: -10, top: -7 },
  bottomControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 20, height: 100 },
  controlBox: { height: 75, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  bottomPillContainer: { paddingBottom: 30, alignItems: 'center' },
  deviceLogoutPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 25, minWidth: 220, justifyContent: 'center' },
  deviceInfoPart: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutPart: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 12 },
  divider: { width: 1, height: 16 },
  deviceText: { fontWeight: '700', fontSize: 12 },
  onlineText: { fontWeight: '900', fontSize: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  instructionCard: { width: '85%', borderRadius: 28, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  stepItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 15 },
  stepNumber: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stepText: { flex: 1, fontSize: 15, fontWeight: '500' },
  scannerOverlay: { flex: 1, backgroundColor: 'transparent' },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  focusedRow: { flexDirection: 'row', height: 280 },
  focusedContainer: { width: 280, borderWidth: 2, borderRadius: 20, backgroundColor: 'transparent' },
  closeButton: { position: 'absolute', top: 50, right: 20, width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  setCreatorCard: { width: '90%', maxHeight: '80%', borderRadius: 28, padding: 24 },
  setCreatorScroll: { maxHeight: 300 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  linkInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  smallAddButton: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  linkItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8 },
  linkText: { flex: 1, fontSize: 14 },
  linkType: { fontSize: 12, marginTop: 2 },
  verifiedIcon: { marginLeft: 8 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  actionButton: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center', marginHorizontal: 4, flexDirection: 'row', justifyContent: 'center' },
  processingCard: { width: '80%', borderRadius: 28, padding: 24, alignItems: 'center' },
  processingContent: { alignItems: 'center', width: '100%' },
  processingText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  progressContainer: { width: '100%', alignItems: 'center', marginBottom: 16 },
  progressBar: { width: '100%', height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  processingSubtext: { fontSize: 12, textAlign: 'center' },
});

export default JukeboxScreen;