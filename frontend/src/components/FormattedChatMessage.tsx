"use client";

import React from "react";

interface FormattedChatMessageProps {
  text: string;
  isUser?: boolean;
}

/**
 * Parses inline formatting like **bold**, `code`, ₹prices, and % percentages.
 */
export const renderInlineMarkdown = (text: string, isUser: boolean = false) => {
  if (!text) return null;

  // Tokenize bold, code, currency, percentage
  const tokenRegex = /(\*\*.*?\*\*|`.*?`|₹\s*[\d,]+(?:\.\d+)?|\b\d+(?:\.\d+)?%)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return (
        <strong
          key={idx}
          className={
            isUser
              ? "font-bold text-white underline decoration-white/30 decoration-1"
              : "font-bold text-slate-900"
          }
        >
          {inner}
        </strong>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={idx}
          className={
            isUser
              ? "bg-blue-700/80 text-blue-100 px-1.5 py-0.5 rounded font-mono text-[10px]"
              : "bg-indigo-50/80 text-indigo-700 px-1.5 py-0.5 rounded-md font-mono text-[11px] font-semibold border border-indigo-100"
          }
        >
          {inner}
        </code>
      );
    }

    // Currency highlight (e.g. ₹500.00)
    if (/^₹\s*[\d,]+(?:\.\d+)?$/.test(part)) {
      return (
        <span
          key={idx}
          className={
            isUser
              ? "font-extrabold text-white"
              : "font-bold text-emerald-700 tracking-tight"
          }
        >
          {part}
        </span>
      );
    }

    // Percentage highlight (e.g. 15%)
    if (/^\b\d+(?:\.\d+)?%$/.test(part)) {
      return (
        <span
          key={idx}
          className={
            isUser
              ? "font-bold text-white"
              : "font-bold text-indigo-600"
          }
        >
          {part}
        </span>
      );
    }

    return <span key={idx}>{part}</span>;
  });
};

export const FormattedChatMessage: React.FC<FormattedChatMessageProps> = ({
  text,
  isUser = false,
}) => {
  if (!text) return null;

  if (isUser) {
    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {renderInlineMarkdown(text, true)}
      </div>
    );
  }

  // Split lines into structured blocks
  const rawLines = text.split("\n");

  return (
    <div className="space-y-1.5 leading-relaxed text-xs">
      {rawLines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1" />;
        }

        // Heading lines: ### or ##
        if (trimmed.startsWith("### ") || trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
          const headingText = trimmed.replace(/^#+\s*/, "");
          return (
            <h4
              key={lineIdx}
              className="font-extrabold text-slate-900 text-[13px] pt-1.5 pb-0.5 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-3 bg-indigo-600 rounded-full inline-block" />
              {renderInlineMarkdown(headingText, false)}
            </h4>
          );
        }

        // Bullet point lines: • or - or *
        if (
          trimmed.startsWith("• ") ||
          trimmed.startsWith("- ") ||
          (trimmed.startsWith("* ") && !trimmed.startsWith("**"))
        ) {
          const bulletContent = trimmed.replace(/^(•|-|\*)\s+/, "");
          return (
            <div
              key={lineIdx}
              className="flex items-start gap-2 py-0.5 text-slate-700 pl-0.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                {renderInlineMarkdown(bulletContent, false)}
              </div>
            </div>
          );
        }

        // Numbered item list: e.g. 1. **Product Name** — ₹150.00
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
          const num = numberedMatch[1];
          const content = numberedMatch[2];
          return (
            <div
              key={lineIdx}
              className="flex items-start gap-2.5 py-1 px-2.5 bg-slate-50/80 hover:bg-slate-100/70 transition-colors rounded-xl border border-slate-200/60 my-1"
            >
              <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                {num}
              </span>
              <div className="flex-1 min-w-0 text-slate-800">
                {renderInlineMarkdown(content, false)}
              </div>
            </div>
          );
        }

        // Normal text line
        return (
          <p key={lineIdx} className="text-slate-800">
            {renderInlineMarkdown(trimmed, false)}
          </p>
        );
      })}
    </div>
  );
};
