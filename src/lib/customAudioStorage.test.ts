import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { CustomAudioStorage } from './customAudioStorage';

describe('Offline Custom Audio Storage (IndexedDB / Memory fallback)', () => {
  beforeEach(async () => {
    await CustomAudioStorage.clearAll();
  });

  it('formats byte sizes correctly', () => {
    assert.equal(CustomAudioStorage.formatBytes(0), '0 B');
    assert.equal(CustomAudioStorage.formatBytes(1024), '1 KB');
    assert.equal(CustomAudioStorage.formatBytes(1024 * 1024 * 5.5), '5.5 MB');
  });

  it('formats audio durations accurately', () => {
    assert.equal(CustomAudioStorage.formatDuration(0), '0:00');
    assert.equal(CustomAudioStorage.formatDuration(45), '0:45');
    assert.equal(CustomAudioStorage.formatDuration(75), '1:15');
    assert.equal(CustomAudioStorage.formatDuration(360), '6:00');
  });

  it('saves and retrieves custom tracks', async () => {
    // Create mock File/Blob
    const mockBlob = new Blob(['mock audio binary content'], { type: 'audio/mpeg' });
    const mockFile = new File([mockBlob], 'lofi_study_beat.mp3', { type: 'audio/mpeg' });

    const track = await CustomAudioStorage.saveTrack(mockFile, 'My Lo-Fi Study Beat');
    assert.ok(track.id.startsWith('track_'));
    assert.equal(track.title, 'My Lo-Fi Study Beat');
    assert.equal(track.fileName, 'lofi_study_beat.mp3');

    const allTracks = await CustomAudioStorage.getAllTracks();
    assert.equal(allTracks.length, 1);
    assert.equal(allTracks[0].title, 'My Lo-Fi Study Beat');
  });

  it('updates track titles and deletes tracks cleanly', async () => {
    const mockFile = new File([new Blob(['test'])], 'nature_forest.wav', { type: 'audio/wav' });
    const saved = await CustomAudioStorage.saveTrack(mockFile);

    await CustomAudioStorage.updateTrackTitle(saved.id, 'Pines & Birds Ambient');
    const updated = await CustomAudioStorage.getTrackById(saved.id);
    assert.equal(updated?.title, 'Pines & Birds Ambient');

    await CustomAudioStorage.deleteTrack(saved.id);
    const afterDelete = await CustomAudioStorage.getAllTracks();
    assert.equal(afterDelete.length, 0);
  });

  it('rejects files exceeding the 25MB size limit', async () => {
    // Create mock file with oversized fileSize property
    const oversizedFile = new File([new Blob(['small'])], 'huge_ambient.wav', { type: 'audio/wav' });
    Object.defineProperty(oversizedFile, 'size', { value: 26 * 1024 * 1024 });

    await assert.rejects(
      async () => {
        await CustomAudioStorage.saveTrack(oversizedFile);
      },
      /exceeds the maximum allowed file size of 25MB/
    );
  });
});
