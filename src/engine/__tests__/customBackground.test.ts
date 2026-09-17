import { describe, it, expect } from 'vitest';
import { calculatePaperDimensionsFromImage, HD_PAPER_PRESETS } from '../paper';

describe('Custom Background & HD Realistic Paper Textures', () => {
  it('calculates optimal paper dimensions from image natural aspect ratio', () => {
    // 16:9 vertical smartphone photo (1080 x 1920)
    const dim1 = calculatePaperDimensionsFromImage(1080, 1920, 1200);
    expect(dim1.width).toBe(1200);
    expect(dim1.height).toBe(Math.round(1200 * (1920 / 1080)));
    expect(dim1.aspectRatio).toBeCloseTo(1080 / 1920, 2);

    // Standard A4 paper photo (~1:1.414)
    const dim2 = calculatePaperDimensionsFromImage(2480, 3508, 1200);
    expect(dim2.width).toBe(1200);
    expect(dim2.height).toBe(Math.round(1200 * (3508 / 2480)));

    // Landscape photo (1920 x 1080)
    const dim3 = calculatePaperDimensionsFromImage(1920, 1080, 1400);
    expect(dim3.width).toBe(1400);
    expect(dim3.height).toBe(Math.round(1400 * (1080 / 1920)));
  });

  it('provides curated HD realistic paper background presets', () => {
    expect(HD_PAPER_PRESETS.length).toBeGreaterThanOrEqual(4);
    for (const preset of HD_PAPER_PRESETS) {
      expect(preset.id).toBeDefined();
      expect(preset.name).toBeDefined();
      expect(preset.category).toBeDefined();
      expect(typeof preset.createBackground).toBe('function');
    }
  });

  it('generates non-empty data URLs for HD paper texture presets', () => {
    for (const preset of HD_PAPER_PRESETS) {
      const dataUrl = preset.createBackground(800, 1130);
      expect(dataUrl).toMatch(/^data:image\/(png|jpeg|webp)/);
    }
  });
});
