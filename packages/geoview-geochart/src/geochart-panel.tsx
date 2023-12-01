import { TypeWindow } from 'geoview-core';
import { ChartType, SchemaValidator } from 'geochart';
import { CloseButton, EnlargeButton, LayerList, LayerTitle, ResponsiveGrid, LayerListEntry } from 'geoview-core/src/core/components/common';
import { getSxClasses } from './geochart-style';
import { GeoChart } from './geochart';
import { PluginGeoChartConfig } from './geochart-types';

interface GeoChartPanelProps {
  mapId: string;
  configObj: PluginGeoChartConfig<ChartType>;
  layerList: LayerListEntry[];
}

const { cgpv } = window as TypeWindow;

/**
 * Time slider tab
 *
 * @param {TypeTimeSliderProps} props The properties passed to slider
 * @returns {JSX.Element} the time slider tab
 */
export function GeoChartPanel(props: GeoChartPanelProps): JSX.Element {
  const { mapId, configObj, layerList } = props;
  const { react, ui, useTranslation } = cgpv;
  const { useCallback, useState } = react;
  const { Box, Typography } = ui.elements;
  const { useTheme } = ui;
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // First layer is initially selected
  const [selectedLayerData, setSelectedLayerData] = useState<LayerListEntry>(layerList[0] ?? null);
  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
  const [isEnlargeDataTable, setIsEnlargeDataTable] = useState(false);

  /**
   * Handles clicks to layers in left panel. Sets selected layer.
   *
   * @param {LayerListEntry} layer The data of the selected layer
   */
  const handleLayerChange = (layer: LayerListEntry): void => {
    setSelectedLayerData(layer);
    setIsLayersPanelVisible(true);
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
        selectedLayerIndex={layerList.findIndex(({ layerPath }) => layerPath === selectedLayerData?.layerPath)}
        handleListItemClick={(layer) => {
          handleLayerChange(layer);
        }}
        layerList={layerList}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerList, selectedLayerData, isEnlargeDataTable]);

  return (
    <Box sx={sxClasses.detailsContainer}>
      {!layerList.length && (
        <ResponsiveGrid.Root>
          <ResponsiveGrid.Left isLayersPanelVisible={isLayersPanelVisible} isEnlargeDataTable={isEnlargeDataTable}>
            <Typography component="p">{t('geoChart.noChartAvailable')}</Typography>
          </ResponsiveGrid.Left>
        </ResponsiveGrid.Root>
      )}
      {!!layerList.length && (
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
                <LayerTitle hideTitle>{selectedLayerData?.layerName ?? layerList[0].layerName}</LayerTitle>
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
