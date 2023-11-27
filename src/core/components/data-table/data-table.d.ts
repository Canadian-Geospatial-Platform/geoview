/// <reference types="react" />
import { Extent } from 'ol/extent';
import Geometry from 'ol/geom/Geometry';
export interface Features {
    attributes: {
        [key: string]: string;
    };
    geometry?: {
        x: string;
        y: string;
    };
}
export interface DataTableData {
    displayFieldName: string;
    features: Features[];
    fieldAliases: {
        [key: string]: string;
    };
    fields?: {
        alias: string;
        type: string;
        name: string;
    }[];
    geometryType?: string;
    spatialReference?: {
        latestWkid: number;
        wkid: number;
    };
}
export interface ColumnsType {
    ICON: string;
    ZOOM: string;
    [key: string]: string;
}
interface DataTableProps {
    data: DataTableData;
}
export interface Rows {
    geometry: Geometry;
    extent?: Extent;
    featureKey?: string;
    featureIcon?: string;
    featureActions?: unknown;
}
declare function DataTable({ data }: DataTableProps): import("react").JSX.Element;
export default DataTable;
