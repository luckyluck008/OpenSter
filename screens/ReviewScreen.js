import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../theme/ThemeProvider';
import { Youtube, Edit2, Check, Trash2 } from 'lucide-react-native';

const ReviewScreen = ({ route, navigation }) => {
  const { playlistInfo, tracks } = route.params;
  const [editedTracks, setEditedTracks] = useState(tracks);
  const [editingTrackIndex, setEditingTrackIndex] = useState(null);
  const { theme } = useContext(ThemeContext);
  const accent = theme?.accent || '#FF0000';
  const isDark = theme?.mode === 'dark';

  const updateTrack = (index, field, value) => {
    const updatedTracks = [...editedTracks];
    updatedTracks[index] = {
      ...updatedTracks[index],
      [field]: value,
    };
    setEditedTracks(updatedTracks);
  };

  const removeTrack = (index) => {
    Alert.alert(
      'Track entfernen?',
      'Möchtest du diesen Track wirklich entfernen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Entfernen', 
          style: 'destructive',
          onPress: () => {
            const updatedTracks = editedTracks.filter((_, i) => i !== index);
            setEditedTracks(updatedTracks);
          }
        }
      ]
    );
  };

  const handleGenerateCards = async () => {
    try {
      await AsyncStorage.setItem('selectedTracks', JSON.stringify(editedTracks));
      navigation.navigate('Print', { 
        playlistInfo, 
        tracks: editedTracks 
      });
    } catch (error) {
      console.error('Fehler beim Speichern der Tracks:', error);
      Alert.alert('Fehler', 'Fehler beim Speichern der Musikdaten');
    }
  };

  const renderTrackItem = ({ item, index }) => (
    <View style={[styles.trackItem, { backgroundColor: isDark ? '#1e1e1e' : '#f9f9f9', borderColor: isDark ? '#333' : '#e5e7eb' }]}>
      <View style={styles.trackHeader}>
        {/* Thumbnail */}
        {item.thumbnail && (
          <Image 
            source={{ uri: item.thumbnail }} 
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}
        {!item.thumbnail && (
          <View style={[styles.thumbnail, { backgroundColor: isDark ? '#2c2c2c' : '#e5e7eb', justifyContent: 'center', alignItems: 'center' }]}>
            <Youtube size={20} color="#FF0000" />
          </View>
        )}
        
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, { color: isDark ? '#fff' : '#1a1a1a' }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.trackArtist, { color: isDark ? '#aaa' : '#666' }]} numberOfLines={1}>
            {item.artist}
          </Text>
          {item.youtubeId && (
            <Text style={[styles.trackId, { color: isDark ? '#666' : '#999' }]} numberOfLines={1}>
              youtube.com/watch?v={item.youtubeId}
            </Text>
          )}
        </View>
        
        <View style={styles.trackActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: isDark ? '#2c2c2c' : '#f0f0f0' }]}
            onPress={() => setEditingTrackIndex(editingTrackIndex === index ? null : index)}
          >
            {editingTrackIndex === index ? (
              <Check size={18} color="#4CAF50" />
            ) : (
              <Edit2 size={18} color={accent} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: isDark ? '#2c2c2c' : '#f0f0f0', marginTop: 6 }]}
            onPress={() => removeTrack(index)}
          >
            <Trash2 size={18} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.yearRow}>
        <Text style={[styles.yearLabel, { color: isDark ? '#aaa' : '#666' }]}>Jahr:</Text>
        <TextInput
          style={[styles.yearInput, { 
            backgroundColor: isDark ? '#2c2c2c' : '#fff',
            color: accent,
            borderColor: isDark ? '#444' : '#ddd'
          }]}
          value={item.originalYear ? item.originalYear.toString() : ''}
          onChangeText={(value) => updateTrack(index, 'originalYear', value ? parseInt(value) : null)}
          placeholder="----"
          placeholderTextColor="#666"
          keyboardType="numeric"
          maxLength={4}
        />
      </View>
      
      {editingTrackIndex === index && (
        <View style={styles.editSection}>
          <View style={styles.editField}>
            <Text style={[styles.editLabel, { color: isDark ? '#aaa' : '#666' }]}>Titel:</Text>
            <TextInput
              style={[styles.editInput, { 
                backgroundColor: isDark ? '#2c2c2c' : '#fff',
                color: isDark ? '#fff' : '#1a1a1a',
                borderColor: isDark ? '#444' : '#ddd'
              }]}
              value={item.name}
              onChangeText={(value) => updateTrack(index, 'name', value)}
              placeholder="Track Titel"
              placeholderTextColor="#666"
            />
          </View>
          <View style={styles.editField}>
            <Text style={[styles.editLabel, { color: isDark ? '#aaa' : '#666' }]}>Künstler:</Text>
            <TextInput
              style={[styles.editInput, { 
                backgroundColor: isDark ? '#2c2c2c' : '#fff',
                color: isDark ? '#fff' : '#1a1a1a',
                borderColor: isDark ? '#444' : '#ddd'
              }]}
              value={item.artist}
              onChangeText={(value) => updateTrack(index, 'artist', value)}
              placeholder="Künstlername"
              placeholderTextColor="#666"
            />
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: isDark ? '#121212' : '#fff' }} edges={['left', 'right', 'bottom']}>
      <View className="px-4 py-3 border-b" style={{ borderBottomColor: isDark ? '#333' : '#e5e7eb' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Youtube size={20} color="#FF0000" style={{ marginRight: 8 }} />
          <Text className="text-lg font-bold" style={{ color: isDark ? '#fff' : '#1a1a1a' }} numberOfLines={1}>
            {playlistInfo.name}
          </Text>
        </View>
        <Text className="text-sm mt-1" style={{ color: isDark ? '#aaa' : '#666' }}>
          {editedTracks.length} Tracks • YouTube Playlist
        </Text>
      </View>

      <FlatList
        data={editedTracks}
        renderItem={renderTrackItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <View className="p-4 border-t" style={{ borderTopColor: isDark ? '#333' : '#e5e7eb' }}>
        <TouchableOpacity 
          className="py-3 rounded-lg items-center flex-row justify-center"
          onPress={handleGenerateCards}
          activeOpacity={0.8}
          style={{ backgroundColor: '#FF0000' }}
        >
          <Youtube size={20} color="white" style={{ marginRight: 8 }} />
          <Text className="text-white font-bold">🎴 Karten generieren</Text>
        </TouchableOpacity>
        
        <Text style={{ 
          textAlign: 'center', 
          marginTop: 8, 
          fontSize: 12, 
          color: isDark ? '#666' : '#999' 
        }}>
          QR-Codes werden für YouTube Videos generiert
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 12,
  },
  trackItem: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  thumbnail: {
    width: 60,
    height: 45,
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: '#333',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 12,
    marginBottom: 2,
  },
  trackId: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  trackActions: {
    marginLeft: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  yearLabel: {
    fontSize: 13,
    marginRight: 8,
  },
  yearInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    width: 70,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  editSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  editField: {
    marginBottom: 8,
  },
  editLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  editInput: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
    fontSize: 14,
  },
});

export default ReviewScreen;
