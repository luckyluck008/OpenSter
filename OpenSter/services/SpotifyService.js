import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { encode as btoa } from 'base-64';

class SpotifyService {
  constructor() {
    this.token = null;
    this.clientId = null;
    this.clientSecret = null;
  }

  async initialize() {
    this.clientId = await AsyncStorage.getItem('spotifyClientId');
    this.clientSecret = await SecureStore.getItemAsync('spotifyClientSecret');
  }

  async authenticate() {
    if (!this.clientId || !this.clientSecret) {
      console.log('Missing credentials - clientId:', !!this.clientId, 'clientSecret:', !!this.clientSecret);
      throw new Error('Spotify credentials not configured');
    }

    console.log('Authenticating with Spotify... clientId:', this.clientId.substring(0, 8) + '...');

    try {
      // Get access token using client credentials flow
      const authString = `${this.clientId}:${this.clientSecret}`;
      const base64Auth = btoa(authString);
      
      const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${base64Auth}`,
          },
        }
      );

      this.token = tokenResponse.data.access_token;
      console.log('Got Spotify token successfully!');
      return this.token;
    } catch (error) {
      console.error('Error authenticating with Spotify:', error.response?.data || error.message);
      throw error;
    }
  }

  async getAccessToken() {
    if (!this.token) {
      await this.authenticate();
    }
    return this.token;
  }

  async getPlaylistTracks(playlistId) {
    try {
      await this.initialize();
      const token = await this.getAccessToken();

      // First, get the total number of tracks to handle pagination
      let allTracks = [];
      let offset = 0;
      const limit = 100; // Maximum allowed by Spotify API

      while (true) {
        const response = await axios.get(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              limit,
              offset,
              fields: 'items(track(id,name,artists,album)),total,next',
            },
          }
        );

        const tracks = response.data.items.map(item => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists.map(artist => artist.name).join(', '),
          album: item.track.album.name,
          albumImage: item.track.album.images[0]?.url || null,
        }));

        allTracks = allTracks.concat(tracks);

        if (allTracks.length >= response.data.total) {
          break;
        }

        offset += limit;
      }

      return allTracks;
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
      throw error;
    }
  }

  // Extract playlist ID from a Spotify playlist URL
  extractPlaylistId(url) {
    // Clean the URL first - remove query parameters
    const cleanUrl = url.split('?')[0].trim();
    
    // Handle various Spotify URL formats
    const patterns = [
      /spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
      /spotify\.com\/embed\/playlist\/([a-zA-Z0-9]+)/,
      /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
      /spotify:playlist:([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match) {
        console.log('Extracted playlist ID:', match[1]);
        return match[1];
      }
    }

    // If it's just the ID (22 characters alphanumeric)
    if (/^[a-zA-Z0-9]{22}$/.test(cleanUrl)) {
      console.log('Using direct playlist ID:', cleanUrl);
      return cleanUrl;
    }

    throw new Error('Invalid Spotify playlist URL');
  }

  // Validate that the playlist exists and is accessible
  async validatePlaylist(playlistId) {
    try {
      await this.initialize();
      const token = await this.getAccessToken();

      console.log('Validating playlist ID:', playlistId);
      console.log('Using token:', token.substring(0, 20) + '...');

      const response = await axios.get(
        `https://api.spotify.com/v1/playlists/${playlistId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            fields: 'id,name,owner(display_name),tracks(total)',
          },
        }
      );

      console.log('Playlist found:', response.data.name);

      return {
        id: response.data.id,
        name: response.data.name,
        owner: response.data.owner.display_name,
        trackCount: response.data.tracks.total,
      };
    } catch (error) {
      console.error('Validate playlist error - Status:', error.response?.status);
      console.error('Validate playlist error - Data:', error.response?.data);
      throw error;
    }
  }

  // Get detailed track information for a list of track IDs
  async getTracksInfo(trackIds) {
    try {
      await this.initialize();
      const token = await this.getAccessToken();

      // Spotify API allows up to 50 tracks per request
      const batchSize = 50;
      const allTracksInfo = [];

      for (let i = 0; i < trackIds.length; i += batchSize) {
        const batch = trackIds.slice(i, i + batchSize);
        const ids = batch.join(',');

        const response = await axios.get(
          `https://api.spotify.com/v1/tracks`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              ids,
            },
          }
        );

        const tracks = response.data.tracks.map(track => ({
          id: track.id,
          name: track.name,
          artist: track.artists.map(artist => artist.name).join(', '),
          album: track.album.name,
          albumImage: track.album.images[0]?.url || null,
          duration: track.duration_ms,
          popularity: track.popularity,
        }));

        allTracksInfo.push(...tracks);
      }

      return allTracksInfo;
    } catch (error) {
      console.error('Error fetching tracks info:', error);
      throw error;
    }
  }
}

export default new SpotifyService();