import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SOUND_TRACKS } from './audio';

describe('Offline Procedural Audio Engine & Focus Soundscapes', () => {
  it('contains all 3 required sections: enhancers, nature, instrumental', () => {
    const categories = new Set(SOUND_TRACKS.map((t) => t.category));
    assert.ok(categories.has('enhancers'), 'Must include enhancers section');
    assert.ok(categories.has('nature'), 'Must include nature section');
    assert.ok(categories.has('instrumental'), 'Must include instrumental section');
  });

  it('Section 1 contains scientifically proven focus enhancers', () => {
    const enhancers = SOUND_TRACKS.filter((t) => t.category === 'enhancers');
    const ids = enhancers.map((t) => t.id);
    assert.ok(ids.includes('gamma'), 'Should include 40Hz Gamma waves');
    assert.ok(ids.includes('alpha'), 'Should include 10Hz Alpha waves');
    assert.ok(ids.includes('beta'), 'Should include 14Hz Beta waves');
    assert.ok(ids.includes('brown'), 'Should include Brown noise');
    assert.ok(ids.includes('pink'), 'Should include Pink noise');
    assert.ok(ids.includes('white'), 'Should include White noise');
    assert.ok(enhancers.length >= 6);
  });

  it('Section 2 contains biophilic nature sounds including rain and ocean', () => {
    const nature = SOUND_TRACKS.filter((t) => t.category === 'nature');
    const ids = nature.map((t) => t.id);
    assert.ok(ids.includes('rain'), 'Should include rain');
    assert.ok(ids.includes('ocean'), 'Should include ocean');
    assert.ok(ids.includes('campfire'), 'Should include campfire');
    assert.ok(ids.includes('wind'), 'Should include wind');
    assert.ok(ids.includes('stream'), 'Should include stream');
    assert.ok(nature.length >= 5);
  });

  it('Section 3 contains generative offline instrumental soundscapes', () => {
    const instrumentals = SOUND_TRACKS.filter((t) => t.category === 'instrumental');
    const ids = instrumentals.map((t) => t.id);
    assert.ok(ids.includes('lofi'), 'Should include lofi chords');
    assert.ok(ids.includes('bowls'), 'Should include tibetan singing bowls');
    assert.ok(ids.includes('piano'), 'Should include ethereal piano/harp');
    assert.ok(ids.includes('analog_pad'), 'Should include analog pad');
    assert.ok(ids.includes('cello_drone'), 'Should include cello drone');
    assert.ok(instrumentals.length >= 5);
  });

  it('All sound definitions provide valid scientific benefit, badge, and description', () => {
    SOUND_TRACKS.forEach((track) => {
      assert.ok(track.id.length > 0);
      assert.ok(track.label.length > 0);
      assert.ok(track.science.length > 0);
      assert.ok(track.desc.length > 0);
      assert.ok(track.badge.length > 0);
      assert.ok(track.icon.length > 0);
    });
  });
});
