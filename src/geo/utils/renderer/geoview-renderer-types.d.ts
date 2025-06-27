import { TypeFillStyle } from '@/api/config/types/map-schema-types';
export declare const defaultColor: string[];
export type FillPaternLine = {
    moveTo: [number, number];
    lineTo: [number, number];
};
export type FillPaternSettings = Record<TypeFillStyle, FillPaternLine[] | []>;
export declare enum NodeType {
    unprocessedNode = 0,
    keyword = 1,
    variable = 2,
    string = 3,
    number = 4,
    unary = 5,
    binary = 6,
    group = 7
}
export type FilterNodeType = {
    nodeType: NodeType;
    nodeValue: null | string | number | boolean | string[] | number[];
};
export declare const binaryKeywors: string[];
export declare const unaryKeywords: string[];
export declare const groupKeywords: string[];
export declare const operatorPriority: {
    key: string;
    priority: number;
}[];
//# sourceMappingURL=geoview-renderer-types.d.ts.map