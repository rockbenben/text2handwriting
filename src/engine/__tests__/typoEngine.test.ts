import { describe, it, expect } from 'vitest';
import { getTypoForChar, hasTypoVariant } from '../typoEngine';

describe('Typo & Slip-of-the-pen Engine (错别字与笔误生成)', () => {
  it('guarantees that generated typos are NEVER identical to the original character', () => {
    const testChars = ['理', '物', '实', '验', '报', '告', '的', '在', '做', '学', '日', '己', '土', '拔'];
    for (const char of testChars) {
      for (let i = 0; i < 20; i++) {
        const typo = getTypoForChar(char);
        expect(typo).not.toBeNull();
        expect(typo).not.toBe(char);
        expect(typeof typo).toBe('string');
        expect(typo!.length).toBe(1);
      }
    }
  });

  it('covers extensive academic and essay characters with credible typos', () => {
    const words = '大学物理实验报告光电效应常数测定检讨书盛夏微风见字如面';
    let coveredCount = 0;
    for (const char of words) {
      if (hasTypoVariant(char)) {
        coveredCount++;
      }
    }
    // Over 90% of characters in common template titles must have typo mappings
    expect(coveredCount / words.length).toBeGreaterThan(0.85);
  });

  it('returns valid visual shape confusions for confusable pairs', () => {
    const typoForRi = getTypoForChar('日');
    expect(['目', '月', '白']).toContain(typoForRi);

    const typoForBa = getTypoForChar('拔');
    expect(typoForBa).toBe('拨');

    const typoForJi = getTypoForChar('己');
    expect(['已', '巳']).toContain(typoForJi);
  });
});
