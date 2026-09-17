import { describe, it, expect } from 'vitest';
import { PRESET_TEMPLATES } from '../presets';

describe('Preset templates', () => {
  it('defines all required preset templates with valid configs', () => {
    expect(PRESET_TEMPLATES.length).toBeGreaterThanOrEqual(5);

    for (const preset of PRESET_TEMPLATES) {
      expect(preset.id).toBeTruthy();
      expect(preset.name).toBeTruthy();
      expect(preset.sampleText.length).toBeGreaterThan(20);
      expect(preset.paper.width).toBeGreaterThan(0);
      expect(preset.paper.height).toBeGreaterThan(0);
      expect(preset.handwriting.fontSize).toBeGreaterThan(10);
      expect(preset.handwriting.seed).toBeGreaterThan(0);
    }
  });

  it('contains specific popular templates', () => {
    const ids = PRESET_TEMPLATES.map(p => p.id);
    expect(ids).toContain('notes');
    expect(ids).toContain('reflection');
    expect(ids).toContain('composition');
    expect(ids).toContain('english_notebook');
    expect(ids).toContain('vintage_letter');
    expect(ids).toContain('photo_realism');
  });
});
