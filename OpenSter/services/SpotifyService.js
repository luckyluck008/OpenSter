import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

class SpotifyService {
  constructor() {
    this.token = null;
    this.clientId = null;
    this.clientSecret = null;
  }

  async initialize() {
    this.clientId = await AsyncStorage.getItem('spotifyClientId');
    this.clientSecret = await AsyncStorage.getItem('spotifyClientSecret');
  }

  async authenticate() {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Spotify credentials not configured');
    }

    try {
      // Get access token using client credentials flow
      const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'client_credentials',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
          },
        }
      );

      this.token = tokenResponse.data.access_token;
      return this.token;
    } catch (error) {
      console.error('Error authenticating with Spotify:', error);
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
              fields: 'items(track(name,artists,album)),total,next',
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
    // Handle various Spotify URL formats
    const patterns = [
      /spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
      /spotify\.com\/embed\/playlist\/([a-zA-Z0-9]+)/,
      /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // If it's just the ID
    if (url.length >= 10 && /^[a-zA-Z0-9]+$/.test(url)) {
      return url;
    }

    throw new Error('Invalid Spotify playlist URL');
  }

  // Validate that the playlist exists and is accessible
  async validatePlaylist(playlistId) {
    try {
      await this.initialize();
      const token = await this.getAccessToken();

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

      return {
        id: response.data.id,
        name: response.data.name,
        owner: response.data.owner.display_name,
        trackCount: response.data.tracks.total,
      };
    } catch (error) {
      console.error('Error validating playlist:', error);
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