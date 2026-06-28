import { Chapter, MainSection } from '../types';

export interface ChapterGroup {
  label: string;
  isMain: boolean;
  chapters: Chapter[];
}

export interface SectionBlock {
  section: MainSection;
  groups: ChapterGroup[];
}

/** Group chapters by the imported main/sub-section structure. */
export function buildSectionBlocks(
  mainSections: MainSection[],
  chapters: Chapter[],
): { blocks: SectionBlock[]; ungrouped: Chapter[] } {
  const covered = new Set<number>();
  const blocks: SectionBlock[] = [];

  for (const section of mainSections) {
    const sectionChapters = chapters.filter(
      chapter => chapter.id >= section.startChapter && chapter.id <= section.endChapter,
    );
    const groups: ChapterGroup[] = [];

    if (section.subSections.length > 0) {
      const subCovered = new Set<number>();
      for (const subSection of section.subSections) {
        const subChapters = sectionChapters.filter(
          chapter => chapter.id >= subSection.startChapter && chapter.id <= subSection.endChapter,
        );
        if (subChapters.length > 0) {
          groups.push({ label: subSection.title, isMain: false, chapters: subChapters });
          subChapters.forEach(chapter => subCovered.add(chapter.id));
        }
      }

      const remainder = sectionChapters.filter(chapter => !subCovered.has(chapter.id));
      if (remainder.length > 0) {
        groups.push({ label: section.title, isMain: true, chapters: remainder });
      }
      groups.sort((a, b) => a.chapters[0].id - b.chapters[0].id);
    } else if (sectionChapters.length > 0) {
      groups.push({ label: section.title, isMain: true, chapters: sectionChapters });
    }

    sectionChapters.forEach(chapter => covered.add(chapter.id));
    if (groups.length > 0) blocks.push({ section, groups });
  }

  return {
    blocks,
    ungrouped: chapters.filter(chapter => !covered.has(chapter.id)),
  };
}
