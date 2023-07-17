/// <reference types="react" />
interface Features {
    attributes: {
        [key: string]: string;
    };
    geometry: {
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
    fields: {
        alias: string;
        type: string;
        name: string;
    }[];
    geometryType: string;
    spatialReference: {
        latestWkid: number;
        wkid: number;
    };
}
interface DataTableProps {
    data: DataTableData;
}
declare function DataTable({ data }: DataTableProps): import("react").JSX.Element;
export default DataTable;
