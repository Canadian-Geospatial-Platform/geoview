import { StacCatalog } from './StacCatalog';
import { StacContextProvider } from './StacContext';
import type { StacCallbackInputType } from './Types';

/**
 * STAC Browser Root Element.
 * @param props {
      url: STAC URL
      selectCallback: Callback function to call when 'Add To Map' is clicked on a STAC Item.
      bboxSignal: bbox state to pass in for searching via bounding box.
      intersectsSignal: intersects state to pass in for searching via intersection
      datetimeStartSignal: datetime start state to pass in for searching via date time
      datetimeEndSignal: datetime end state to pass in for searching via date time
  }
 * @returns STAC Browser for given URL.
 */
export function Stac(props: {
  url: string;
  selectCallback: (asset: StacCallbackInputType) => void;
  bboxSignal: [string, React.Dispatch<React.SetStateAction<string>>];
  intersectsSignal: [string, React.Dispatch<React.SetStateAction<string>>];
  datetimeStartSignal: [string, React.Dispatch<React.SetStateAction<string>>];
  datetimeEndSignal: [string, React.Dispatch<React.SetStateAction<string>>];
}): JSX.Element {
  const { url, selectCallback, bboxSignal, intersectsSignal, datetimeStartSignal, datetimeEndSignal } = props;
  return (
    <StacContextProvider
      bboxSignal={bboxSignal}
      intersectsSignal={intersectsSignal}
      datetimeStartSignal={datetimeStartSignal}
      datetimeEndSignal={datetimeEndSignal}
    >
      <StacCatalog url={url} selectCallback={selectCallback} />
    </StacContextProvider>
  );
}
