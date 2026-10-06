import AsyncStorage from '@react-native-async-storage/async-storage';

let ExpoAudio = null;
try {
  // eslint-disable-next-line global-require
  ExpoAudio = require('expo-audio');
} catch (e) {
  // Silent fallback if native audio module is not bundled in environment
}

const STORAGE_KEY = '@yoyo_my_music_tracks';
const PLAY_IN_OTHER_APPS_KEY = '@yoyo_music_play_other_apps';
const DEVICE_LIBRARY_KEY = '@yoyo_device_audio_library';

class MusicPlayerManager {
  constructor() {
    this.audioPlayer = null;
    this.currentSong = null;
    this.isPlaying = false;
    this.volume = 0.6;
    this.playInOtherApps = false;
    this.listeners = new Set();
    this.myMusicList = [];
    this.deviceLibrary = [];
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Clean out any old mock/sample tracks that start with 'lib_'
        const cleaned = Array.isArray(parsed)
          ? parsed.filter((s) => s && !String(s.id).startsWith('lib_'))
          : [];
        this.myMusicList = cleaned;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      } else {
        this.myMusicList = [];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      }

      // Load device picked library pool
      const storedDeviceLib = await AsyncStorage.getItem(DEVICE_LIBRARY_KEY);
      if (storedDeviceLib) {
        const parsedDev = JSON.parse(storedDeviceLib);
        this.deviceLibrary = Array.isArray(parsedDev)
          ? parsedDev.filter((s) => s && !String(s.id).startsWith('lib_'))
          : [];
      } else {
        this.deviceLibrary = [];
      }

      const storedOtherApps = await AsyncStorage.getItem(PLAY_IN_OTHER_APPS_KEY);
      if (storedOtherApps !== null) {
        this.playInOtherApps = storedOtherApps === 'true';
      }

      // Set active song if user has added music
      if (this.myMusicList.length > 0) {
        this.currentSong = this.myMusicList[0];
      } else {
        this.currentSong = null;
      }

      if (ExpoAudio && typeof ExpoAudio.setIsAudioActiveAsync === 'function') {
        try {
          await ExpoAudio.setIsAudioActiveAsync(true);
        } catch (err) {
          // ignore
        }
      }

      this.isInitialized = true;
      this.notify();
    } catch (err) {
      console.log('Failed to init MusicPlayerManager:', err);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState() {
    return {
      currentSong: this.currentSong,
      isPlaying: this.isPlaying,
      volume: this.volume,
      playInOtherApps: this.playInOtherApps,
      myMusicList: this.myMusicList,
      deviceLibrary: this.deviceLibrary,
    };
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('MusicPlayer listener error:', err);
      }
    });
  }

  async playSong(song) {
    if (!song) return;
    try {
      if (this.audioPlayer) {
        try {
          if (typeof this.audioPlayer.pause === 'function') {
            this.audioPlayer.pause();
          }
          if (typeof this.audioPlayer.remove === 'function') {
            this.audioPlayer.remove();
          }
        } catch (e) {
          // ignore
        }
        this.audioPlayer = null;
      }

      this.currentSong = song;
      this.isPlaying = true;
      this.notify();

      if (ExpoAudio && typeof ExpoAudio.createAudioPlayer === 'function' && song.uri) {
        try {
          const player = ExpoAudio.createAudioPlayer(song.uri);
          if (player) {
            this.audioPlayer = player;
            if (typeof player.setVolume === 'function') {
              player.setVolume(this.volume);
            }
            if (typeof player.play === 'function') {
              player.play();
            }
          }
        } catch (err) {
          // Keep UI playback state smooth
        }
      }
    } catch (err) {
      this.isPlaying = true;
      this.notify();
    }
  }

  async togglePlay() {
    if (!this.currentSong && this.myMusicList.length > 0) {
      await this.playSong(this.myMusicList[0]);
      return;
    }

    if (!this.currentSong) {
      return;
    }

    if (this.isPlaying) {
      if (this.audioPlayer && typeof this.audioPlayer.pause === 'function') {
        try {
          this.audioPlayer.pause();
        } catch (e) {
          // ignore
        }
      }
      this.isPlaying = false;
      this.notify();
    } else {
      if (this.audioPlayer && typeof this.audioPlayer.play === 'function') {
        try {
          this.audioPlayer.play();
          this.isPlaying = true;
          this.notify();
          return;
        } catch (e) {
          // ignore
        }
      }
      if (this.currentSong) {
        await this.playSong(this.currentSong);
      }
    }
  }

  async next() {
    if (!this.myMusicList || this.myMusicList.length === 0) return;
    const currentIndex = this.myMusicList.findIndex(
      (s) => s.id === this.currentSong?.id
    );
    const nextIndex = (currentIndex + 1) % this.myMusicList.length;
    await this.playSong(this.myMusicList[nextIndex]);
  }

  async prev() {
    if (!this.myMusicList || this.myMusicList.length === 0) return;
    const currentIndex = this.myMusicList.findIndex(
      (s) => s.id === this.currentSong?.id
    );
    const prevIndex =
      currentIndex <= 0 ? this.myMusicList.length - 1 : currentIndex - 1;
    await this.playSong(this.myMusicList[prevIndex]);
  }

  async setVolume(newVolume) {
    const clamped = Math.max(0, Math.min(1, newVolume));
    this.volume = clamped;
    if (this.audioPlayer && typeof this.audioPlayer.setVolume === 'function') {
      try {
        this.audioPlayer.setVolume(clamped);
      } catch (e) {
        // ignore
      }
    }
    this.notify();
  }

  async setPlayInOtherApps(val) {
    this.playInOtherApps = val;
    await AsyncStorage.setItem(PLAY_IN_OTHER_APPS_KEY, val ? 'true' : 'false');
    this.notify();
  }

  async addToDeviceLibrary(song) {
    if (!song) return;
    const exists = this.deviceLibrary.some((s) => s.id === song.id || s.uri === song.uri);
    if (!exists) {
      this.deviceLibrary = [song, ...this.deviceLibrary];
      await AsyncStorage.setItem(DEVICE_LIBRARY_KEY, JSON.stringify(this.deviceLibrary));
      this.notify();
    }
  }

  async addSongs(songsToAdd) {
    if (!Array.isArray(songsToAdd) || songsToAdd.length === 0) return;
    const existingIds = new Set(this.myMusicList.map((s) => s.id));
    const newItems = songsToAdd.filter((s) => !existingIds.has(s.id));
    this.myMusicList = [...this.myMusicList, ...newItems];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.myMusicList));

    if (!this.currentSong && this.myMusicList.length > 0) {
      this.currentSong = this.myMusicList[0];
    }

    this.notify();
  }

  async deleteSongs(songIdsToDelete) {
    if (!Array.isArray(songIdsToDelete) || songIdsToDelete.length === 0) return;
    const idsSet = new Set(songIdsToDelete);
    const isCurrentDeleted = this.currentSong && idsSet.has(this.currentSong.id);

    this.myMusicList = this.myMusicList.filter((s) => !idsSet.has(s.id));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.myMusicList));

    if (isCurrentDeleted) {
      if (this.audioPlayer) {
        try {
          if (typeof this.audioPlayer.pause === 'function') {
            this.audioPlayer.pause();
          }
          if (typeof this.audioPlayer.remove === 'function') {
            this.audioPlayer.remove();
          }
        } catch (e) {
          // ignore
        }
        this.audioPlayer = null;
      }
      this.isPlaying = false;
      this.currentSong = this.myMusicList.length > 0 ? this.myMusicList[0] : null;
    }

    this.notify();
  }

  async stopAndUnload() {
    if (this.audioPlayer) {
      try {
        if (typeof this.audioPlayer.pause === 'function') {
          this.audioPlayer.pause();
        }
        if (typeof this.audioPlayer.remove === 'function') {
          this.audioPlayer.remove();
        }
      } catch (e) {
        // ignore
      }
      this.audioPlayer = null;
    }
    this.isPlaying = false;
    this.notify();
  }
}

export const musicPlayer = new MusicPlayerManager();
