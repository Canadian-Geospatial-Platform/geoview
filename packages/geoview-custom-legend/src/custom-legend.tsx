import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { getSxClassesMain, getSxClasses } from './custom-legend-style';

interface CustomLegendPanelProps {
  config: TypeLegendProps;
}

interface LegendItem {
  legendTitle: string;
  symbolUrl: string;
  description?: string;
}

type LegendListItems = LegendItem[];

type IndexManifestItem = { name: string; title?: string };
type IndexManifest = { files: IndexManifestItem[] };
type LegendConfig = { legendList: LegendListItems };

export type TypeLegendProps = {
  isOpen: boolean;
  legendList: LegendListItems;
  version: string;
};

export function CustomLegendPanel(props: CustomLegendPanelProps): JSX.Element {
  const { config } = props;
  const { legendList } = config;

  const { cgpv } = window as TypeWindow;
  const { ui, reactUtilities } = cgpv;
  const { useEffect, useState } = reactUtilities.react;
  const { Card, Box } = ui.elements;

  const theme = ui.useTheme();
  const sxClasses = getSxClasses(theme);
  const legendSxMain = getSxClassesMain();

  const [files, setFiles] = useState<{ name: string; title: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [activeLegendList, setActiveLegendList] = useState<LegendListItems>(legendList);

  const fetchJson = async (urls: string[]): Promise<unknown> => {
    const tryFetch = (url: string) =>
      fetch(url).then((r) => {
        if (!r.ok) throw new Error('Response not ok');
        return r.json();
      });

    let chain: Promise<unknown> = Promise.reject(new Error('init'));
    urls.forEach((u) => {
      chain = chain.catch(() => tryFetch(u));
    });
    return chain.catch(() => {
      throw new Error('All fetch attempts failed');
    });
  };

  useEffect(() => {
    fetchJson(['/configs/custom-legend/index.json', './configs/index.json'])
      .then((d) => {
        const manifest = (d ?? {}) as Partial<IndexManifest>;
        const list = Array.isArray(manifest.files) ? manifest.files : [];
        setFiles(list);
      })
      .catch(() => {
        setFiles([]);
      });
  }, []);

  const handleChange = (e: { target?: { value?: string } }): void => {
    const name = e?.target?.value || '';
    setSelectedFile(name);
    if (!name) return;
    fetchJson([`/configs/custom-legend/${name}`, `./configs/${name}`])
      .then((data) => {
        const cfg = (data ?? {}) as Partial<LegendConfig>;
        const list = Array.isArray(cfg.legendList) ? cfg.legendList : [];
        setActiveLegendList(list);
      })
      .catch(() => {
        setActiveLegendList([]);
      });
  };

  return (
    <Box sx={{ background: theme.palette.geoViewColor.bgColor.main, ...legendSxMain.container }}>
      <Box sx={{ marginBottom: '8px' }}>
        <select value={selectedFile} onChange={handleChange} aria-label="Select legend configuration">
          <option value="">Select a legend…</option>
          {files.map((f) => (
            <option key={f.name} value={f.name}>
              {f.title || f.name}
            </option>
          ))}
        </select>
      </Box>
      {activeLegendList.map((legendItem: LegendItem, index) => (
        <Box key={`${legendItem.legendTitle}-${legendItem.symbolUrl}`} sx={sxClasses.legendLayerListItem}>
          <Card
            tabIndex={0}
            className="legendCardItem"
            title={legendItem.legendTitle}
            contentCard={
              typeof legendItem.symbolUrl === 'string' ? (
                <div className="legend-item-container">
                  <Box component="img" src={legendItem.symbolUrl} alt="" className="legendSymbol" />
                  <div className="legend-text">
                    <span className="legend-title">{legendItem.legendTitle}</span>
                    {legendItem.description && <span className="legend-description">{legendItem.description}</span>}
                  </div>
                </div>
              ) : null
            }
          />
        </Box>
      ))}
    </Box>
  );
}
