import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveStoredSettings, loadStoredSettings, clearStoredSettings } from '../storage';
import { getPaperDimensions } from '../paper';
import { getPdfPageFormat } from '../exporter';

describe('Code Review Round 1: Verification Tests for Confirmed Bugs', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] !== undefined ? mockStorage[key] : null),
      setItem: vi.fn((key: string, val: string) => {
        mockStorage[key] = String(val);
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    });
    clearStoredSettings();
  });

  it('Bug 1: saveStoredSettings should not wipe exportScale or activePresetId when called with partial settings', () => {
    // 1. Initial full save with exportScale: 3 and activePresetId: 'reflection'
    saveStoredSettings({
      exportScale: 3,
      activePresetId: 'reflection',
    });

    let loaded = loadStoredSettings();
    expect(loaded.exportScale).toBe(3);
    expect(loaded.activePresetId).toBe('reflection');

    // 2. User edits text only (partial save)
    saveStoredSettings({
      text: '仅更新文本内容',
    });

    // 3. Reload settings: exportScale and activePresetId must NOT be wiped back to 2 / notes!
    loaded = loadStoredSettings();
    expect(loaded.text).toBe('仅更新文本内容');
    expect(loaded.exportScale).toBe(3);
    expect(loaded.activePresetId).toBe('reflection');
  });

  it('Bug 2: getPaperDimensions should provide distinct dimensions for B5 and A5', () => {
    const a4 = getPaperDimensions('a4');
    const b5 = getPaperDimensions('b5');
    const a5 = getPaperDimensions('a5');

    expect(a4.width).toBe(1200);
    expect(a4.height).toBe(1697);

    expect(b5.width).toBe(1050);
    expect(b5.height).toBe(1485);

    expect(a5.width).toBe(848);
    expect(a5.height).toBe(1200);
  });

  it('Bug 4: getPdfPageFormat should return correct aspect ratio and landscape dimensions for custom papers', () => {
    // Landscape paper (e.g. 1600 x 900)
    const format = getPdfPageFormat('custom', 1600, 900);
    expect(format.format).toBe('custom');
    expect(format.widthMm).toBe(210);
    // ratio = 900 / 1600 = 0.5625 -> heightMm = 210 * 0.5625 = 118mm
    expect(format.heightMm).toBe(118);
  });
});
