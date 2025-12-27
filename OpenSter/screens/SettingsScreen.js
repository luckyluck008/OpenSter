import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ThemeContext } from '../theme/ThemeProvider';
import { 
  Key, 
  Spotify, 
  Youtube, 
  Cpu, 
  Timer, 
  Palette, 
  Save, 
  ChevronLeft,
  Info,
  CheckCircle2
} from 'lucide-react-native';

const SettingsScreen = ({ navigation }) => {
  const [spotifyClientId, setSpotifyClientId] = useState('');
  const [spotifyClientSecret, setSpotifyClientSecret] = useState('');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [playbackTimerEnabled, setPlaybackTimerEnabled] = useState(false);
  const [playbackTimerSeconds, setPlaybackTimerSeconds] = useState('30');
  const [isLoading, setIsLoading] = useState(true);
  
  const { theme, setTheme } = useContext(ThemeContext);
  const [localAccent, setLocalAccent] = useState(theme?.accent || '#634E34');
  const [localMode, setLocalMode] = useState(theme?.mode || 'light');

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (theme) {
      setLocalAccent(theme.accent || '#634E34');
      setLocalMode(theme.mode || 'light');
    }
  }, [theme]);

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
      Alert.alert('Fehler', 'Einstellungen konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('spotifyClientId', spotifyClientId);
      await AsyncStorage.setItem('playbackTimerEnabled', playbackTimerEnabled.toString());
      await AsyncStorage.setItem('playbackTimerSeconds', playbackTimerSeconds);
      
      if (spotifyClientSecret) await SecureStore.setItemAsync('spotifyClientSecret', spotifyClientSecret);
      if (youtubeApiKey) await SecureStore.setItemAsync('youtubeApiKey', youtubeApiKey);
      if (openaiApiKey) await SecureStore.setItemAsync('openaiApiKey', openaiApiKey);

      if (setTheme) {
        setTheme({ mode: localMode, accent: localAccent });
      }
      
      Alert.alert('Erfolg', 'Einstellungen wurden sicher gespeichert.');
    } catch (error) {
      Alert.alert('Fehler', 'Speichern fehlgeschlagen');
    }
  };

  const SettingCard = ({ title, icon: Icon, children, color }) => (
    <View style={[styles.card, { backgroundColor: localMode === 'dark' ? '#1E1E1E' : '#FFFFFF' }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Icon size={20} color={color} />
        </View>
        <Text style={[styles.cardTitle, { color: localMode === 'dark' ? '#FFFFFF' : '#1C1C1C' }]}>{title}</Text>
      </View>
      <View style={styles.cardContent}>{children}</View>
    </View>
  );

  const CustomInput = ({ label, ...props }) => (
    <View style={styles.inputWrapper}>
      <Text style={[styles.inputLabel, { color: localMode === 'dark' ? '#AAAAAA' : '#666666' }]}>{label}</Text>
      <TextInput
        {...props}
        style={[
          styles.input,
          { 
            backgroundColor: localMode === 'dark' ? '#2C2C2C' : '#F5F5F5',
            color: localMode === 'dark' ? '#FFFFFF' : '#000000',
            borderColor: localMode === 'dark' ? '#3D3D3D' : '#E0E0E0'
          }
        ]}
        placeholderTextColor={localMode === 'dark' ? '#666666' : '#999999'}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: localMode === 'dark' ? '#121212' : '#FDF8F1' }]}>
        <ActivityIndicator size="large" color={localAccent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: localMode === 'dark' ? '#121212' : '#FDF8F1' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={28} color={localMode === 'dark' ? '#FFFFFF' : '#1C1C1C'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: localMode === 'dark' ? '#FFFFFF' : '#1C1C1C' }]}>Einstellungen</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <SettingCard title="Spotify Konfiguration" icon={Key} color="#1DB954">
            <CustomInput 
              label="Client ID" 
              value={spotifyClientId} 
              onChangeText={setSpotifyClientId} 
              placeholder="Deine Spotify Client ID"
              autoCapitalize="none"
            />
            <CustomInput 
              label="Client Secret" 
              value={spotifyClientSecret} 
              onChangeText={setSpotifyClientSecret} 
              placeholder="Wird sicher gespeichert"
              secureTextEntry
              autoCapitalize="none"
            />
          </SettingCard>

          <SettingCard title="Zusätzliche Dienste" icon={Cpu} color={localAccent}>
            <CustomInput 
              label="YouTube API Key" 
              value={youtubeApiKey} 
              onChangeText={setYoutubeApiKey} 
              placeholder="Für Musiksuche"
              secureTextEntry
            />
            <CustomInput 
              label="OpenAI API Key" 
              value={openaiApiKey} 
              onChangeText={setOpenaiApiKey} 
              placeholder="Optional: Für KI-Features"
              secureTextEntry
            />
          </SettingCard>

          <SettingCard title="Wiedergabe" icon={Timer} color="#FF9500">
            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.switchLabel, { color: localMode === 'dark' ? '#FFFFFF' : '#1C1C1C' }]}>Auto-Stop Timer</Text>
                <Text style={styles.switchSubLabel}>Stoppt Musik automatisch</Text>
              </View>
              <Switch
                value={playbackTimerEnabled}
                onValueChange={setPlaybackTimerEnabled}
                trackColor={{ false: '#D1D1D1', true: localAccent }}
                thumbColor="#FFFFFF"
              />
            </View>
            {playbackTimerEnabled && (
              <View style={styles.timerInputRow}>
                <TextInput
                  style={[styles.smallInput, { backgroundColor: localMode === 'dark' ? '#2C2C2C' : '#F5F5F5', color: localMode === 'dark' ? '#FFFFFF' : '#000000' }]}
                  value={playbackTimerSeconds}
                  onChangeText={setPlaybackTimerSeconds}
                  keyboardType="numeric"
                  maxLength={4}
                />
                <Text style={{ color: localMode === 'dark' ? '#AAAAAA' : '#666666', marginLeft: 10 }}>Sekunden bis Stop</Text>
              </View>
            )}
          </SettingCard>

          <SettingCard title="Erscheinungsbild" icon={Palette} color={localAccent}>
            <Text style={[styles.subSectionTitle, { color: localMode === 'dark' ? '#AAAAAA' : '#666666' }]}>Akzentfarbe wählen</Text>
            <View style={styles.colorGrid}>
              {['#634E34', '#8a2be2', '#ff3b30', '#34c759', '#0a84ff', '#E91E63', '#009688'].map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setLocalAccent(color)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    localAccent === color && styles.colorCircleActive
                  ]}
                >
                  {localAccent === color && <CheckCircle2 size={18} color="#FFF" />}
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={[styles.switchRow, { marginTop: 20, borderTopWidth: 1, borderTopColor: localMode === 'dark' ? '#333' : '#EEE', paddingTop: 15 }]}>
              <Text style={[styles.switchLabel, { color: localMode === 'dark' ? '#FFFFFF' : '#1C1C1C' }]}>Dunkelmodus</Text>
              <Switch
                value={localMode === 'dark'}
                onValueChange={(val) => setLocalMode(val ? 'dark' : 'light')}
                trackColor={{ false: '#D1D1D1', true: localAccent }}
              />
            </View>
          </SettingCard>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: localAccent }]} 
            onPress={saveSettings}
            activeOpacity={0.8}
          >
            <Save size={20} color="#FFF" />
            <Text style={styles.saveButtonText}>Speichern</Text>
          </TouchableOpacity>

          <View style={[styles.infoBox, { backgroundColor: localMode === 'dark' ? '#1E1E1E' : '#F0F0F0' }]}>
            <Info size={16} color={localAccent} />
            <Text style={[styles.infoText, { color: localMode === 'dark' ? '#888' : '#666' }]}>
              Deine API Keys werden lokal auf diesem Gerät verschlüsselt gespeichert.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16,
    height: 60
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  backButton: { padding: 8 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  card: {
    borderRadius: 28, // Material 3 Look
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardContent: { gap: 12 },

  inputWrapper: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 4 },
  input: {
    height: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 16, fontWeight: '600' },
  switchSubLabel: { fontSize: 13, color: '#888', marginTop: 2 },
  
  timerInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  smallInput: { width: 70, height: 45, borderRadius: 12, textAlign: 'center', fontSize: 16, fontWeight: 'bold' },

  subSectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  colorCircleActive: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },

  saveButton: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6
  },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  infoBox: { flexDirection: 'row', padding: 16, borderRadius: 20, marginTop: 30, gap: 12, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 }
});

export default SettingsScreen;