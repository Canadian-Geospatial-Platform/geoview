/** Properties for the raster function settings panel. */
interface RasterFunctionPanelProps {
    /** The layer path to configure raster functions for. */
    layerPath: string;
}
/**
 * Creates the inline raster function settings panel.
 *
 * Replaces the previous Menu-based approach with cards displayed
 * directly within the settings panel.
 *
 * @param props - Properties defined in RasterFunctionPanelProps interface
 * @returns The raster function settings panel
 */
export declare function RasterFunctionPanel({ layerPath }: RasterFunctionPanelProps): JSX.Element;
export {};
//# sourceMappingURL=raster-function-selector.d.ts.map