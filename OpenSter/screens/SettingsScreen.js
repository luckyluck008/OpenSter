import React, { useState, useEffect } from 'react';
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
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const SettingsScreen = ({ navigation }) => {
  const [spotifyClientId, setSpotifyClientId] = useState('');
  const [spotifyClientSecret, setSpotifyClientSecret] = useState('');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [playbackTimerEnabled, setPlaybackTimerEnabled] = useState(false);
  const [playbackTimerSeconds, setPlaybackTimerSeconds] = useState('30');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedSpotifyClientId = await AsyncStorage.getItem('spotifyClientId');
      const storedSpotifyClientSecret = await SecureStore.getItemAsync('spotifyClientSecret');
      const storedYoutubeApiKey = await SecureStore.getItemAsync('youtubeApiKey');
      const storedOpenaiApiKey = await SecureStore.getItemAsync('openaiApiKey');
      const storedTimerEnabled = await AsyncStorage.getItem('playbackTimerEnabled');
      const storedTimerSeconds = await AsyncStorage.getItem('playbackTimerSeconds');

      setSpotifyClientId(storedSpotifyClientId || '');
      setSpotifyClientSecret(storedSpotifyClientSecret || '');
      setYoutubeApiKey(storedYoutubeApiKey || '');
      setOpenaiApiKey(storedOpenaiApiKey || '');
      setPlaybackTimerEnabled(storedTimerEnabled === 'true');
      setPlaybackTimerSeconds(storedTimerSeconds || '30');
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('spotifyClientId', spotifyClientId);
      await AsyncStorage.setItem('playbackTimerEnabled', playbackTimerEnabled.toString());
      await AsyncStorage.setItem('playbackTimerSeconds', playbackTimerSeconds);
      
      if (spotifyClientSecret) {
        await SecureStore.setItemAsync('spotifyClientSecret', spotifyClientSecret);
      }
      
      if (youtubeApiKey) {
        await SecureStore.setItemAsync('youtubeApiKey', youtubeApiKey);
      }
      
      if (openaiApiKey) {
        await SecureStore.setItemAsync('openaiApiKey', openaiApiKey);
      }

      Alert.alert('Erfolg', 'Einstellungen gespeichert!');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Fehler', 'Einstellungen konnten nicht gespeichert werden');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8a2be2" />
          <Text style={styles.loadingText}>Lade Einstellungen...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Spotify Client ID</Text>
            <TextInput
              style={styles.input}
              value={spotifyClientId}
              onChangeText={setSpotifyClientId}
              placeholder="Client ID eingeben"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Spotify Client Secret</Text>
            <TextInput
              style={styles.input}
              value={spotifyClientSecret}
              onChangeText={setSpotifyClientSecret}
              placeholder="Client Secret eingeben"
              placeholderTextColor="#666"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>YouTube API Key</Text>
            <TextInput
              style={styles.input}
              value={youtubeApiKey}
              onChangeText={setYoutubeApiKey}
              placeholder="API Key eingeben"
              placeholderTextColor="#666"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>OpenAI API Key (Optional)</Text>
            <TextInput
              style={styles.input}
              value={openaiApiKey}
              onChangeText={setOpenaiApiKey}
              placeholder="API Key eingeben"
              placeholderTextColor="#666"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Timer Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⏱️ Auto-Stop Timer</Text>
          </View>
          
          <View style={styles.timerContainer}>
            <View style={styles.timerRow}>
              <Text style={styles.timerLabel}>Timer aktiviert</Text>
              <Switch
                value={playbackTimerEnabled}
                onValueChange={setPlaybackTimerEnabled}
                trackColor={{ false: '#333', true: '#8a2be2' }}
                thumbColor={playbackTimerEnabled ? '#fff' : '#999'}
              />
            </View>
            
            {playbackTimerEnabled && (
              <View style={styles.timerSecondsRow}>
                <Text style={styles.timerLabel}>Sekunden:</Text>
                <TextInput
                  style={styles.timerInput}
                  value={playbackTimerSeconds}
                  onChangeText={setPlaybackTimerSeconds}
                  placeholder="30"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.timerHint}>sek</Text>
              </View>
            )}
            
            <Text style={styles.timerDescription}>
              {playbackTimerEnabled 
                ? `Wiedergabe stoppt automatisch nach ${playbackTimerSeconds} Sekunden`
                : 'Timer ist deaktiviert - Wiedergabe läuft kontinuierlich'}
            </Text>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <Text style={styles.saveButtonText}>💾 Speichern</Text>
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>ℹ️ Hinweise</Text>
            <Text style={styles.infoText}>• Alle Daten werden lokal gespeichert</Text>
            <Text style={styles.infoText}>• Spotify: developer.spotify.com</Text>
            <Text style={styles.infoText}>• YouTube: console.cloud.google.com</Text>
            <Text style={styles.infoText}>• OpenAI: platform.openai.com</Text>
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
  inputContainer: {
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
  saveButton: {
    backgroundColor: '#8a2be2',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  timerContainer: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerSecondsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerLabel: {
    fontSize: 14,
    color: '#fff',
  },
  timerInput: {
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#121212',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    width: 80,
    marginLeft: 12,
    textAlign: 'center',
  },
  timerHint: {
    color: '#999',
    marginLeft: 8,
    fontSize: 14,
  },
  timerDescription: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  infoContainer: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8a2be2',
    marginBottom: 10,
  },
  infoText: {
    color: '#999',
    marginBottom: 4,
    fontSize: 13,
  },
});

export default SettingsScreen;