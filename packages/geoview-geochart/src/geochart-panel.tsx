import { TypeWindow } from 'geoview-core';
import { ChartType, SchemaValidator } from 'geochart';
import { CloseButton, EnlargeButton, LayerList, LayerTitle, ResponsiveGrid } from 'geoview-core/src/core/components/common';
import { TypeArrayOfLayerData, TypeLayerData } from 'geoview-core/src/api/events/payloads';
import { useDetailsStoreLayerDataArray } from 'geoview-core/src/core/stores/store-interface-and-intial-values/details-state';
import { getSxClasses } from './geochart-style';
import { GeoChart } from './geochart';
import { PluginGeoChartConfig } from './geochart-types';

interface GeoChartPanelProps {
  mapId: string;
  configObj: PluginGeoChartConfig<ChartType>;
}

const { cgpv } = window as TypeWindow;

/**
 * Time slider tab
 *
 * @param {TypeTimeSliderProps} props The properties passed to slider
 * @returns {JSX.Element} the time slider tab
 */
export function GeoChartPanel(props: GeoChartPanelProps): JSX.Element {
  const { mapId, configObj } = props;
  const { react, ui, useTranslation } = cgpv;
  const { useCallback, useState } = react;
  const { Box, Typography } = ui.elements;
  const { useTheme } = ui;
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const storeLayerDataArray: TypeArrayOfLayerData = useDetailsStoreLayerDataArray();

  // First layer is initially selected
  const [selectedLayerData, setSelectedLayerData] = useState<TypeLayerData>(storeLayerDataArray[0]);
  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
  const [isEnlargeDataTable, setIsEnlargeDataTable] = useState(false);

  /**
   * Handles clicks to layers in left panel. Sets selected layer.
   *
   * @param {LayerListEntry} layer The data of the selected layer
   */
  const handleLayerChange = (layer: TypeLayerData): void => {
    setSelectedLayerData(layer);
    setIsLayersPanelVisible(true);
  };

  /**
   * Get number of features of a layer.
   * @returns string
   */
  const getFeaturesOfLayer = (layer: TypeLayerData): string => {
    const numOfFeatures = layer.features?.length ?? 0;
    return `${numOfFeatures} ${t('details.feature')}${numOfFeatures > 1 ? 's' : ''}`;
  };

  /**
   * Render group layers as list.
   *
   * @returns JSX.Element
   */
  const renderLayerList = useCallback(() => {
    return (
      <LayerList
        isEnlargeDataTable={isEnlargeDataTable}
        selectedLayerIndex={storeLayerDataArray.findIndex(({ layerPath }) => layerPath === selectedLayerData?.layerPath)}
        handleListItemClick={(layer) => {
          handleLayerChange(layer as TypeLayerData);
        }}
        layerList={storeLayerDataArray.map((layer) => ({
          layerName: layer.layerName,
          layerPath: layer.layerPath,
          tooltip: layer.layerName as string,
          layerFeatures: getFeaturesOfLayer(layer),
        }))}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeLayerDataArray, selectedLayerData, isEnlargeDataTable]);

  return (
    <Box sx={sxClasses.detailsContainer}>
      {!storeLayerDataArray.length && (
        <ResponsiveGrid.Root>
          <ResponsiveGrid.Left isLayersPanelVisible={isLayersPanelVisible} isEnlargeDataTable={isEnlargeDataTable}>
            <Typography component="p">{t('details.selectVisbleLayer')}</Typography>
          </ResponsiveGrid.Left>
        </ResponsiveGrid.Root>
      )}
      {!!storeLayerDataArray.length && (
        <>
          <ResponsiveGrid.Root>
            <ResponsiveGrid.Left isLayersPanelVisible={isLayersPanelVisible} isEnlargeDataTable={isEnlargeDataTable}>
              <LayerTitle>{t('general.layers')}</LayerTitle>
            </ResponsiveGrid.Left>
            <ResponsiveGrid.Right isLayersPanelVisible={isLayersPanelVisible} isEnlargeDataTable={isEnlargeDataTable}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  [theme.breakpoints.up('md')]: { justifyContent: 'right' },
                  [theme.breakpoints.down('md')]: { justifyContent: 'space-between' },
                }}
              >
                <LayerTitle hideTitle>{selectedLayerData?.layerName ?? storeLayerDataArray[0].layerName}</LayerTitle>
                <Box>
                  <EnlargeButton isEnlargeDataTable={isEnlargeDataTable} setIsEnlargeDataTable={setIsEnlargeDataTable} />
                  <CloseButton isLayersPanelVisible={isLayersPanelVisible} setIsLayersPanelVisible={setIsLayersPanelVisible} />
                </Box>
              </Box>
            </ResponsiveGrid.Right>
          </ResponsiveGrid.Root>
          <ResponsiveGrid.Root>
            <ResponsiveGrid.Left isLayersPanelVisible={isLayersPanelVisible} isEnlargeDataTable={isEnlargeDataTable}>
              {renderLayerList()}
            </ResponsiveGrid.Left>
            <ResponsiveGrid.Right isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible}>
              <GeoChart mapId={mapId} config={configObj} schemaValidator={new SchemaValidator()} />
            </ResponsiveGrid.Right>
          </ResponsiveGrid.Root>
        </>
      )}
    </Box>
  );
}
