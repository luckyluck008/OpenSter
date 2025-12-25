import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Button
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const SettingsScreen = ({ navigation }) => {
  const [spotifyClientId, setSpotifyClientId] = useState('');
  const [spotifyClientSecret, setSpotifyClientSecret] = useState('');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
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

      setSpotifyClientId(storedSpotifyClientId || '');
      setSpotifyClientSecret(storedSpotifyClientSecret || '');
      setYoutubeApiKey(storedYoutubeApiKey || '');
      setOpenaiApiKey(storedOpenaiApiKey || '');
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
      
      if (spotifyClientSecret) {
        await SecureStore.setItemAsync('spotifyClientSecret', spotifyClientSecret);
      }
      
      if (youtubeApiKey) {
        await SecureStore.setItemAsync('youtubeApiKey', youtubeApiKey);
      }
      
      if (openaiApiKey) {
        await SecureStore.setItemAsync('openaiApiKey', openaiApiKey);
      }

      Alert.alert('Success', 'Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>API Settings</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Spotify Client ID</Text>
          <TextInput
            style={styles.input}
            value={spotifyClientId}
            onChangeText={setSpotifyClientId}
            placeholder="Enter Spotify Client ID"
            secureTextEntry={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Spotify Client Secret</Text>
          <TextInput
            style={styles.input}
            value={spotifyClientSecret}
            onChangeText={setSpotifyClientSecret}
            placeholder="Enter Spotify Client Secret"
            secureTextEntry={true}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>YouTube API Key</Text>
          <TextInput
            style={styles.input}
            value={youtubeApiKey}
            onChangeText={setYoutubeApiKey}
            placeholder="Enter YouTube API Key"
            secureTextEntry={true}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>OpenAI API Key (Optional)</Text>
          <TextInput
            style={styles.input}
            value={openaiApiKey}
            onChangeText={setOpenaiApiKey}
            placeholder="Enter OpenAI API Key"
            secureTextEntry={true}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>

        <View style={styles.navigationSection}>
          <Button
            title="Jukebox-Modus"
            onPress={() => navigation.navigate('Jukebox')}
            color="#8a2be2"
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Important Information:</Text>
          <Text style={styles.infoText}>• All keys are stored locally on your device</Text>
          <Text style={styles.infoText}>• No data is sent to external servers</Text>
          <Text style={styles.infoText}>• Get Spotify API keys from: https://developer.spotify.com/</Text>
          <Text style={styles.infoText}>• Get YouTube API key from: https://console.cloud.google.com/</Text>
          <Text style={styles.infoText}>• Get OpenAI API key from: https://platform.openai.com/api-keys</Text>
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
  saveButton: {
    backgroundColor: '#58a6ff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#0d1117',
    fontSize: 18,
    fontWeight: 'bold',
  },
  navigationSection: {
    marginTop: 15,
    marginBottom: 15,
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

export default SettingsScreen;