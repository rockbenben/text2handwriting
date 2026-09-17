import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ErrorBoundary } from '../ErrorBoundary';

/**
 * 这里刻意不走 renderToString(<ErrorBoundary><Boom /></ErrorBoundary>)：
 * 服务端渲染器会把边界捕获到的错误直接抛出来，只有客户端/流式渲染才会让
 * 边界接管。项目目前没有 DOM 测试环境（未装 jsdom），所以改为直接驱动组件
 * 的状态机 —— 传入「state 里已有错误」，检查它渲染出的兜底 HTML。
 * 这样验的是真实输出，不是「代码里有没有这段字符串」。
 */
describe('ErrorBoundary', () => {
  it('getDerivedStateFromError 把抛出的错误装进 state', () => {
    const err = new Error('boom-from-test');
    expect(ErrorBoundary.getDerivedStateFromError(err)).toEqual({ error: err });
  });

  it('无错误时原样渲染子节点', () => {
    const boundary = new ErrorBoundary({ children: <span>normal-content</span> });
    expect(renderToStaticMarkup(boundary.render())).toContain('normal-content');
  });

  it('state 里带错误时渲染兜底 UI，而不是空白', () => {
    const boundary = new ErrorBoundary({ children: <span>normal-content</span> });
    boundary.state = { error: new Error('boom-from-test') };

    const html = renderToStaticMarkup(boundary.render());

    // 核心：不是空串（那正是原来的白屏行为），而是有内容的错误页
    expect(html).not.toBe('');
    expect(html).not.toContain('normal-content');
    // 原始错误信息要露出来，方便用户提 issue 时复制
    expect(html).toContain('boom-from-test');
    // 有重试入口
    expect(html).toContain('<button');
  });

  it('i18n 尚未就绪时用 defaultValue 兜底，不显示原始键名', () => {
    const boundary = new ErrorBoundary({ children: null });
    boundary.state = { error: new Error('x') };

    const html = renderToStaticMarkup(boundary.render());

    expect(html).toContain('Something went wrong');
    expect(html).not.toContain('errors.crashTitle');
  });
});
