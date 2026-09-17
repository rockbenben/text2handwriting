import { describe, it, expect } from 'vitest';
import { HANDWRITING_PERSONAS, applyPersonaToHandwriting } from '../presets';
import type { HandwritingConfig } from '../types';

describe('Stage 2: Handwriting Style Personas (笔风人格速配)', () => {
  const baseConfig: HandwritingConfig = {
    fontFamily: 'CustomUserFont',
    fontSize: 42,
    fontSizeVariance: 0,
    lineHeight: 60,
    lineHeightVariance: 0,
    letterSpacing: 5,
    letterSpacingVariance: 0,
    rotationVariance: 0,
    xVariance: 0,
    yVariance: 0,
    strokeWidthVariance: 0,
    opacityVariance: 0,
    lineTiltVariance: 0,
    inkColor: '#1d4ed8',
    paragraphIndent: 2,
    alignToLines: true,
    seed: 9999,
  };

  it('should have 4 distinct personas with meaningful parameters', () => {
    expect(HANDWRITING_PERSONAS.length).toBe(4);
    const ids = HANDWRITING_PERSONAS.map(p => p.id);
    expect(ids).toContain('disciplined');
    expect(ids).toContain('casual_notes');
    expect(ids).toContain('hurried_rush');
    expect(ids).toContain('standard_homework');
  });

  it('applying a persona preserves user font family, font size, ink color, and seed', () => {
    const persona = HANDWRITING_PERSONAS.find(p => p.id === 'hurried_rush')!;
    const updated = applyPersonaToHandwriting(baseConfig, persona);

    // Preserved user customizations
    expect(updated.fontFamily).toBe('CustomUserFont');
    expect(updated.fontSize).toBe(42);
    expect(updated.lineHeight).toBe(60);
    expect(updated.inkColor).toBe('#1d4ed8');
    expect(updated.seed).toBe(9999);

    // Applied persona perturbations
    expect(updated.rotationVariance).toBe(persona.config.rotationVariance);
    expect(updated.xVariance).toBe(persona.config.xVariance);
    expect(updated.edgeCrowding).toBe(persona.config.edgeCrowding);
  });

  it('disciplined persona has tighter tolerances than hurried_rush', () => {
    const disciplined = HANDWRITING_PERSONAS.find(p => p.id === 'disciplined')!;
    const hurried = HANDWRITING_PERSONAS.find(p => p.id === 'hurried_rush')!;

    expect(disciplined.config.rotationVariance!).toBeLessThan(hurried.config.rotationVariance!);
    expect(disciplined.config.xVariance!).toBeLessThan(hurried.config.xVariance!);
    expect(disciplined.config.glyphVariance!).toBeLessThan(hurried.config.glyphVariance!);
  });
});
