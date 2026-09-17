import { describe, it, expect } from 'vitest';
import { BRAND_FONTS, BUILTIN_FONTS } from '../fontLoader';

describe('Brand Fonts & Modern Mainstream Typography', () => {
  it('contains HarmonyOS Sans font option with valid fallbacks', () => {
    const harmony = BRAND_FONTS.find(f => f.id === 'harmonyos');
    expect(harmony).toBeDefined();
    expect(harmony?.family).toContain('HarmonyOS Sans');
    expect(harmony?.category).toBe('system');
  });

  it('contains MiSans font option with valid fallbacks', () => {
    const misans = BRAND_FONTS.find(f => f.id === 'misans');
    expect(misans).toBeDefined();
    expect(misans?.family).toContain('MiSans');
    expect(misans?.category).toBe('system');
  });

  it('contains Alibaba PuHuiTi and Alimama Calligraphy fonts', () => {
    const puhuiti = BRAND_FONTS.find(f => f.id === 'alibaba_puhuiti');
    expect(puhuiti).toBeDefined();
    expect(puhuiti?.family).toContain('Alibaba PuHuiTi');

    const dongfangdakai = BRAND_FONTS.find(f => f.id === 'alimama_dakai');
    expect(dongfangdakai).toBeDefined();
    expect(dongfangdakai?.family).toContain('DongFangDaKai');
  });

  it('includes brand fonts in the master BUILTIN_FONTS list', () => {
    const ids = BUILTIN_FONTS.map(f => f.id);
    expect(ids).toContain('harmonyos');
    expect(ids).toContain('misans');
    expect(ids).toContain('alibaba_puhuiti');
    expect(ids).toContain('alimama_dakai');
    expect(ids).toContain('opposans');
  });
});
