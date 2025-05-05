import { StacCatalog } from './StacCatalog';
import { StacContextProvider } from './StacContext';
import type { StacAssetObject } from './Types';

export function Stac(props: {
  url: string;
  selectCallback: (asset: StacAssetObject) => void;
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
