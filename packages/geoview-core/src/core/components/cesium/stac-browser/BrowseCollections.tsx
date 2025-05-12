/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import { useState, useEffect, Suspense, useRef } from 'react';
import type { StacCollection, StacItem, StacLink } from './Types';
import { stacCollectionsRequest, stacItemsRequest } from './requests';
import { StacFeature } from './StacCatalog';
import './BrowseCollections.css';
import { i18nBack, i18nGettingStacCatalog, i18nId, i18nKeywords, i18nLicense } from './StacStrings';
import { useStacContext } from './StacContext';
import { Button } from '@/ui/button/button';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

/**
 * Overview panel containing a STAC Item's Title and ID for use with listing items.
 * @param props {
 *    collection: An object representing a STAC Collection.
 *    setIsCollectionPage: A callback to set the isCollectionPage state.
 *    setCollectionPage: A call to set the collectionPage state.
 * }
 * @returns asd
 */
function StacCollectionOverview(props: {
  collection: StacCollection;
  setIsCollectionPage: React.Dispatch<React.SetStateAction<boolean>>;
  setCollectionPage: React.Dispatch<React.SetStateAction<StacCollection | null>>;
}): JSX.Element {
  const { collection, setIsCollectionPage, setCollectionPage } = props;

  function clicked(): void {
    setCollectionPage(collection);
    setIsCollectionPage(true);
  }

  return (
    <div className="StacCollectionCard">
      <h2 onClick={clicked} onKeyDown={clicked}>
        {collection.title}
      </h2>
      <p>{`${i18nId()}${collection.id}`}</p>
    </div>
  );
}

/**
 * Creates and returns a JSX Element from a STAC URL.
 * This element will have a scroll list of STAC Collections and, when one is clicked,
 * overlays the StacCollection element.
 * @param props { url: string } A url to a STAC Catalog.
 * @returns JSX Element containing A collection scroll list and a collection page when one is clicked.
 */
export function BrowseCollection(props: { url: string }): JSX.Element {
  const { url } = props;
  const { setCollections } = useStacContext();
  const [isCollectionPage, setIsCollectionPage] = useState(false);
  const [collectionPage, setCollectionPage] = useState<StacCollection | null>(null);

  const [data, setData] = useState<StacCollection[] | null>(null);
  const mapId = useGeoViewMapId();
  const viewer = MapEventProcessor.getMapViewer(mapId);

  async function getCollections(): Promise<void> {
    const collections = await stacCollectionsRequest(url);
    setData(collections);
    setCollections(collections);
  }
  if (!data) {
    getCollections().catch((error) => {
      viewer.notifications.addNotificationError(`Error fetching STAC collections: ${error}`);
    });
  }

  const collectionPageRef = useRef<HTMLDivElement>(null);
  const browseCollectionPageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCollectionPage && collectionPageRef && browseCollectionPageRef) {
      collectionPageRef.current?.classList.remove('collectionPage-hidden');
      collectionPageRef.current?.classList.add('collectionPage');
      browseCollectionPageRef.current?.classList.remove('StacScroll');
      browseCollectionPageRef.current?.classList.add('StacScroll-hidden');
      // collectionPageRef.style.top = `${
      //     browseCollectionPageRef.getBoundingClientRect().top
      // }px`;
      collectionPageRef.current?.focus();
    } else if (!isCollectionPage && collectionPageRef && browseCollectionPageRef) {
      collectionPageRef.current?.classList.remove('collectionPage');
      collectionPageRef.current?.classList.add('collectionPage-hidden');
      browseCollectionPageRef.current?.classList.remove('StacScroll-hidden');
      browseCollectionPageRef.current?.classList.add('StacScroll');
      // collectionPageRef.style.top = `${
      //     browseCollectionPageRef.getBoundingClientRect().top
      // }px`;
      collectionPageRef.current?.focus();
    }
  });

  return (
    <>
      <Suspense fallback={<p>Getting STAC Response</p>}>
        <nav className="StacScroll" ref={browseCollectionPageRef}>
          {data ? (
            data.map((collection: StacCollection) => (
              <StacCollectionOverview
                key={collection.id}
                collection={collection}
                setIsCollectionPage={setIsCollectionPage}
                setCollectionPage={setCollectionPage}
              />
            ))
          ) : (
            <div />
          )}
        </nav>
      </Suspense>
      <StacCollection
        innerRef={collectionPageRef}
        collection={collectionPage}
        setCollectionPage={setCollectionPage}
        setIsCollectionPage={setIsCollectionPage}
      />{' '}
    </>
  );
}

/**
 * List of STAC Items inside a Collection Page.
 * @param props { url: string } A url for the STAC Items in a Collection.
 * @returns JSX.Element of a list of StacFeatures.
 */
function StacItems(props: { url: string }): JSX.Element {
  const { url } = props;

  const [content, setContent] = useState<StacItem[] | undefined>(undefined);
  const mapId = useGeoViewMapId();
  const viewer = MapEventProcessor.getMapViewer(mapId);

  useEffect(() => {
    stacItemsRequest(url)
      .then((result) => {
        setContent(result);
      })
      .catch((error) => {
        viewer.notifications.addNotificationError(`Error fetching STAC items: ${error}`);
      });
  }, [url, viewer.notifications]);

  if (content !== undefined) {
    return (
      <Suspense fallback={<p>{i18nGettingStacCatalog()}</p>}>
        <div className="StacItems">
          {content.map((item: StacItem) => (
            <StacFeature key={item.id} feature={item} />
          ))}
        </div>
      </Suspense>
    );
  }
  return <div />;
}

/**
 * A JSX element for a STAC Collection.
 * @param props {
 *    innerRef: Ref for the inner collectionPage div.
 *    collection: A stac collection.
 *    setCollectionPage: A call to set the collectionPage state.
 *    setIsCollectionPage: A callback to set the isCollectionPage state.
 * }
 * @returns JSX Element for a STAC Collection with all its info and a list of STAC Items.
 */
function StacCollection(props: {
  innerRef: React.RefObject<HTMLDivElement | null>;
  collection: StacCollection | null;
  setCollectionPage: React.Dispatch<React.SetStateAction<StacCollection | null>>;
  setIsCollectionPage: React.Dispatch<React.SetStateAction<boolean>>;
}): JSX.Element {
  const { collection, setCollectionPage, setIsCollectionPage, innerRef } = props;

  return (
    <div className="collectionPage-hidden" ref={innerRef as React.RefObject<HTMLDivElement>}>
      <div className="collectionPageInfo">
        <div className="collectionPageInfoTopDiv">
          <Button
            className="buttonOutlineFilled"
            onClick={() => {
              setCollectionPage(null);
              setIsCollectionPage(false);
            }}
            type="text"
            variant="contained"
          >
            <span className="">{i18nBack()}</span>
          </Button>{' '}
          <p>{`${i18nId()}${collection ? collection.id : ''}`}</p>
        </div>
        <h3>{collection ? collection.title : ''}</h3>
        <p className="collectionPageDescription">{collection ? collection.description : ''}</p>
        <div className="collectionPageInfoBottomDiv">
          <p className="collectionPageInfoBottomKeywordsLabel" title={collection ? collection.keywords?.join(', ') : ''}>
            {' '}
            {`${i18nKeywords()}${collection ? collection.keywords?.join(', ') : ''}`}
          </p>
          <p />
          <p className="collectionPageInfoBottomLicenseLabel" title={collection ? collection.license : ''}>{`${i18nLicense()}${
            collection ? collection.license : collection
          }`}</p>
        </div>
      </div>
      <Suspense fallback={<p>Getting Items</p>}>
        <nav className="collectionPageScroll">
          {collection?.links.find((link: StacLink) => link.rel === 'items') ? (
            <StacItems url={collection.links.find((link: StacLink) => link.rel === 'items')!.href} />
          ) : null}
        </nav>
      </Suspense>
    </div>
  );
}
