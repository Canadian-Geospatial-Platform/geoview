import type { TypeFillStyle } from '@/api/types/map-schema-types';
/** Default color palette used when generating layer styles without explicit color assignments. */
export declare const defaultColor: string[];
/** Represents a single line segment in a fill pattern, defined by a start and end point. */
export type FillPatternLine = {
    moveTo: [number, number];
    lineTo: [number, number];
};
/** Maps each fill style to its corresponding array of fill pattern line segments. */
export type FillPatternSettings = Record<TypeFillStyle, FillPatternLine[] | []>;
/** Node types used in the filter expression parser. */
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
/** Represents a single node in the parsed filter expression tree. */
export type FilterNodeType = {
    nodeType: NodeType;
    nodeValue: null | string | number | boolean | string[] | number[];
};
/** Binary operator keywords recognized by the filter expression parser. */
export declare const binaryKeywords: string[];
/** Unary operator keywords recognized by the filter expression parser. */
export declare const unaryKeywords: string[];
/** Grouping keywords recognized by the filter expression parser. */
export declare const groupKeywords: string[];
/** Operator precedence table for the filter expression parser (higher priority binds tighter). */
export declare const operatorPriority: {
    key: string;
    priority: number;
}[];
//# sourceMappingURL=geoview-renderer-types.d.ts.map