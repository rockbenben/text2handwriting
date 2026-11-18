import { describe, expect, it } from 'vitest';
import { parseDocumentFile } from '../docParser';

describe('plain text import', () => {
  it('preserves the first-line indent and trailing whitespace in UTF-8 TXT', async () => {
    const text = '\t  第一行\r\n第二行  \r\n';
    expect(await parseDocumentFile(new File([text], 'notes.txt'))).toBe(text);
  });

  it('preserves full-width indentation when falling back to GB18030', async () => {
    const bytes = new Uint8Array([0xa1, 0xa1, 0xa1, 0xa1, 0xc4, 0xe3, 0xba, 0xc3, 0x0a]);
    expect(await parseDocumentFile(new File([bytes], 'notes.txt'))).toBe('　　你好\n');
  });
});
