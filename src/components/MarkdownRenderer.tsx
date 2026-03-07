import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-slate-800 mb-4 mt-6 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-slate-700 mb-3 mt-5 first:mt-0 pb-2 border-b border-slate-200">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium text-slate-700 mb-2 mt-4">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-slate-600 mb-3 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-3 space-y-1 text-slate-600 ml-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-3 space-y-1 text-slate-600 ml-4">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-slate-600">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-800">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-700">{children}</em>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-slate-100 text-sky-700 px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-slate-900 text-slate-100 p-4 rounded-lg text-sm font-mono overflow-x-auto mb-3">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto mb-3">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-sky-400 pl-4 py-2 my-3 bg-sky-50/50 rounded-r-lg italic text-slate-600">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border-collapse border border-slate-300 rounded-lg">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-slate-300 px-4 py-2 bg-slate-100 font-semibold text-left">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-slate-300 px-4 py-2">{children}</td>
          ),
          hr: () => (
            <hr className="my-6 border-slate-200" />
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-sky-600 hover:text-sky-700 underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
