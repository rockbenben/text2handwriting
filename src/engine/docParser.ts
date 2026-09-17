/** 明确支持导入的文档扩展名。用于拖拽区与文件选择器共用同一份校验。 */
export const SUPPORTED_DOC_EXTENSIONS = ['docx', 'txt', 'md'] as const;

export type SupportedDocExtension = (typeof SUPPORTED_DOC_EXTENSIONS)[number];

/** 取小写扩展名，无扩展名时返回空串 */
function getExtension(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() ?? '';
}

/** 拖拽时无法靠 accept 属性限制文件类型，上传前统一走这个校验 */
export function isSupportedDocFile(file: File): boolean {
  return (SUPPORTED_DOC_EXTENSIONS as readonly string[]).includes(getExtension(file));
}

/**
 * Extracts plain text from an uploaded file (.docx, .txt, .md)
 */
export async function parseDocumentFile(file: File): Promise<string> {
  const ext = getExtension(file);

  if (ext === 'docx') {
    // mammoth (~190KB) 只在真的导入 .docx 时才需要，静态 import 会白白占首屏
    const { default: mammoth } = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  }

  if (ext !== 'txt' && ext !== 'md') {
    // 直接 throw，避免把二进制文件 (老式 .doc / 图片 / 压缩包) 当纯文本读进来。
    // 旧实现用 readAsText 读任意文件都能"成功"，产物是乱码，并且会整篇覆盖已输入内容。
    throw new Error(`不支持的文件类型: ${file.name}`);
  }

  // .txt/.md：先用严格模式解码 UTF-8，失败则按 GB18030 兜底。
  // Windows 上大量 .txt 是 GBK 编码，直接按 UTF-8 解码会得到大量替换字符，
  // 且旧实现不报错，整篇被乱码覆盖且无法恢复。
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).trim();
  } catch {
    const gb18030 = new TextDecoder('gb18030').decode(bytes);
    return gb18030.trim();
  }
}
