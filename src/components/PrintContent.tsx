import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MainSection, Chapter } from '../types';
import { buildSectionBlocks, SectionBlock } from '../utils/sectionGrouping';

interface PrintContentProps {
  bookTitle: string;
  referenceName: string;
  chapters: Chapter[];
  partitions: MainSection[];
  interpretations: Record<number, string>;
  showInterpretations?: boolean;
}

function ChapterBlock({
  chapter,
  interpretation,
  prefixLabel,
  showInterpretation,
}: { chapter: Chapter; interpretation?: string; prefixLabel?: string; showInterpretation: boolean; key?: React.Key }) {
  return (
    <div className="print-chapter">
      <h3 className="print-chapter-title">
        {prefixLabel && <span className="print-chapter-prefix">{prefixLabel} </span>}
        {chapter.title}
      </h3>
      <p className="print-chapter-content">{chapter.content}</p>
      {showInterpretation && (
        <div className="print-interpretation">
          <h4 className="print-interpretation-label">释义</h4>
          <p className="print-interpretation-text">
            {interpretation?.trim() || '（暂无释义）'}
          </p>
        </div>
      )}
    </div>
  );
}

function TableOfContents({ blocks }: { blocks: SectionBlock[] }) {
  return (
    <div className="print-toc">
      <h2 className="print-toc-title">目  录</h2>
      {blocks.map(({ section, groups }) => (
        <div key={section.id} className="print-toc-section">
          <div className="print-toc-main">
            <span className="print-toc-label">{section.title}</span>
            <span className="print-toc-dots" />
            <span className="print-toc-range">
              第 {section.startChapter}–{section.endChapter} 章
            </span>
          </div>
          {groups.filter(g => !g.isMain).map((group, i) => (
            <div key={i} className="print-toc-sub">
              <span className="print-toc-label">{group.label}</span>
              <span className="print-toc-dots" />
              <span className="print-toc-range">
                第 {group.chapters[0].id}–{group.chapters[group.chapters.length - 1].id} 章
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export const PrintContent = React.memo(function PrintContent({
  bookTitle,
  referenceName,
  chapters,
  partitions,
  interpretations,
  showInterpretations = true,
}: PrintContentProps) {
  const { blocks, ungrouped } = useMemo(
    () => buildSectionBlocks(partitions, chapters),
    [partitions, chapters],
  );

  return createPortal(
    <div id="print-content">
      {/* Book title page */}
      <div className="print-book-title">
        <h1>{bookTitle}</h1>
        <p>{referenceName}</p>
      </div>

      {/* Table of contents */}
      <TableOfContents blocks={blocks} />

      {/* Chapters — no section/subsection headers, prefix label on each chapter */}
      {blocks.map(({ section, groups }) => (
        <div key={section.id} className="print-section">
          {groups.map(group =>
            group.chapters.map(chapter => (
              <ChapterBlock
                key={chapter.id}
                chapter={chapter}
                interpretation={interpretations[chapter.id]}
                prefixLabel={group.label}
                showInterpretation={showInterpretations}
              />
            ))
          )}
        </div>
      ))}

      {/* Ungrouped chapters */}
      {ungrouped.length > 0 && (
        <div className="print-section">
          {ungrouped.map(chapter => (
            <ChapterBlock
              key={chapter.id}
              chapter={chapter}
              interpretation={interpretations[chapter.id]}
              prefixLabel="未分篇"
              showInterpretation={showInterpretations}
            />
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
});
