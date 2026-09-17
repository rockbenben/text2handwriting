import { Component, type ErrorInfo, type ReactNode } from 'react';
import { i18next } from '../i18n';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * 顶层错误边界。
 *
 * 没有它的话，渲染期任何一个未捕获异常都会让 React 卸载整棵树 ——
 * 用户看到的是一张纯白页面，既没有提示也没有重试入口，只能靠猜。
 * 这个工具要处理用户导入的字体文件、底图、docx，输入面很宽，
 * 与其祈祷引擎层永不出错，不如保证出错时用户还知道发生了什么。
 *
 * 用 i18next.t 而不是 useTranslation：class 组件里用不了 hook，
 * 且崩溃可能发生在 i18n 初始化完成之前。t() 取不到键时会原样返回键名，
 * 至少不会是空白。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // 保留完整堆栈，方便用户从控制台复制出来提 issue
    console.error('未捕获的渲染错误:', error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    // 必须自己兜底，不能只靠 defaultValue：
    //   - i18n 尚未初始化时，i18next.t() 返回的是「空串」而不是键名
    //   - 已初始化但缺键时，返回的是键名本身
    // 两种都会让错误页要么一片空白、要么显示 "errors.crashTitle"，
    // 跟原来的白屏没本质区别。所以这里显式判空 + 判等。
    const t = (key: string, fallback: string) => {
      const value = i18next.t(key);
      return typeof value === 'string' && value.trim() !== '' && value !== key
        ? value
        : fallback;
    };

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '32px 24px',
          textAlign: 'center',
          background: 'var(--bg-main, #0f172a)',
          color: 'var(--text-main, #f8fafc)',
        }}
      >
        <h1 style={{ fontSize: '18px', fontWeight: 500, margin: 0 }}>
          {t('errors.crashTitle', 'Something went wrong')}
        </h1>

        <p
          style={{
            fontSize: '13px',
            lineHeight: 1.6,
            color: 'var(--text-muted, #94a3b8)',
            maxWidth: '480px',
            margin: 0,
          }}
        >
          {t(
            'errors.crashBody',
            'An unexpected error occurred while rendering. Your saved text and settings are intact — reload to continue.',
          )}
        </p>

        {/* 把原始错误摊开给用户看：报 issue 时这一行比「白屏了」有用得多 */}
        <pre
          style={{
            fontSize: '12px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            color: 'var(--text-subtle, #64748b)',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: '8px',
            padding: '12px 14px',
            maxWidth: '560px',
            width: '100%',
            overflow: 'auto',
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
          }}
        >
          {error.message || String(error)}
        </pre>

        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          {t('errors.crashReload', 'Reload')}
        </button>
      </div>
    );
  }
}
