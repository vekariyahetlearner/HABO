'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Music,
  Trash2,
  Play,
  Pause,
  Edit2,
  Check,
  X,
  FileAudio,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { CustomAudioStorage, CustomTrack, AUDIO_LIMITS } from '@/lib/customAudioStorage';
import { sounds } from '@/lib/audio';
import { cn } from '@/lib/utils';

interface CustomAudioUploaderProps {
  activeCustomTrackId: string | null;
  isPlaying: boolean;
  onPlayTrack: (track: CustomTrack) => void;
  onStopTrack: () => void;
}

export const CustomAudioUploader: React.FC<CustomAudioUploaderProps> = ({
  activeCustomTrackId,
  isPlaying,
  onPlayTrack,
  onStopTrack,
}) => {
  const [tracks, setTracks] = useState<CustomTrack[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshTracks = useCallback(async () => {
    try {
      const list = await CustomAudioStorage.getAllTracks();
      setTracks(list);
    } catch {
      setTracks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    CustomAudioStorage.getAllTracks()
      .then((list) => {
        if (active) {
          setTracks(list);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setTracks([]);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Process files with boundary checks
  const handleFiles = async (files: FileList | File[]) => {
    setUploadError(null);
    const audioFiles = Array.from(files).filter(
      (f) =>
        f.type.startsWith('audio/') ||
        /\.(mp3|wav|ogg|flac|m4a|aac|weba)$/i.test(f.name)
    );

    if (audioFiles.length === 0) {
      setUploadError('Please select valid audio files (.mp3, .wav, .ogg, .flac, .m4a, .aac).');
      return;
    }

    if (audioFiles.length > AUDIO_LIMITS.MAX_BATCH_FILES) {
      setUploadError(`Batch limit exceeded: You can upload at most ${AUDIO_LIMITS.MAX_BATCH_FILES} tracks at once.`);
      return;
    }

    if (tracks.length + audioFiles.length > AUDIO_LIMITS.MAX_TOTAL_TRACKS) {
      setUploadError(`Library limit reached: You can store at most ${AUDIO_LIMITS.MAX_TOTAL_TRACKS} custom tracks.`);
      return;
    }

    for (const f of audioFiles) {
      if (f.size > AUDIO_LIMITS.MAX_FILE_BYTES) {
        setUploadError(`"${f.name}" is too large (${(f.size / (1024 * 1024)).toFixed(1)}MB). Max file size is 25MB.`);
        return;
      }
    }

    const currentTotalBytes = tracks.reduce((sum, t) => sum + (t.fileSize || 0), 0);
    const incomingBytes = audioFiles.reduce((sum, f) => sum + f.size, 0);
    if (currentTotalBytes + incomingBytes > AUDIO_LIMITS.MAX_LIBRARY_BYTES) {
      setUploadError('Library quota exceeded: Total stored tracks cannot exceed 150MB.');
      return;
    }

    setIsUploading(true);
    sounds.playClick();

    try {
      for (const file of audioFiles) {
        await CustomAudioStorage.saveTrack(file);
      }
      await refreshTracks();
      sounds.playSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error saving audio files to IndexedDB.';
      setUploadError(msg);
      console.error('Error saving audio files to IndexedDB:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Drag & drop handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Delete track
  const handleDelete = async (track: CustomTrack) => {
    sounds.playClick();
    if (activeCustomTrackId === track.id) {
      onStopTrack();
    }
    await CustomAudioStorage.deleteTrack(track.id);
    await refreshTracks();
  };

  // Start editing title
  const startEdit = (track: CustomTrack) => {
    sounds.playClick();
    setEditingId(track.id);
    setEditTitle(track.title);
  };

  // Save edited title
  const saveEdit = async (id: string) => {
    sounds.playClick();
    if (editTitle.trim()) {
      await CustomAudioStorage.updateTrackTitle(id, editTitle.trim());
      await refreshTracks();
    }
    setEditingId(null);
  };

  const filteredTracks = tracks.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-3 bg-[#FB7185] border-2 border-black font-bold text-xs text-black flex items-center justify-between shadow-[3px_3px_0px_#000] animate-in fade-in">
          <span>⚠️ {uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="p-1 hover:bg-black/10 cursor-pointer"
            title="Dismiss error"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-3 border-dashed border-black dark:border-stone-600 p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 select-none',
          isDragging
            ? 'bg-[#86EFAC]/40 border-emerald-600 scale-[1.01]'
            : 'bg-stone-50 dark:bg-[#181822] hover:bg-stone-100 dark:hover:bg-[#1F1F2B]'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />

        <div className="w-12 h-12 bg-[#FACC15] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000]">
          {isUploading ? (
            <RefreshCw className="w-6 h-6 text-black animate-spin stroke-[2.5]" />
          ) : (
            <Upload className="w-6 h-6 text-black stroke-[2.5]" />
          )}
        </div>

        <div>
          <h4 className="text-sm sm:text-base font-black uppercase tracking-tight text-black dark:text-white">
            {isUploading ? 'Importing Audio to Local Storage...' : 'Upload Offline Songs & Audio Files'}
          </h4>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-medium mt-1">
            Drag &amp; drop your MP3, WAV, FLAC, M4A, or OGG tracks here, or click to browse.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center text-[10px] font-mono font-bold text-stone-500 dark:text-stone-400">
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3 stroke-[2.5]" /> 100% Stored in Local IndexedDB
          </span>
          <span>•</span>
          <span>Max 25MB/file</span>
          <span>•</span>
          <span>Up to 30 tracks (150MB total)</span>
        </div>
      </div>

      {/* Playlist Controls & Track Count */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-black dark:border-stone-700 pb-3">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-purple-600 dark:text-purple-400 stroke-[2.5]" />
          <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
            Your Offline Library ({tracks.length})
          </span>
        </div>

        {tracks.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filter custom songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-[#20202A] text-black dark:text-white text-xs font-bold font-mono border-2 border-black dark:border-stone-700 px-3 py-1.5 shadow-[2px_2px_0px_#000] outline-none w-full sm:w-48"
            />
          </div>
        )}
      </div>

      {/* Tracks Grid / List */}
      {isLoading ? (
        <div className="p-8 text-center font-mono text-xs text-stone-500 font-bold">
          Loading offline tracks...
        </div>
      ) : tracks.length === 0 ? (
        <div className="p-8 text-center bg-stone-50 dark:bg-[#181822] border-2 border-black dark:border-stone-700 shadow-[3px_3px_0px_#000] flex flex-col items-center gap-2">
          <FileAudio className="w-8 h-8 text-stone-400 stroke-[1.5]" />
          <p className="text-xs font-bold text-stone-600 dark:text-stone-300">
            No custom songs uploaded yet.
          </p>
          <span className="text-[11px] text-stone-500 dark:text-stone-400">
            Upload your favorite study playlists, instrumental tracks, or custom ambient recordings above.
          </span>
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="p-6 text-center font-mono text-xs text-stone-500">
          No songs match &quot;{searchQuery}&quot;
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTracks.map((track) => {
            const isThisTrackActive = activeCustomTrackId === track.id;
            const isThisPlaying = isThisTrackActive && isPlaying;
            const isEditing = editingId === track.id;

            return (
              <div
                key={track.id}
                className={cn(
                  'p-3.5 border-2 border-black dark:border-stone-700 transition-all flex flex-col gap-2 shadow-[3px_3px_0px_#000]',
                  isThisTrackActive
                    ? 'bg-[#E879F9] text-black -translate-y-0.5 shadow-[4px_4px_0px_#000] ring-2 ring-black font-semibold'
                    : 'bg-white dark:bg-[#1E1E28] text-black dark:text-white hover:bg-stone-50 dark:hover:bg-stone-800'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        if (isThisPlaying) {
                          onStopTrack();
                        } else {
                          onPlayTrack(track);
                        }
                      }}
                      className={cn(
                        'w-8 h-8 border-2 border-black flex items-center justify-center shrink-0 cursor-pointer shadow-[2px_2px_0px_#000] transition-transform active:translate-y-0.5',
                        isThisPlaying
                          ? 'bg-black text-[#E879F9]'
                          : 'bg-[#FACC15] text-black hover:bg-amber-400'
                      )}
                      title={isThisPlaying ? 'Pause song' : 'Play song'}
                    >
                      {isThisPlaying ? (
                        <Pause className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <Play className="w-4 h-4 stroke-[2.5] fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(track.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                            className="text-xs font-black bg-white text-black px-2 py-0.5 border border-black outline-none w-full"
                          />
                          <button
                            type="button"
                            onClick={() => saveEdit(track.id)}
                            className="p-1 bg-black text-white cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1 bg-stone-300 text-black cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs truncate select-all">
                            {track.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => startEdit(track)}
                            className="opacity-60 hover:opacity-100 p-0.5 cursor-pointer text-stone-700 dark:text-stone-300"
                            title="Rename track"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}

                      <div className="text-[10px] font-mono text-stone-600 dark:text-stone-300 truncate">
                        {track.fileName}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(track)}
                    className="p-1 text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer shrink-0 transition-colors"
                    title="Delete track from local storage"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                  </button>
                </div>

                {/* Bottom Metadata & Status */}
                <div className="flex items-center justify-between text-[10px] font-mono font-bold pt-1 border-t border-black/20 dark:border-stone-700">
                  <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
                    <span>⏱ {CustomAudioStorage.formatDuration(track.duration)}</span>
                    <span>•</span>
                    <span>💾 {CustomAudioStorage.formatBytes(track.fileSize)}</span>
                  </div>

                  {isThisPlaying && (
                    <div className="flex items-center gap-1 text-black font-black uppercase text-[9px]">
                      <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                      <span>Playing Offline</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
