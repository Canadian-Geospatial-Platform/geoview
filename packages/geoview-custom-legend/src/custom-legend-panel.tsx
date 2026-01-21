import { useMemo } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';

import { getSxClasses } from './custom-legend-style';
import type { TypeCustomLegendConfig } from './custom-legend-types';
import { generateLegendItemId } from './custom-legend-types';
import { LegendItem } from './components';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';

interface CustomLegendPanelProps {
  config: TypeCustomLegendConfig;
}

/**
 * Main custom legend panel component.
 * @param {CustomLegendPanelProps} props - Component props
 * @returns {JSX.Element} The rendered panel
 */
export function CustomLegendPanel(props: CustomLegendPanelProps): JSX.Element {
  const { config } = props;
  const { legendList } = config;

  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Box } = ui.elements;

  const theme = ui.useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  const appDisplayLanguage = useAppDisplayLanguage();

  return (
    <Box sx={sxClasses.container}>
      {legendList.map((item, index) => {
        const itemId = generateLegendItemId(item, index, appDisplayLanguage);
        return <LegendItem key={itemId} item={item} sxClasses={sxClasses} itemPath={itemId} />;
      })}
    </Box>
  );
}
