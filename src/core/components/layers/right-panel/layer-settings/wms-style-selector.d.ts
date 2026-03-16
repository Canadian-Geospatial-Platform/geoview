import type { TypeLegendLayer } from '@/core/components/layers/types';
interface WmsStyleSelectorProps {
    layerDetails: TypeLegendLayer;
    anchorEl: HTMLElement | null;
    onClose: () => void;
    onClickOutside: (event: {}, reason?: 'backdropClick' | 'escapeKeyDown') => void;
}
export declare function WmsStyleSelector(props: WmsStyleSelectorProps): JSX.Element;
export {};
//# sourceMappingURL=wms-style-selector.d.ts.map