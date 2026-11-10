'use client';

/**
 * On-Device Offline Audio Storage Engine (IndexedDB)
 * Stores user-uploaded MP3, WAV, FLAC, OGG, and M4A tracks locally on device.
 * Zero cloud servers, zero external network traffic, 100% privacy-preserving.
 */

export interface CustomTrack {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration: number; // in seconds
  blob: Blob;
  createdAt: string;
}

const DB_NAME = 'heatmaps_offline_audio';
const DB_VERSION = 1;
const STORE_NAME = 'custom_tracks';

// In-memory fallback for environments without IndexedDB (e.g. SSR or testing)
const memoryStore: Map<string, CustomTrack> = new Map();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not available in this environment.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const AUDIO_LIMITS = {
  MAX_FILE_BYTES: 25 * 1024 * 1024, // 25 MB per file
  MAX_LIBRARY_BYTES: 150 * 1024 * 1024, // 150 MB total library size in IndexedDB
  MAX_BATCH_FILES: 10, // Max 10 files per upload batch
  MAX_TOTAL_TRACKS: 30, // Max 30 tracks stored
} as const;

export const CustomAudioStorage = {
  /**
   * Reads the duration of an audio blob using an offscreen Audio element
   */
  async getAudioDuration(blob: Blob): Promise<number> {
    if (typeof window === 'undefined') return 0;
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(blob);
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.src = url;
        audio.onloadedmetadata = () => {
          const dur = Math.round(audio.duration || 0);
          URL.revokeObjectURL(url);
          resolve(dur);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(0);
        };
      } catch {
        resolve(0);
      }
    });
  },

  /**
   * Save an uploaded audio File into IndexedDB with quota and boundary checks
   */
  async saveTrack(file: File, customTitle?: string): Promise<CustomTrack> {
    const isAudio =
      file.type.startsWith('audio/') ||
      /\.(mp3|wav|ogg|flac|m4a|aac|weba)$/i.test(file.name);
    if (!isAudio) {
      throw new Error(`File "${file.name}" is not a recognized audio format.`);
    }

    if (file.size > AUDIO_LIMITS.MAX_FILE_BYTES) {
      throw new Error(
        `File "${file.name}" exceeds the maximum allowed file size of ${(AUDIO_LIMITS.MAX_FILE_BYTES / (1024 * 1024)).toFixed(0)}MB.`
      );
    }

    const existingTracks = await this.getAllTracks();
    if (existingTracks.length >= AUDIO_LIMITS.MAX_TOTAL_TRACKS) {
      throw new Error(
        `Maximum track limit reached (${AUDIO_LIMITS.MAX_TOTAL_TRACKS} tracks). Delete existing tracks before uploading more.`
      );
    }

    const currentLibraryBytes = existingTracks.reduce((sum, t) => sum + (t.fileSize || 0), 0);
    if (currentLibraryBytes + file.size > AUDIO_LIMITS.MAX_LIBRARY_BYTES) {
      throw new Error(
        `Storage quota exceeded. Total library cannot exceed ${(AUDIO_LIMITS.MAX_LIBRARY_BYTES / (1024 * 1024)).toFixed(0)}MB.`
      );
    }

    const id = `track_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const duration = await this.getAudioDuration(file);
    const title = customTitle?.trim() || file.name.replace(/\.[^/.]+$/, '');

    const track: CustomTrack = {
      id,
      title,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'audio/mpeg',
      duration,
      blob: file,
      createdAt: new Date().toISOString(),
    };

    if (typeof window === 'undefined' || !window.indexedDB) {
      memoryStore.set(id, track);
      return track;
    }

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(track);

      req.onsuccess = () => resolve(track);
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Calculate total bytes consumed by all custom tracks
   */
  async getTotalLibraryBytes(): Promise<number> {
    const tracks = await this.getAllTracks();
    return tracks.reduce((sum, t) => sum + (t.fileSize || 0), 0);
  },

  /**
   * Fetch all user-uploaded tracks from IndexedDB
   */
  async getAllTracks(): Promise<CustomTrack[]> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Array.from(memoryStore.values());
    }

    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const list = (req.result as CustomTrack[]) || [];
          // Sort by creation date descending
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return Array.from(memoryStore.values());
    }
  },

  /**
   * Fetch a single track by ID
   */
  async getTrackById(id: string): Promise<CustomTrack | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return memoryStore.get(id) || null;
    }

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Delete a custom track by ID
   */
  async deleteTrack(id: string): Promise<void> {
    memoryStore.delete(id);
    if (typeof window === 'undefined' || !window.indexedDB) return;

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Update the title of an existing track
   */
  async updateTrackTitle(id: string, newTitle: string): Promise<void> {
    const track = await this.getTrackById(id);
    if (!track) return;

    track.title = newTitle.trim() || track.fileName;

    if (typeof window === 'undefined' || !window.indexedDB) {
      memoryStore.set(id, track);
      return;
    }

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(track);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Clear all custom tracks (Reset)
   */
  async clearAll(): Promise<void> {
    memoryStore.clear();
    if (typeof window === 'undefined' || !window.indexedDB) return;

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Format bytes to readable string (e.g. 4.2 MB)
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  },

  /**
   * Format seconds to MM:SS
   */
  formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  },
};
