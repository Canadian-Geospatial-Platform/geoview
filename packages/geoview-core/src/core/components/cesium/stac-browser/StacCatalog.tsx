import './StacCatalog.css';
import { Suspense, useState, useRef, useEffect } from 'react';
import { BrowseCollection } from './BrowseCollections';
import type { callbackType } from './StacContext';
import { useStacContext } from './StacContext';
import type { StacItem, StacLink, StacAssetObject, StacCallbackInputType, StacCollection } from './Types';
import { stacRootRequest } from './requests';
import {
  i18nAddItemIds,
  i18nAddToMap,
  i18nAddVertex,
  // i18nAssetHasInvalidFormat, This will be used to hook into notification system.
  i18nBack,
  i18nBoundingBox,
  i18nBoundingBoxPlaceholder,
  i18nClear,
  i18nCollections,
  i18nCreationDate,
  i18nCustom,
  i18nCustomGeoJsonString,
  i18nDateTime,
  i18nEndLabel,
  i18nErrorLoadingStac,
  i18nErrorSearchingStac,
  i18nFilters,
  i18nGettingStacCatalog,
  i18nId,
  i18nIntersectsLabel,
  i18nItemIds,
  i18nLatitude,
  i18nLimitResults,
  i18nLongitude,
  i18nNextPage,
  i18nNoAssetSelected,
  i18nNone,
  i18nNoThumbnail,
  i18nNotListed,
  i18nPoint,
  i18nPolygon,
  i18nPreviousPage,
  i18nResultsLimit,
  i18nResultsMatched,
  i18nResultsReturned,
  i18nSearch,
  i18nSearching,
  i18nSelectCollections,
  i18nStartLabel,
  i18nThumbnail,
} from './StacStrings';

interface StacSearchParams {
  collections?: string;
  ids?: string;
  limit?: number;
  bbox?: string;
  datetime?: string;
  intersects?: string;
}

interface StacSearchResult {
  type: string;
  features: StacItem[];
  links: StacLink[];
  context?: {
    returned?: number;
    limit?: number;
    matched?: number;
  };
}

interface CoordinatePair {
  lat: string;
  lon: string;
}

function isValidBboxString(bboxStr: string): boolean {
  const parts = bboxStr.split(',').map((part) => parseFloat(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }
  const [west, south, east, north] = parts;
  const conditions =
    west < -180 ||
    west > 180 ||
    east < -180 ||
    east > 180 ||
    south < -90 ||
    south > 90 ||
    north < -90 ||
    north > 90 ||
    west > east ||
    south > north;

  if (conditions) {
    return false;
  }
  return true;
}

function StacSearch(props: { url: string }): JSX.Element {
  const { url } = props;
  const baseUrl = `${url}/search`;
  const [searchUrl, setSearchUrl] = useState(baseUrl);
  const { collections, bbox, setBbox, intersects, setIntersects, datetimeStart, setDatetimeStart, datetimeEnd, setDatetimeEnd } =
    useStacContext();

  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string>('');
  const [limit, setLimit] = useState(1000);
  const [previous, setPrevious] = useState('');
  const [next, setNext] = useState('');
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [searchResults, setSearchResults] = useState<StacSearchResult | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error] = useState<Error | null>(null);

  setIntersects('');

  // "none" | "point" | "polygon"
  const [geometryType, setGeometryType] = useState('none');
  const [datetimeErrorClass] = useState('');
  const [bboxErrorClass, setBboxErrorClass] = useState('');
  async function stacSearchRequest(sUrl: string): Promise<void> {
    if (sUrl.trim() === '') {
      setSearching(false);
      return;
    }
    setSearching(true);
    const reqUrl = new URL(sUrl);
    const params: StacSearchParams = {
      collections: selectedCollections.join(','),
      limit,
    };
    if (selectedIds !== '') {
      params.ids = selectedIds;
    }
    if (bbox && geometryType === 'bbox') {
      if (!isValidBboxString(bbox)) {
        setBboxErrorClass('StacSearchErrorInput');
        return;
      }
      setBboxErrorClass('');
      params.bbox = bbox;
    }
    if (datetimeStart || datetimeEnd) {
      const dtStart = datetimeStart ? `${datetimeStart}T00:00:00Z` : '';
      const dtEnd = datetimeEnd ? `${datetimeEnd}T00:00:00Z` : '';
      params.datetime = `${dtStart}/${dtEnd}`;
    }
    const bodyParams: { intersects?: JSON } = {};
    let intersectsString;
    if (intersects) {
      intersectsString = intersects !== '' ? intersects : undefined;
      if (intersectsString !== undefined) {
        bodyParams.intersects = JSON.parse(intersectsString) as JSON;
      }
    }
    Object.entries(params).forEach(([key, value]: [string, string]) => {
      reqUrl.searchParams.append(key, value);
    });
    let resp;
    if (intersectsString != null && intersectsString.trim() !== '') {
      resp = await fetch(reqUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(bodyParams),
      });
    } else {
      resp = await fetch(reqUrl, {
        method: 'GET',
      });
    }

    const json = (await resp.json()) as StacSearchResult;
    const nextLink = json.links.find((link: StacLink) => link.rel === 'next');
    const previousLink = json.links.find((link: StacLink) => link.rel === 'previous');
    if (nextLink?.href) {
      setNext(nextLink.href);
    } else {
      setNext('');
    }
    if (previousLink?.href) {
      setPrevious(previousLink.href);
    } else {
      setPrevious('');
    }
    setLoading(false);
    setSearchResults(json);
  }

  async function getSearchResults(): Promise<void> {
    await stacSearchRequest(searchUrl);
  }

  async function pageNavRequest(sUrl: string): Promise<void> {
    setSearchUrl(sUrl);
    await stacSearchRequest(sUrl);
  }

  // Signals for a Point
  const [pointLat, setPointLat] = useState('');
  const [pointLon, setPointLon] = useState('');

  // Signals for a Polygon (array of lat/lon pairs)
  // Start with one row or keep empty—up to you
  const [polygonCoords, setPolygonCoords] = useState<CoordinatePair[]>([{ lat: '', lon: '' }]);

  const [customGeoJson, setCustomGeoJson] = useState<string>();

  // Add a new vertex to the polygon
  function addPolygonCoord(): void {
    setPolygonCoords([...polygonCoords, { lat: '', lon: '' }]);
  }

  // Update a specific vertex (index i) in the polygon coords array
  function updatePolygonCoord(index: number, field: 'lat' | 'lon', value: string): void {
    setPolygonCoords((coords) => {
      const updated = [...coords];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  // Handle "Save" button in the dialog
  function handleSave(): void {
    let geo = null;

    if (geometryType === 'point') {
      // Build a GeoJSON Point
      const latVal = parseFloat(pointLat);
      const lonVal = parseFloat(pointLon);
      if (!Number.isNaN(latVal) && !Number.isNaN(lonVal)) {
        geo = {
          type: 'Point',
          coordinates: [lonVal, latVal], // [lon, lat] per GeoJSON spec
        };
      }
    } else if (geometryType === 'polygon') {
      // Build a GeoJSON Polygon
      // Convert each (lat, lon) to [lon, lat]
      const coords = polygonCoords.map((c) => [parseFloat(c.lon), parseFloat(c.lat)]);

      // A valid polygon must have at least 3 distinct vertices,
      // with the first coordinate repeated at the end.
      if (coords.length >= 3) {
        coords.push(coords[0]); // close the ring
        geo = {
          type: 'Polygon',
          coordinates: [coords],
        };
      }
    } else if (geometryType === 'custom') {
      if (customGeoJson !== undefined && customGeoJson?.trim() !== '') {
        geo = JSON.parse(customGeoJson!) as JSON;
      }
    }

    // If none or invalid input => geometry stays null
    // We’ll just pass null back (which means "no geometry" or "invalid geometry")

    // Return geometry as stringified JSON or null
    setIntersects((geo ? JSON.stringify(geo) : null) ?? '');
  }

  const stacDateStartFieldRef = useRef<HTMLInputElement>(null);
  const stacDateEndFieldRef = useRef<HTMLInputElement>(null);
  function clearAllFields(): void {
    setSelectedCollections([]);
    setSelectedIds('');
    setLimit(1000);
    setPrevious('');
    setNext('');
    setSearching(false);
    setShowResults(false);
    setIntersects('');
    setBbox('');
    setDatetimeStart('');
    setDatetimeEnd('');
    setGeometryType('none');
    setPolygonCoords([]);
    setPointLat('');
    setPointLon('');
    if (stacDateStartFieldRef.current) {
      stacDateStartFieldRef.current.value = '';
    }
    if (stacDateEndFieldRef.current) {
      stacDateEndFieldRef.current.value = '';
    }
  }

  function geoSwitch(): JSX.Element {
    if (geometryType === 'point') {
      return (
        <div
          style={{
            marginBottom: '4px',
            display: 'flex',
            height: 'min-content',
          }}
        >
          <label
            htmlFor="pointLatitudeInput"
            style={{
              display: 'grid',
              gridTemplateColumns: '35% 50%',
            }}
          >
            {i18nLatitude()}
            <input id="pointLatitudeInput" type="text" value={pointLat} onChange={(e) => setPointLat(e.currentTarget.value)} />
          </label>
          <label
            htmlFor="pointLongitudeInput"
            style={{
              display: 'grid',
              gridTemplateColumns: '35% 50%',
              marginLeft: '8px',
            }}
          >
            {i18nLongitude()}
            <input id="pointLongitudeInput" type="text" value={pointLon} onChange={(e) => setPointLon(e.currentTarget.value)} />
          </label>
        </div>
      );
    }
    if (geometryType === 'polygon') {
      return (
        <div>
          {polygonCoords.map(
            (
              coord: {
                lat: string | number | readonly string[] | undefined;
                lon: string | number | readonly string[] | undefined;
              },
              i: number
            ) => (
              <div
                key={`polygonCoords-${Math.random()}-${Math.random()}`}
                style={{
                  marginBottom: '4px',
                  display: 'flex',
                }}
              >
                <label
                  htmlFor="polygonLatitudeInput"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '35% 50%',
                  }}
                >
                  {i18nLatitude()}
                  <input
                    id="polygonLatitudeInput"
                    type="text"
                    value={coord.lat}
                    onChange={(e) => {
                      updatePolygonCoord(i, 'lat', e.currentTarget.value);
                    }}
                  />
                </label>
                <label
                  htmlFor="polygonLongitudeInput"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '35% 50%',
                    marginLeft: '8px',
                  }}
                >
                  {i18nLongitude()}
                  <input
                    id="polygonLongitudeInput"
                    type="text"
                    value={coord.lon}
                    onChange={(e) => {
                      updatePolygonCoord(i, 'lon', e.currentTarget.value);
                    }}
                  />
                </label>
              </div>
            )
          )}
          <button type="button" className="stacButtons" onClick={addPolygonCoord}>
            {i18nAddVertex()}
          </button>
        </div>
      );
    }
    if (geometryType === 'bbox') {
      return (
        <input
          id="bboxInput"
          style={{ height: 'min-content' }}
          placeholder={i18nBoundingBoxPlaceholder()}
          className={`StacBboxInput ${bboxErrorClass}`}
          value={bbox || ''}
          onChange={(e) => setBbox(e.currentTarget.value)}
        />
      );
    }
    if (geometryType === 'custom') {
      return (
        <textarea
          placeholder={i18nCustomGeoJsonString()}
          onChange={(e) => {
            setCustomGeoJson(e.currentTarget.value);
          }}
        />
      );
    }
    return <div />;
  }

  // eslint-disable-next-line react/no-unstable-nested-components
  function InterceptsDiv(): JSX.Element {
    return (
      <div>
        <div className="dialog-backdrop">
          <div className="dialog-content">
            <div
              style={{
                display: 'grid',
              }}
            >
              <label htmlFor="intersectsRadioNoneInput">
                <input
                  id="intersectsRadioNoneInput"
                  style={{ margin: '3px' }}
                  type="radio"
                  checked={geometryType === 'none'}
                  value="none"
                  onChange={(e) => setGeometryType(e.currentTarget.value)}
                />
                {i18nNone()}
              </label>
              <label htmlFor="intersectsRadioPointInput">
                <input
                  id="intersectsRadioPointInput"
                  style={{ margin: '3px' }}
                  type="radio"
                  checked={geometryType === 'point'}
                  value="point"
                  onChange={(e) => setGeometryType(e.currentTarget.value)}
                />
                {i18nPoint()}
              </label>
              <label htmlFor="intersectsRadioPolygonInput">
                <input
                  id="intersectsRadioPolygonInput"
                  style={{ margin: '3px' }}
                  type="radio"
                  checked={geometryType === 'polygon'}
                  value="polygon"
                  onChange={(e) => setGeometryType(e.currentTarget.value)}
                />
                {i18nPolygon()}
              </label>
              <label htmlFor="intersectsRadioBboxInput">
                <input
                  id="intersectsRadioBboxInput"
                  style={{ margin: '3px' }}
                  type="radio"
                  checked={geometryType === 'bbox'}
                  value="bbox"
                  onChange={(e) => setGeometryType(e.currentTarget.value)}
                />
                {i18nBoundingBox()}
              </label>
              <label htmlFor="intersectsRadioCustomInput">
                <input
                  id="intersectsRadioCustomInput"
                  style={{ margin: '3px' }}
                  type="radio"
                  checked={geometryType === 'custom'}
                  value="custom"
                  onChange={(e) => setGeometryType(e.currentTarget.value)}
                />
                {i18nCustom()}
              </label>
            </div>
            {geoSwitch()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="" style={{ maxHeight: '38rem', height: '38rem' }}>
      {!showResults ? (
        <>
          {' '}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '25% 50%',
              gap: '0.5rem',
              height: '90%',
              maxHeight: '90%',
              overflowY: 'auto',
            }}
          >
            <h3>{i18nFilters()}</h3>
            <div />
            <label htmlFor="searchCollectionsSelect">{i18nCollections()}: </label>
            <select
              name="searchCollectionsSelect"
              defaultValue={[i18nSelectCollections()]}
              onChange={(e) => setSelectedCollections([e.target.value])}
              multiple
            >
              {collections.map((option: StacCollection) => (
                <option key={option.id}> {option.id} </option>
              ))}
            </select>
            <label htmlFor="searchLimitSelect">{i18nLimitResults()}</label>
            <select name="searchLimitSelect" defaultValue={1000} onChange={(e) => setLimit(parseInt(e.target.value, 10))}>
              {[10, 50, 100, 250, 500, 1000, 2000].map((x: number) => (
                <option key={x}> {x} </option>
              ))}
            </select>
            <label htmlFor="searchItemIdsSelect">{i18nItemIds()}</label>
            <input
              id="itemIdsInput"
              style={{ height: 'min-content' }}
              placeholder={i18nAddItemIds()}
              value={selectedIds || ''}
              onChange={(e) => setSelectedIds(e.currentTarget.value)}
            />
            <p>{i18nDateTime()}</p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '20% 50%',
                gap: '0.25rem',
              }}
            >
              <label htmlFor="startDateInput" style={{ alignSelf: 'center' }}>
                {i18nStartLabel()}
              </label>
              <input
                id="startDateInput"
                type="date"
                className={`StacDatetimeInput ${datetimeErrorClass}`}
                placeholder="Datetime"
                step="1"
                value={datetimeStart || ''}
                ref={stacDateStartFieldRef}
                onChange={(e) => {
                  setDatetimeStart(e.currentTarget.value);
                }}
              />
              <label htmlFor="endDateInput" style={{ alignSelf: 'center' }}>
                {i18nEndLabel()}
              </label>
              <input
                id="endDateInput"
                type="date"
                className={`StacDatetimeInput ${datetimeErrorClass}`}
                placeholder="Datetime"
                step="1"
                value={datetimeEnd || ''}
                ref={stacDateEndFieldRef}
                onChange={(e) => {
                  setDatetimeEnd(e.currentTarget.value);
                }}
              />
            </div>
            <label htmlFor="intersectsControl">{i18nIntersectsLabel()}</label>
            <InterceptsDiv />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              className="stacButtons"
              style={{ marginRight: '0.5rem' }}
              onClick={() => {
                handleSave();
                setSearchUrl(baseUrl);
                getSearchResults().catch((e) => {
                  throw new Error(e);
                });
                setShowResults(true);
              }}
            >
              {i18nSearch()}
            </button>
            <button
              type="button"
              className="stacButtons"
              style={{}}
              onClick={() => {
                clearAllFields();
              }}
            >
              {i18nClear()}
            </button>
          </div>{' '}
        </>
      ) : null}
      {showResults ? (
        <>
          <button
            type="button"
            className="stacButtons"
            onClick={() => {
              setShowResults(false);
              setSearching(false);
            }}
          >
            {i18nBack()}
          </button>
          <div className="StacSearchResults">
            {loading ? <p>{i18nSearching()}</p> : null}
            {error ? <p className="StacErrorText">{i18nErrorSearchingStac()}</p> : null}
            {searching && !loading && !error && searchResults ? <StacSearchResult searchResults={searchResults!} /> : null}
          </div>
          <div className="StacSearchPagingButtons">
            {previous.trim().length > 0 ? (
              <button
                type="button"
                className="stacButtons"
                onClick={() => {
                  pageNavRequest(previous!).catch((e) => {
                    throw new Error(e);
                  });
                }}
              >
                {i18nPreviousPage()}
              </button>
            ) : null}
            {searching && !loading && !error && searchResults ? (
              <>
                <span>
                  {i18nResultsReturned()}
                  {searchResults!.context ? searchResults!.context!.returned : i18nNotListed()}
                </span>
                <span>
                  {i18nResultsLimit()}
                  {searchResults!.context ? searchResults!.context!.limit : i18nNotListed()}
                </span>
                <span>
                  {i18nResultsMatched()}
                  {searchResults!.context ? searchResults!.context!.matched : i18nNotListed()}
                </span>{' '}
              </>
            ) : null}
            {next.trim().length > 0 ? (
              <button
                type="button"
                className="stacButtons"
                onClick={() => {
                  pageNavRequest(next!).catch((e) => {
                    throw new Error(e);
                  });
                }}
              >
                {i18nNextPage()}
              </button>
            ) : null}
          </div>{' '}
        </>
      ) : null}
    </div>
  );
}

export function StacCatalog(props: { url: string; selectCallback: (asset: StacCallbackInputType) => void }): JSX.Element {
  const { url, selectCallback } = props;

  const { setCallback } = useStacContext();

  useEffect(() => {
    setCallback(() => selectCallback as unknown as callbackType);
  }, [selectCallback, setCallback]);

  const [type, setType] = useState('collections');

  const [content, setContent] = useState<React.ReactNode>(<p>{i18nGettingStacCatalog()}</p>);

  useEffect(() => {
    stacRootRequest(url)
      .then((result) => {
        setContent(result);
      })
      .catch(() => {
        setContent(<p>{i18nErrorLoadingStac()}</p>);
      });
  }, [url]);

  return (
    <div className="StacCard" id="StacRoot">
      <div className="StacHeader">
        <Suspense fallback={<p>{i18nGettingStacCatalog()}</p>}>{content}</Suspense>
        <div className="StacNavigationSelector">
          {type === 'collections' ? (
            <button type="button" className="stacButtons" onClick={() => setType('search')}>
              {i18nSearch()}
            </button>
          ) : (
            <button type="button" className="stacButtons" onClick={() => setType('collections')}>
              {i18nCollections()}
            </button>
          )}
        </div>
      </div>
      {type === 'search' ? <StacSearch url={url} /> : <BrowseCollection url={url} />}
    </div>
  );
}

export function StacFeature(props: { feature: StacItem }): JSX.Element {
  const { feature } = props;
  const { callback } = useStacContext();
  const [selectedFeature, setSelectedFeature] = useState<StacAssetObject>(null as unknown as StacAssetObject);
  const optionsObject = Object.entries(feature.assets)
    .map(([key, value]) => {
      return {
        name: key,
        value,
      };
    })
    .filter((asset) => asset.name !== 'thumbnail');

  function handleSelect(): void {
    callback!({ asset: selectedFeature, feature });
  }

  useEffect(() => {
    if (optionsObject.length > 0) {
      setSelectedFeature(optionsObject[0].value!);
    }
  }, [optionsObject]);

  function addToMapClicked(): void {
    if (selectedFeature.type === 'image/tiff; application=geotiff; profile=cloud-optimized' || selectedFeature.type === 'image/tiff') {
      handleSelect();
    } else {
      // TODO: Hook into Error notification system.
      throw new Error(i18nNoAssetSelected());
    }
  }

  return (
    <div className="StacFeature">
      {feature.assets.thumbnail?.href ? (
        <img
          className="stacFeatureThumbnail"
          src={feature.assets.thumbnail.href}
          crossOrigin="anonymous"
          alt={feature.assets.thumbnail.title ? feature.assets.thumbnail.title : i18nThumbnail()}
        />
      ) : (
        <p>{i18nNoThumbnail()}</p>
      )}
      <div style={{ padding: '0.5rem' }}>
        <p>{i18nId() + feature.id}</p>
        <p>{i18nBoundingBox() + feature.bbox.join(', ')}</p>
        {feature.properties.datetime ? <p>{feature.properties.datetime ? i18nDateTime() + feature.properties.datetime : ''}</p> : null}
        {feature.properties.created ? <p>{feature.properties.created ? i18nCreationDate() + feature.properties.created : ''}</p> : null}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '75% 25%',
          }}
        >
          <select
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              const selectedValue = optionsObject.find((option) => option.name === event.target.value);
              if (selectedValue) {
                if (selectedValue.value) {
                  setSelectedFeature(selectedValue.value);
                }
              }
            }}
          >
            {optionsObject.map((option) => (
              <option key={option.name} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
          <button type="button" className="stacButtons" onClick={addToMapClicked}>
            {i18nAddToMap()}
          </button>
        </div>
      </div>
    </div>
  );
}

function StacFeatureCollection(props: { featureCollection: StacSearchResult }): JSX.Element {
  const { featureCollection } = props;
  return (
    <div className="StacFeatureCollection">
      {featureCollection.features.map((feature: StacItem) => (
        <StacFeature key={feature.id} feature={feature} />
      ))}
    </div>
  );
}

function StacSearchResult(props: { searchResults: StacSearchResult }): JSX.Element {
  const { searchResults } = props;
  return <StacFeatureCollection featureCollection={searchResults} />;
}
