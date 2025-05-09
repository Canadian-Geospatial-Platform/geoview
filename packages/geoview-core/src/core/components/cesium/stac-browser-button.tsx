import { ChangeEvent, useState } from 'react';
import { Stac } from './stac-browser/Stac';
import { StacCallbackInputType } from './stac-browser/Types';
import { Box } from '@/ui';
import { useCesiumStoreActions } from '@/core/stores/store-interface-and-intial-values/cesium-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { Button } from '@/ui/button/button';

export interface addCatalogObj {
  uid: string;
  title: string;
  url: string;
  type: string;
}

/**
 * Button for opening the STAC Catalog
 * @returns STAC Selection Panel JSX.Element
 */
export function StacBrowserButton(): JSX.Element {
  const { addCog, zoomToExtent } = useCesiumStoreActions();

  const defaultCatalog = {
    uid: 'stac-fastapi',
    title: 'stac-fastapi',
    url: 'https://datacube.services.geo.ca/stac/api',
    type: 'STAC',
  };
  const [isCatalogSelected, setIsCatalogSelected] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<addCatalogObj>(defaultCatalog);
  const mapId = useGeoViewMapId();
  const viewer = MapEventProcessor.getMapViewer(mapId);

  /**
   * Callback function that gets called when the 'Add To Map' button is clicked on a COG in the STAC Catalog.
   * @param stacItemProj A object containing the Asset and Feature of the clicked STAC Item.
   */
  function addStacItemToMap(stacItemProj: StacCallbackInputType): void {
    addCog(stacItemProj.asset.href, stacItemProj.feature.properties['proj:epsg'] as number);
    zoomToExtent(undefined, stacItemProj.feature.bbox as [number, number, number, number]);
    viewer.notifications.addNotificationSuccess(`${stacItemProj.asset.title} added to 3D map.`);
  }

  const bbox = useState('');
  const intersects = useState('');
  const datetime = useState('');
  const selectCallback = addStacItemToMap;

  const stacBrowser: JSX.Element = (
    <Box>
      <Stac
        url={selectedCatalog.url}
        bboxSignal={bbox}
        intersectsSignal={intersects}
        datetimeStartSignal={datetime}
        datetimeEndSignal={datetime}
        selectCallback={selectCallback}
      />
    </Box>
  );

  /**
   * Sets the SelectedCatalog state when the text input changes.
   * @param e ChangeEvent
   */
  function changeFunc(e: ChangeEvent<HTMLInputElement>): void {
    setSelectedCatalog({
      uid: e.target.value,
      title: e.target.value,
      url: e.target.value,
      type: 'STAC',
    });
  }

  const stacUrlInputStyle = { height: '100%', width: '25rem', marginRight: '0.5rem' };
  const stacSelector: JSX.Element = (
    <Box id="catalogSelectorDiv" style={{ display: 'flex' }}>
      <Box id="catalogSelectorSelectDiv">
        <input style={stacUrlInputStyle} name="stacUrlInput" placeholder={defaultCatalog.url} onChange={changeFunc} />
      </Box>
      <Box id="catalogSelectorButtonsDiv">
        <Button
          className="buttonOutlineFilled"
          onClick={() => {
            setIsCatalogSelected(true);
          }}
          type="text"
          variant="contained"
        >
          View Catalog
        </Button>
      </Box>
    </Box>
  );

  return isCatalogSelected ? stacBrowser : stacSelector;
}
