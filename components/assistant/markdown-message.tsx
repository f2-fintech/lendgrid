'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

interface MarkdownMessageProps {
  content: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words text-sm leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Strict link security: internal paths use Next Link; external only https with noopener noreferrer
          a: ({ href, children, ...props }) => {
            if (!href) return <span>{children}</span>;

            // Internal relative paths
            if (href.startsWith('/')) {
              return (
                <Link
                  href={href}
                  className="font-medium text-blue-500 hover:text-blue-600 underline underline-offset-2 transition-colors"
                  {...props}
                >
                  {children}
                </Link>
              );
            }

            // Only allow secure https links
            if (href.startsWith('https://')) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-500 hover:text-blue-600 underline underline-offset-2 transition-colors"
                  {...props}
                >
                  {children}
                </a>
              );
            }

            // Disallow javascript:, mailto:, data:, or insecure protocols
            return <span className="text-muted-foreground">{children}</span>;
          },

          // Clean table styling
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50 border-b border-border font-semibold text-foreground">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-xs font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-xs border-t border-border/50">{children}</td>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="my-2 ml-4 list-disc space-y-1 text-foreground/90">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 ml-4 list-decimal space-y-1 text-foreground/90">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,

          // Strong emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-blue-500/50 pl-3 italic text-muted-foreground">
              {children}
            </blockquote>
          ),

          // Inline code & code blocks
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                  {children}
                </code>
              );
            }
            return (
              <pre className="my-2 overflow-x-auto rounded bg-muted/80 p-3 font-mono text-xs text-foreground">
                <code>{children}</code>
              </pre>
            );
          },

          // Paragraphs
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

