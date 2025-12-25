import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image
} from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎵 OpenSter</Text>
        <Text style={styles.subtitle}>Musik-Quiz-Spiel für deine Party</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Spielkarten erstellen</Text>
          <Text style={styles.featureDescription}>
            Importiere eine Spotify-Playlist, lasse dir die Original-Jahre anzeigen 
            und generiere physische Spielkarten zum Ausdrucken.
          </Text>
          
          <TouchableOpacity 
            style={styles.featureButton}
            onPress={() => navigation.navigate('Import')}
          >
            <Text style={styles.featureButtonText}>Playlist importieren</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Jukebox-Modus</Text>
          <Text style={styles.featureDescription}>
            Scanne die QR-Codes auf den Spielkarten und spiele die Musik 
            direkt über Spotify Connect oder YouTube ab.
          </Text>
          
          <TouchableOpacity 
            style={styles.featureButton}
            onPress={() => navigation.navigate('Jukebox')}
          >
            <Text style={styles.featureButtonText}>QR-Scanner starten</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Einstellungen</Text>
          <Text style={styles.featureDescription}>
            Füge deine API-Schlüssel für Spotify, YouTube und OpenAI hinzu, 
            um alle Funktionen nutzen zu können.
          </Text>
          
          <TouchableOpacity 
            style={styles.featureButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.featureButtonText}>API-Schlüssel verwalten</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>OpenSter - Open Source Musik-Quiz</Text>
        <Text style={styles.disclaimerText}>
          Dies ist ein unabhängiges Open-Source-Projekt. Keine Verbindung zu Markenherstellern.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dunkler Hintergrund
  },
  header: {
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8a2be2', // Neon-Violett
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#00ced1', // Neon-Cyan
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  featureCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8a2be2', // Neon-Violett
    marginBottom: 10,
  },
  featureDescription: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 15,
  },
  featureButton: {
    backgroundColor: '#8a2be2', // Neon-Violett
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  featureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 5,
  },
  disclaimerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default HomeScreen;