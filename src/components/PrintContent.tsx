import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BOOKS } from '../data/book';
import { usePartitions, useInterpretations } from '../store/useAppStore';
import { MainSection, Chapter } from '../types';

interface PrintContentProps {
  bookId: string;
}

interface ChapterGroup {
  label: string;
  isMain: boolean;
  chapters: Chapter[];
}

interface SectionBlock {
  section: MainSection;
  groups: ChapterGroup[];
}

/**
 * Build grouped chapter lists based on the partition structure.
 *
 * Algorithm:
 * 1. For each MainSection, collect chapters that fall in its range.
 *    - If it has subSections, chapters are distributed into those sub-ranges first.
 *    - Chapters in the main range but not in any sub-section go into a "parent" group.
 * 2. Chapters not covered by any MainSection go into an "未分篇" fallback.
 */
function buildSectionBlocks(
  mainSections: MainSection[],
  chapters: Chapter[],
): { blocks: SectionBlock[]; ungrouped: Chapter[] } {
  const covered = new Set<number>();
  const blocks: SectionBlock[] = [];

  for (const section of mainSections) {
    const sectionChapters = chapters.filter(
      c => c.id >= section.startChapter && c.id <= section.endChapter,
    );

    const groups: ChapterGroup[] = [];

    if (section.subSections.length > 0) {
      const subCovered = new Set<number>();

      for (const sub of section.subSections) {
        const subChapters = sectionChapters.filter(
          c => c.id >= sub.startChapter && c.id <= sub.endChapter,
        );
        if (subChapters.length > 0) {
          groups.push({ label: sub.title, isMain: false, chapters: subChapters });
          subChapters.forEach(c => subCovered.add(c.id));
        }
      }

      // Chapters in main range but not in any sub-section
      const remainder = sectionChapters.filter(c => !subCovered.has(c.id));
      if (remainder.length > 0) {
        groups.push({ label: section.title, isMain: true, chapters: remainder });
      }
    } else {
      // No sub-sections: all chapters go directly under the main section
      if (sectionChapters.length > 0) {
        groups.push({ label: section.title, isMain: true, chapters: sectionChapters });
      }
    }

    sectionChapters.forEach(c => covered.add(c.id));

    if (groups.length > 0) {
      blocks.push({ section, groups });
    }
  }

  const ungrouped = chapters.filter(c => !covered.has(c.id));
  return { blocks, ungrouped };
}

function ChapterBlock({
  chapter,
  interpretation,
  prefixLabel,
}: { chapter: Chapter; interpretation?: string; prefixLabel?: string; key?: React.Key }) {
  return (
    <div className="print-chapter">
      <h3 className="print-chapter-title">
        {prefixLabel && <span className="print-chapter-prefix">{prefixLabel} </span>}
        {chapter.title}
      </h3>
      <p className="print-chapter-content">{chapter.content}</p>
      <div className="print-interpretation">
        <h4 className="print-interpretation-label">释义</h4>
        <p className="print-interpretation-text">
          {interpretation?.trim() || '（暂无释义）'}
        </p>
      </div>
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

export const PrintContent = React.memo(function PrintContent({ bookId }: PrintContentProps) {
  const bookConfig = BOOKS.find(b => b.id === bookId);
  const mainSections = usePartitions(bookId);
  const interpretations = useInterpretations(bookId);

  const { blocks, ungrouped } = useMemo(
    () => {
      if (!bookConfig) return { blocks: [], ungrouped: [] };
      return buildSectionBlocks(mainSections, bookConfig.content);
    },
    [bookConfig, mainSections],
  );

  if (!bookConfig) return null;

  return createPortal(
    <div id="print-content">
      {/* Book title page */}
      <div className="print-book-title">
        <h1>{bookConfig.title}</h1>
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
            />
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
});
