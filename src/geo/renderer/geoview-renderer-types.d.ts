import { TypeFillStyle } from '../map/map-schema-types';
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
    null = 5,
    unary = 6,
    binary = 7,
    group = 8
}
export type FilterNodeType = {
    nodeType: NodeType;
    nodeValue: string | number | boolean | string[] | number[];
};
export type FilterNodeArrayType = FilterNodeType[];
export declare const binaryKeywors: string[];
export declare const unaryKeywords: string[];
export declare const groupKeywords: string[];
export declare const operatorPriority: {
    key: string;
    priority: number;
}[];
