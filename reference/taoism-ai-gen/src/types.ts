export interface Chapter {
  id: number;
  title: string;
  content: string;
}

export interface SubSection {
  id: string;
  title: string;
  startChapter: number;
  endChapter: number;
  description: string;
}

export interface MainSection {
  id: string;
  title: string;
  startChapter: number;
  endChapter: number;
  description: string;
  subSections: SubSection[];
}
