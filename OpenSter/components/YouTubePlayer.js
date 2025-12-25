import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Mock-Komponente für den YouTube-Player, da die Installation von react-native-youtube Probleme bereitet
const YouTubePlayer = ({ videoId, onPlaybackComplete }) => {
  // In einer echten Implementierung würde hier der YouTube-Player eingebunden
  // Für die Mock-Version zeigen wir einfach eine Nachricht an
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>YouTube Player (Mock)</Text>
      <Text style={styles.videoId}>Video ID: {videoId}</Text>
      <Text style={styles.infoText}>
        In der echten App würde hier der YouTube-Player mit dem Video starten.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  videoId: {
    color: '#8a2be2', // Neon-Violett
    fontSize: 14,
    marginBottom: 5,
  },
  infoText: {
    color: '#ccc',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default YouTubePlayer;