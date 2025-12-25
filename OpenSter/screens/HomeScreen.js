import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>🎵 OpenSter</Text>
          <Text style={styles.subtitle}>Musik-Quiz-Spiel für deine Party</Text>
        </View>

        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => navigation.navigate('Import')}
            activeOpacity={0.8}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.cardEmoji}>🎴</Text>
            </View>
            <Text style={styles.featureTitle}>Spielkarten erstellen</Text>
            <Text style={styles.featureDescription}>
              Importiere eine Spotify-Playlist und generiere Spielkarten zum Ausdrucken.
            </Text>
            <View style={styles.featureButton}>
              <Text style={styles.featureButtonText}>Playlist importieren →</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => navigation.navigate('Jukebox')}
            activeOpacity={0.8}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.cardEmoji}>📱</Text>
            </View>
            <Text style={styles.featureTitle}>Jukebox-Modus</Text>
            <Text style={styles.featureDescription}>
              Scanne QR-Codes und spiele Musik über Spotify oder YouTube ab.
            </Text>
            <View style={styles.featureButton}>
              <Text style={styles.featureButtonText}>QR-Scanner starten →</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.8}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.cardEmoji}>⚙️</Text>
            </View>
            <Text style={styles.featureTitle}>Einstellungen</Text>
            <Text style={styles.featureDescription}>
              API-Schlüssel für Spotify, YouTube und OpenAI verwalten.
            </Text>
            <View style={styles.featureButton}>
              <Text style={styles.featureButtonText}>Einstellungen öffnen →</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>OpenSter - Open Source Musik-Quiz</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8a2be2',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#00ced1',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  featureCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardEmoji: {
    fontSize: 22,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    marginBottom: 12,
  },
  featureButton: {
    backgroundColor: '#8a2be2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  featureButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
  },
});

export default HomeScreen;