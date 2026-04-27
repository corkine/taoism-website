import { laozi } from "./laozi";
import { LAOZI_DEFAULT_PARTITIONS, ZHUANGZI_DEFAULT_PARTITIONS } from "./init";
import { zhuangzi, yinfujing } from "./zhuangzi";
import { liezi } from "./liezi";

export const BOOKS = [
    {
        id: 'laozi',
        title: '老子',
        content: laozi,
        defaultPartitions: LAOZI_DEFAULT_PARTITIONS,
    },
    {
        id: 'zhuangzi',
        title: '庄子',
        content: zhuangzi,
        defaultPartitions: ZHUANGZI_DEFAULT_PARTITIONS,
    },
    {
        id: 'liezi',
        title: '列子',
        content: liezi,
        defaultPartitions: [],
    },
    {
        id: 'yinfujing',
        title: '阴符经',
        content: yinfujing,
        defaultPartitions: [],
    }
];

export const INTERPRETATION_KEY = 'interpretation';
export const PARTITIONS_KEY = 'partitions';

export const TRANS_NOTE = '本应用使用的《老子》原文主要参考自王弼本，并结合帛书本、竹简本等进行了部分校勘；《庄子》原文主要参考自郭象本，二者均经过了重新校对与标点整理。';
export const COPY_NOTE = `本应用内置的《${BOOKS.map(b => b.title).join('》、《')}》等先秦典籍原文属于公有领域。本应用本身的界面设计、交互逻辑及提供的工具代码受版权保护。`;