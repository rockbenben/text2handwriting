import { useEffect, useMemo, useState } from 'react';

/**
 * 包装图片异步加载为 Promise。
 * 设置 crossOrigin = 'anonymous'，避免外部/跨域 URL 导致 Canvas 导出时被污染 (tainted canvas)。
 */
function createBackgroundLoader(url: string) {
  let load: Promise<HTMLImageElement> | undefined;
  return () => {
    load ??= new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Could not load paper background'));
      image.src = url;
    });
    return load;
  };
}

/**
 * 自定义纸张背景底图加载 Hook。
 *
 * 管理底图异步加载生命周期与多状态同步：
 * 1. 缓存加载 Promise，避免同一 URL 在导出与预览中重复解码。
 * 2. 竞态保护：用户频繁更换底图时，通过 active 标志位避免已过期的旧请求覆盖新底图。
 * 3. 分离实时预览（loaded.image）与按需导出（load() 函数）。
 *
 * @param url 自定义底图的 URL（Blob URL、Data URL 或远程链接）
 */
export function usePaperBackground(url?: string) {
  const load = useMemo(() => url ? createBackgroundLoader(url) : null, [url]);
  const [loaded, setLoaded] = useState<{
    load: NonNullable<typeof load>;
    image: HTMLImageElement;
  } | null>(null);

  if (loaded && loaded.load !== load) setLoaded(null);

  useEffect(() => {
    if (!load) return;
    let active = true;
    void load().then(
      image => { if (active) setLoaded({ load, image }); },
      () => { if (active) setLoaded(null); },
    );
    return () => { active = false; };
  }, [load]);

  // 已发起的旧加载任务仍可完成并供导出快照使用，但只有当前有效 URL 的 loader 才能提供给实时预览
  return { load, image: loaded && loaded.load === load ? loaded.image : null };
}
