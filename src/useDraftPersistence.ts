import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { saveStoredSettings, type LoadedSettings, type StoredSettings } from './engine/storage';

/**
 * 自动保存与跨标签页草稿持久化 Hook。
 *
 * 核心设计考量：
 * 1. 防抖（250ms）：避免击键高频触发 JSON.stringify 与 localStorage 读写。
 * 2. 差异对比（Diffing）：只写入发生变更的键（text, paper, handwriting 等），减少 I/O 开销。
 * 3. 并发安全（Web Locks API）：多标签页同时打开时，加锁防止相互覆盖。
 *    写入前校验基线文本（expectedText），检测到外部标签已更新时上报 'conflict'。
 * 4. 页面离开安全：
 *    - visibilitychange（切后台/最小化）：立即同步未落盘变更。
 *    - beforeunload（关闭页面）：检测到未保存文本时同步持久化并触发浏览器离开确认。
 *
 * @param settings 当前编辑器中的最新设置快照
 * @param initialStoredText 页面加载时从存储读取的初始基线正文
 * @returns 持久化状态：'conflict'（多标签冲突）、'failed'（配额或存储异常）、null（正常）
 */
export function useDraftPersistence(settings: LoadedSettings, initialStoredText: string | null) {
  const latest = useRef(settings);
  const saved = useRef(settings);
  const storedText = useRef(initialStoredText);
  const saving = useRef(false);
  const [status, setStatus] = useState<'conflict' | 'failed' | null>(null);

  const persist = useCallback(() => {
    const current = latest.current;
    const previous = saved.current;
    const changes: StoredSettings = {};
    if (current.text !== previous.text) changes.text = current.text;
    if (current.paper !== previous.paper) changes.paper = current.paper;
    if (current.handwriting !== previous.handwriting) changes.handwriting = current.handwriting;
    if (current.exportScale !== previous.exportScale) changes.exportScale = current.exportScale;
    if (current.activePresetId !== previous.activePresetId) changes.activePresetId = current.activePresetId;

    if (!Object.keys(changes).length) {
      setStatus(null);
      return;
    }
    const result = saveStoredSettings(changes, storedText.current);
    saved.current = { ...previous, ...result.saved };
    if (result.saved.text !== undefined) storedText.current = result.saved.text;
    const failed = Object.keys(result.saved).length !== Object.keys(changes).length;
    setStatus(result.textConflict ? 'conflict' : failed ? 'failed' : null);
  }, []);

  const flush = useCallback(() => {
    if (saving.current) return;
    if (!navigator.locks) {
      persist();
      return;
    }
    // 跨标签页并发锁：读取比较与写入必须在同一个锁临界区内完成
    saving.current = true;
    void navigator.locks.request('text2handwriting-draft', persist)
      .catch(() => setStatus('failed'))
      .finally(() => { saving.current = false; });
  }, [persist]);

  useLayoutEffect(() => {
    latest.current = settings;
    const timer = window.setTimeout(flush, 250);
    return () => window.clearTimeout(timer);
  }, [settings, flush]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!navigator.locks) persist();
      if (latest.current.text !== saved.current.text) {
        // 卸载事件无法等待异步锁，触发同步刷新并弹出浏览器防误关确认框
        flush();
        event.preventDefault();
        event.returnValue = true;
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [flush, persist]);

  return status;
}
