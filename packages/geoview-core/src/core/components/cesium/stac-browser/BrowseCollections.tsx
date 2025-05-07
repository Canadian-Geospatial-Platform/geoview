/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import { useState, useEffect, Suspense, useRef } from 'react';
import type { StacCollection, StacItem, StacLink } from './Types';
import { stacCollectionsRequest, stacItemsRequest } from './requests';
import { StacFeature } from './StacCatalog';
import './BrowseCollections.css';
import { i18nBack, i18nGettingStacCatalog, i18nId, i18nKeywords, i18nLicense } from './StacStrings';
import { useStacContext } from './StacContext';

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

export function BrowseCollection(props: { url: string }): JSX.Element {
  const { url } = props;
  const { setCollections } = useStacContext();
  const [isCollectionPage, setIsCollectionPage] = useState(false);
  const [collectionPage, setCollectionPage] = useState<StacCollection | null>(null);

  const [data, setData] = useState<StacCollection[] | null>(null);

  async function getCollections(): Promise<void> {
    const collections = await stacCollectionsRequest(url);
    setData(collections);
    setCollections(collections);
  }
  if (!data) {
    getCollections().catch((error) => {
      throw new Error(`Error fetching STAC collections: ${error}`);
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

function StacItems(props: { url: string }): JSX.Element {
  const { url } = props;

  const [content, setContent] = useState<StacItem[] | undefined>(undefined);

  useEffect(() => {
    stacItemsRequest(url)
      .then((result) => {
        setContent(result);
      })
      .catch((error) => {
        throw new Error(`Error fetching STAC items: ${error}`);
      });
  }, [url]);

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
          <button
            type="button"
            className="stacButtons"
            onClick={() => {
              setCollectionPage(null);
              setIsCollectionPage(false);
            }}
          >
            <span className="">{i18nBack()}</span>
          </button>{' '}
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
