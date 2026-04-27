import { MainSection } from "../types";

export const LAOZI_DEFAULT_PARTITIONS: MainSection[] = [
    {
        id: 'default-1',
        title: '玄妙之门',
        startChapter: 1,
        endChapter: 15,
        description: '',
        subSections: [
            { id: '1-1', title: '相生', startChapter: 1, endChapter: 3, description: '' },
            { id: '1-2', title: '道冲', startChapter: 4, endChapter: 6, description: '' },
            { id: '1-3', title: '无私', startChapter: 7, endChapter: 9, description: '' },
            { id: '1-4', title: '为用', startChapter: 10, endChapter: 12, description: '' },
            { id: '1-5', title: '玄通', startChapter: 13, endChapter: 15, description: '' },
        ]
    },
    {
        id: 'default-2',
        title: '致虚守静',
        startChapter: 16,
        endChapter: 24,
        description: '',
        subSections: [
            { id: '2-1', title: '贵言', startChapter: 16, endChapter: 18, description: '' },
            { id: '2-2', title: '绝学', startChapter: 19, endChapter: 21, description: '' },
            { id: '2-3', title: '抱一', startChapter: 22, endChapter: 24, description: '' },
        ]
    },
    {
        id: 'default-3',
        title: '道法自然',
        startChapter: 25,
        endChapter: 37,
        description: '',
        subSections: [
            { id: '3-1', title: '袭明', startChapter: 26, endChapter: 28, description: '' },
            { id: '3-2', title: '去甚', startChapter: 29, endChapter: 31, description: '' },
            { id: '3-3', title: '守朴', startChapter: 32, endChapter: 34, description: '' },
            { id: '3-4', title: '执象', startChapter: 35, endChapter: 37, description: '' },
        ]
    }
];

export const ZHUANGZI_DEFAULT_PARTITIONS: MainSection[] = [
    {
        id: 'default-z1',
        title: '内篇',
        startChapter: 1,
        endChapter: 7,
        description: '',
        subSections: []
    },
    {
        id: 'default-z2',
        title: '外篇',
        startChapter: 8,
        endChapter: 22,
        description: '',
        subSections: []
    },
    {
        id: 'default-z3',
        title: '杂篇',
        startChapter: 23,
        endChapter: 33,
        description: '',
        subSections: []
    }
];