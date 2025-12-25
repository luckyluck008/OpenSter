import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';
import { encode as btoa } from 'base-64';
import { Alert, Linking } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

// Spotify OAuth Scopes für Playback
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state', 
  'user-read-currently-playing',
  'streaming',
  'app-remote-control'
].join(' ');

class SpotifyPlaybackService {
  constructor() {
    this.userAccessToken = null;
    this.refreshToken = null;
    this.clientId = null;
    this.clientSecret = null;
    this.tokenExpiry = null;
  }

  async initialize() {
    this.clientId = await AsyncStorage.getItem('spotifyClientId');
    this.clientSecret = await SecureStore.getItemAsync('spotifyClientSecret');
    this.userAccessToken = await SecureStore.getItemAsync('spotifyUserToken');
    this.refreshToken = await SecureStore.getItemAsync('spotifyRefreshToken');
    const expiry = await AsyncStorage.getItem('spotifyTokenExpiry');
    this.tokenExpiry = expiry ? parseInt(expiry) : null;
  }

  // Prüfe ob User eingeloggt ist
  async isLoggedIn() {
    await this.initialize();
    if (!this.userAccessToken) return false;
    
    // Prüfe ob Token abgelaufen
    if (this.tokenExpiry && Date.now() > this.tokenExpiry) {
      // Versuche Token zu refreshen
      if (this.refreshToken) {
        try {
          await this.refreshAccessToken();
          return true;
        } catch (e) {
          return false;
        }
      }
      return false;
    }
    return true;
  }

  // OAuth Login Flow
  async login() {
    await this.initialize();
    
    if (!this.clientId) {
      throw new Error('Spotify Client ID nicht konfiguriert. Bitte in Einstellungen eingeben.');
    }

    // Für Expo Go muss eine spezielle URI verwendet werden
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'openster',
      preferLocalhost: false,
      isTripleSlashed: false,
    });

    console.log('========================================');
    console.log('REDIRECT URI FÜR SPOTIFY DASHBOARD:');
    console.log(redirectUri);
    console.log('========================================');
    
    // Alert dem User die URI zeigen
    Alert.alert(
      'Redirect URI', 
      `Füge diese URI im Spotify Dashboard hinzu:\n\n${redirectUri}`,
      [{ text: 'Kopiert, weiter!' }]
    );

    const authUrl = 
      `https://accounts.spotify.com/authorize?` +
      `client_id=${this.clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&show_dialog=true`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    
    console.log('Auth result:', result);

    if (result.type === 'success' && result.url) {
      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      
      if (code) {
        await this.exchangeCodeForToken(code, redirectUri);
        return true;
      }
    }
    
    throw new Error('Login abgebrochen oder fehlgeschlagen');
  }

  // Tausche Auth Code gegen Access Token
  async exchangeCodeForToken(code, redirectUri) {
    const authString = `${this.clientId}:${this.clientSecret}`;
    const base64Auth = btoa(authString);

    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${base64Auth}`,
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;
    
    this.userAccessToken = access_token;
    this.refreshToken = refresh_token;
    this.tokenExpiry = Date.now() + (expires_in * 1000);

    // Speichere Tokens
    await SecureStore.setItemAsync('spotifyUserToken', access_token);
    if (refresh_token) {
      await SecureStore.setItemAsync('spotifyRefreshToken', refresh_token);
    }
    await AsyncStorage.setItem('spotifyTokenExpiry', this.tokenExpiry.toString());

    console.log('Spotify User Login erfolgreich!');
  }

  // Refresh Token
  async refreshAccessToken() {
    if (!this.refreshToken || !this.clientId || !this.clientSecret) {
      throw new Error('Keine Refresh-Daten vorhanden');
    }

    const authString = `${this.clientId}:${this.clientSecret}`;
    const base64Auth = btoa(authString);

    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${base64Auth}`,
        },
      }
    );

    const { access_token, expires_in, refresh_token } = response.data;
    
    this.userAccessToken = access_token;
    this.tokenExpiry = Date.now() + (expires_in * 1000);
    
    if (refresh_token) {
      this.refreshToken = refresh_token;
      await SecureStore.setItemAsync('spotifyRefreshToken', refresh_token);
    }

    await SecureStore.setItemAsync('spotifyUserToken', access_token);
    await AsyncStorage.setItem('spotifyTokenExpiry', this.tokenExpiry.toString());
  }

  // Logout
  async logout() {
    this.userAccessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    await SecureStore.deleteItemAsync('spotifyUserToken');
    await SecureStore.deleteItemAsync('spotifyRefreshToken');
    await AsyncStorage.removeItem('spotifyTokenExpiry');
  }

  // Hole aktive Geräte
  async getDevices() {
    await this.ensureValidToken();

    const response = await axios.get(
      'https://api.spotify.com/v1/me/player/devices',
      {
        headers: {
          Authorization: `Bearer ${this.userAccessToken}`,
        },
      }
    );

    return response.data.devices || [];
  }

  // Aktiviere/Transfer zu einem Gerät
  async transferPlayback(deviceId, startPlaying = false) {
    await this.ensureValidToken();

    await axios.put(
      'https://api.spotify.com/v1/me/player',
      {
        device_ids: [deviceId],
        play: startPlaying,
      },
      {
        headers: {
          Authorization: `Bearer ${this.userAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('Playback zu Gerät transferiert:', deviceId);
  }

  // Stiller Track zum Aktivieren von Spotify (1 Sekunde Stille)
  SILENT_TRACK_ID = '5XSKC4d0y0DfcGbvDOiL93';

  // Öffne Spotify mit stillem Track um es zu aktivieren
  async wakeUpSpotifyApp() {
    try {
      console.log('Öffne Spotify mit stillem Track zum Aktivieren...');
      // Öffne den stillen Track - das aktiviert Spotify ohne störenden Sound
      const spotifyUri = `spotify:track:${this.SILENT_TRACK_ID}`;
      try {
        await Linking.openURL(spotifyUri);
        return true;
      } catch (e) {
        // Falls spotify: nicht funktioniert, versuche HTTPS
        await Linking.openURL(`https://open.spotify.com/track/${this.SILENT_TRACK_ID}`);
        return true;
      }
    } catch (error) {
      console.log('Spotify App öffnen fehlgeschlagen:', error.message);
      return false;
    }
  }

  // Spiele Track direkt per API ab (ohne App zu öffnen)
  async playTrackDirectly(trackId, deviceId) {
    await this.ensureValidToken();

    const data = {
      uris: [`spotify:track:${trackId}`],
    };

    const url = deviceId 
      ? `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`
      : 'https://api.spotify.com/v1/me/player/play';

    await axios.put(url, data, {
      headers: {
        Authorization: `Bearer ${this.userAccessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Track wird abgespielt:', trackId);
    return true;
  }

  // Öffne Spotify App und spiele Track direkt ab (alter Fallback)
  async playTrackInSpotifyApp(trackId) {
    try {
      // Versuche zuerst spotify: URI (öffnet direkt in App)
      const spotifyUri = `spotify:track:${trackId}`;
      console.log('Öffne Track in Spotify App:', trackId);
      
      try {
        await Linking.openURL(spotifyUri);
        return true;
      } catch (e) {
        // Falls spotify: nicht funktioniert, nutze HTTPS URL
        console.log('spotify: URI fehlgeschlagen, versuche HTTPS...');
        const httpsUrl = `https://open.spotify.com/track/${trackId}`;
        await Linking.openURL(httpsUrl);
        return true;
      }
    } catch (error) {
      console.log('Spotify App öffnen fehlgeschlagen:', error.message);
      return false;
    }
  }

  // Warte auf verfügbare Geräte mit Retries
  async waitForDevices(maxRetries = 5, delayMs = 800) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const devices = await this.getDevices();
        if (devices.length > 0) {
          console.log(`Gerät gefunden nach ${i + 1} Versuchen:`, devices[0].name);
          return devices;
        }
        console.log(`Versuch ${i + 1}/${maxRetries}: Keine Geräte, warte...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } catch (e) {
        console.log(`Versuch ${i + 1} fehlgeschlagen:`, e.message);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    return [];
  }

  // Spiele Track ab
  async playTrack(trackId, deviceId = null) {
    await this.ensureValidToken();

    const data = {
      uris: [`spotify:track:${trackId}`],
    };

    // Zuerst prüfen ob Geräte verfügbar sind
    let devices = await this.getDevices();
    
    // Wenn keine Geräte, öffne Spotify App mit dem Track
    if (devices.length === 0) {
      console.log('Keine Geräte gefunden, öffne Spotify App mit Track...');
      
      // Öffne den Track direkt in Spotify - das startet die Wiedergabe dort
      const opened = await this.playTrackInSpotifyApp(trackId);
      
      if (opened) {
        // Gib Spotify Zeit sich zu initialisieren
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Versuche mehrmals Geräte zu finden
        devices = await this.waitForDevices(5, 1000);
        
        // Wenn immer noch keine Geräte, ist der Track trotzdem in Spotify gestartet
        if (devices.length === 0) {
          console.log('Track läuft in Spotify App (kein API-Zugriff möglich)');
          return true; // Track spielt in Spotify, auch wenn wir es nicht steuern können
        }
      }
    }

    // Wenn ein Gerät angegeben ist oder wir eins gefunden haben
    const targetDeviceId = deviceId || (devices.length > 0 ? devices[0].id : null);
    
    if (targetDeviceId) {
      try {
        await this.transferPlayback(targetDeviceId, false);
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        console.log('Transfer fehlgeschlagen, versuche direkt abzuspielen:', e.message);
      }
    }

    let url = 'https://api.spotify.com/v1/me/player/play';
    if (targetDeviceId) {
      url += `?device_id=${targetDeviceId}`;
    }

    try {
      await axios.put(url, data, {
        headers: {
          Authorization: `Bearer ${this.userAccessToken}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Track wird abgespielt:', trackId);
      return true;
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 403) {
        // Letzter Versuch: Spotify App öffnen mit dem Track
        console.log('API fehlgeschlagen, öffne Track direkt in Spotify App...');
        const opened = await this.playTrackInSpotifyApp(trackId);
        if (opened) {
          // Track wurde in Spotify geöffnet und spielt dort
          return true;
        }
        throw new Error('Spotify App konnte nicht geöffnet werden. Ist Spotify installiert?');
      }
      throw error;
    }
  }

  // Pause
  async pause() {
    await this.ensureValidToken();

    await axios.put(
      'https://api.spotify.com/v1/me/player/pause',
      {},
      {
        headers: {
          Authorization: `Bearer ${this.userAccessToken}`,
        },
      }
    );
  }

  // Resume
  async resume() {
    await this.ensureValidToken();

    await axios.put(
      'https://api.spotify.com/v1/me/player/play',
      {},
      {
        headers: {
          Authorization: `Bearer ${this.userAccessToken}`,
        },
      }
    );
  }

  // Aktueller Playback Status
  async getPlaybackState() {
    await this.ensureValidToken();

    try {
      const response = await axios.get(
        'https://api.spotify.com/v1/me/player',
        {
          headers: {
            Authorization: `Bearer ${this.userAccessToken}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 204) {
        return null; // Kein aktiver Player
      }
      throw error;
    }
  }

  // Stelle sicher dass Token gültig ist
  async ensureValidToken() {
    await this.initialize();
    
    if (!this.userAccessToken) {
      throw new Error('Nicht eingeloggt. Bitte zuerst mit Spotify verbinden.');
    }

    if (this.tokenExpiry && Date.now() > this.tokenExpiry - 60000) {
      await this.refreshAccessToken();
    }
  }

  // Hole User-Profil
  async getUserProfile() {
    await this.ensureValidToken();

    const response = await axios.get(
      'https://api.spotify.com/v1/me',
      {
        headers: {
          Authorization: `Bearer ${this.userAccessToken}`,
        },
      }
    );

    return response.data;
  }
}

export default new SpotifyPlaybackService();
