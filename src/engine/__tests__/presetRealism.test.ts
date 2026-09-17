import { describe, it, expect } from 'vitest';
import { PRESET_TEMPLATES } from '../presets';
import { DEFAULT_HANDWRITING_CONFIG } from '../storage';
import { typesetText } from '../typeset';

describe('Stage 1: Presets & Defaults Realism Upgrade', () => {
  it('DEFAULT_HANDWRITING_CONFIG should have realistic non-zero scratchOutProbability out of the box', () => {
    expect(DEFAULT_HANDWRITING_CONFIG.scratchOutProbability).toBeGreaterThanOrEqual(0.005);
    expect(DEFAULT_HANDWRITING_CONFIG.scratchOutProbability).toBeLessThanOrEqual(0.02);
    expect(DEFAULT_HANDWRITING_CONFIG.scratchOutShowCorrection).toBe(true);
    expect(DEFAULT_HANDWRITING_CONFIG.scratchOutCorrectionPosition).toBe('top_right');
    expect(DEFAULT_HANDWRITING_CONFIG.scratchOutSmartAvoidance).toBe(true);
    expect(DEFAULT_HANDWRITING_CONFIG.smartSignatureAlign).toBe(true);
  });

  it('PRESET_TEMPLATES should include realistic sample texts with signatures and dates', () => {
    const reflectionPreset = PRESET_TEMPLATES.find((p) => p.id === 'reflection');
    expect(reflectionPreset).toBeDefined();
    expect(reflectionPreset?.sampleText).toMatch(/(检讨人|保证人|学生)：/);
    expect(reflectionPreset?.sampleText).toMatch(/\d{4}年\d{1,2}月\d{1,2}日/);

    const notesPreset = PRESET_TEMPLATES.find((p) => p.id === 'notes');
    expect(notesPreset).toBeDefined();
    expect(notesPreset?.sampleText).toMatch(/\d{4}年\d{1,2}月\d{1,2}日/);
  });

  it('Default sample text typeset should demonstrate right-aligned signature when enabled', () => {
    const preset = PRESET_TEMPLATES[0];
    const result = typesetText(preset.sampleText, preset.paper, {
      ...DEFAULT_HANDWRITING_CONFIG,
      ...preset.handwriting,
      smartSignatureAlign: true,
    });

    expect(result.pages.length).toBeGreaterThan(0);
    // Finds characters from the date or signature line
    const dateChars = result.pages[0].chars.filter((c) => c.char === '日' || c.char === '年');
    expect(dateChars.length).toBeGreaterThan(0);
    // At least one date character should be positioned towards the right side of the paper
    const maxDateX = Math.max(...dateChars.map((c) => c.x));
    expect(maxDateX).toBeGreaterThan(preset.paper.width * 0.5);
  });
});
