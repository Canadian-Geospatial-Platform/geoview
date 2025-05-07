import { ChangeEvent, useState } from 'react';
import { Stac } from './stac-browser/Stac';
import { StacCallbackInputType } from './stac-browser/Types';
import { Box } from '@/ui';
import { useCesiumStoreActions } from '@/core/stores/store-interface-and-intial-values/cesium-state';

export interface addCatalogObj {
  uid: string;
  title: string;
  url: string;
  type: string;
}

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

  function addStacItemToMap(stacItemProj: StacCallbackInputType): void {
    addCog(stacItemProj.asset.href, stacItemProj.feature.properties['proj:epsg'] as number);
    zoomToExtent(undefined, stacItemProj.feature.bbox as [number, number, number, number]);
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

  function changeFunc(e: ChangeEvent<HTMLInputElement>): void {
    setSelectedCatalog({
      uid: e.target.value,
      title: e.target.value,
      url: e.target.value,
      type: 'STAC',
    });
  }

  const stacUrlInputStyle = { height: '100%', width: '25rem', marginRight: '0.5rem' };
  const stacConfirmButtonStyle = {
    '--tw-bg-opacity': 1,
    backgroundColor: 'rgb(83 90 164 / var(--tw-bg-opacity, 1))',
    borderRadius: '0.25rem',
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    fontFamily: 'Open Sans',
    fontWeight: '600',
    fontSize: '16px',
    '--tw-text-opacity': '1',
    color: 'rgb(255 255 255 / var(--tw-text-opacity, 1))',
  };
  const stacSelector: JSX.Element = (
    <Box id="catalogSelectorDiv" style={{ display: 'flex' }}>
      <Box id="catalogSelectorSelectDiv">
        <input
          style={stacUrlInputStyle}
          name="stacUrlInput"
          placeholder="https://datacube.services.geo.ca/stac/api"
          onChange={changeFunc}
        />
      </Box>
      <Box id="catalogSelectorButtonsDiv">
        <button
          style={stacConfirmButtonStyle}
          type="button"
          id="catalogViewButton"
          onClick={() => {
            setIsCatalogSelected(true);
          }}
        >
          View Catalog
        </button>
      </Box>
    </Box>
  );

  return isCatalogSelected ? stacBrowser : stacSelector;
}
