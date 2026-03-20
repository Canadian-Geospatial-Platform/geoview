import type { TypeLegendLayer } from '@/core/components/layers/types';
interface RasterFunctionPanelProps {
    layerDetails: TypeLegendLayer;
}
/**
 * Inline panel section for selecting raster functions.
 *
 * Replaces the previous Menu-based approach with cards displayed
 * directly within the settings panel.
 *
 * @param layerDetails - The legend layer to configure raster functions for.
 * @returns A JSX element representing the RasterFunctionPanel component.
 */
export declare function RasterFunctionPanel({ layerDetails }: RasterFunctionPanelProps): JSX.Element;
export {};
//# sourceMappingURL=raster-function-selector.d.ts.map