import { TypeGeoviewLayerConfig, TypeLayerEntryConfig, TypeLayerEntryType, TypeLayerStyleConfig, TypeVectorSourceFormats } from '@/api/config/types/map-schema-types';
import { TimeDimension } from '@/core/utils/date-mgt';
export declare abstract class LayerMockup {
    #private;
    static getTop100Feature(): TypeGeoviewLayerConfig;
    static getTop100Dynamic(): TypeGeoviewLayerConfig;
    static getFeaturesInGroupLayer(): TypeGeoviewLayerConfig;
    static configNonMetalMines(layerId: string, metadata: unknown, source: unknown, style: unknown): TypeLayerEntryConfig;
    static configTop100Metadata(): unknown;
    static configTop100Source(format: TypeVectorSourceFormats | undefined): unknown;
    static configTop100Style(): TypeLayerStyleConfig;
    static configNonMetalMetadata(): unknown;
    static configNonMetalSource(): unknown;
    static configNonMetalStyle(): unknown;
    static configAirborneMetadata(): unknown;
    static configPolygonsMetadata(): unknown;
    static configLinesMetadata(): unknown;
    static configIconPointsMetadata(): unknown;
    static configPointsMetadata(): unknown;
    static configPoints1Metadata(): unknown;
    static configPoints2Metadata(): unknown;
    static configPoints3Metadata(): unknown;
    static configCESIMetadata(): unknown;
    static configTemporalTestBedMetadata(): unknown;
    static configHistoricalFloodMetadata(): unknown;
    static configHistoricalFloodTemporalDimension(): TimeDimension;
    static configRadarMetadata(): unknown;
    static configRadarTemporalDimension(): TimeDimension;
    static configMSIMetadata(): unknown;
    static configMSITemporalDimension(): TimeDimension;
    static configLayerEntry(layerId: string, layerName: string, entryType: TypeLayerEntryType, metadata: unknown, source: unknown, style: unknown): TypeLayerEntryConfig;
}
//# sourceMappingURL=layer-mockup.d.ts.map