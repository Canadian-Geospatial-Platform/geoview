import { TypeJsonObject } from '@/api/config/types/config-types';
export type TypeWorkerExportChunk = {
    geometry: TypeJsonObject;
    properties: {
        [k: string]: unknown;
    };
};
export type TypeWorkerExportProjectionInfo = {
    sourceCRS: string;
    targetCRS: string;
};
declare const _default: typeof Worker & {
    new (): Worker;
};
export default _default;
