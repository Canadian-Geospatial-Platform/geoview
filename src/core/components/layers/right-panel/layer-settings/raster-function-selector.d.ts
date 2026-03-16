import type { TypeLegendLayer } from '@/core/components/layers/types';
interface RasterFunctionSelectorProps {
    layerDetails: TypeLegendLayer;
    anchorEl: HTMLElement | null;
    onClose: () => void;
    onClickOutside: (event: {}, reason?: 'backdropClick' | 'escapeKeyDown') => void;
}
export declare function RasterFunctionSelector(props: RasterFunctionSelectorProps): JSX.Element;
export {};
//# sourceMappingURL=raster-function-selector.d.ts.map