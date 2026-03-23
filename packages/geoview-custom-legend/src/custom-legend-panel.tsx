import { useMemo } from 'react';

import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { logger } from 'geoview-core/core/utils/logger';

import { getSxClasses } from './custom-legend-style';
import type { TypeCustomLegendConfig } from './custom-legend-types';
import { generateLegendItemId } from './custom-legend-types';
import { LegendItem } from './components';

/** Props for the CustomLegendPanel component. */
interface CustomLegendPanelProps {
  config: TypeCustomLegendConfig;
}

/**
 * Main custom legend panel component.
 *
 * @param props - Component props
 * @returns The rendered panel
 */
export function CustomLegendPanel(props: CustomLegendPanelProps): JSX.Element {
  logger.logTraceRender('geoview-custom-legend/custom-legend-panel');

  const { config } = props;
  const { legendList } = config;

  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Box, List } = ui.elements;

  const theme = ui.useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  const appDisplayLanguage = useAppDisplayLanguage();

  return (
    <Box sx={sxClasses.container}>
      <List className="legendList" sx={sxClasses.legendList}>
        {legendList.map((item, index) => {
          const itemId = generateLegendItemId(item, index, appDisplayLanguage);
          return <LegendItem key={itemId} item={item} sxClasses={sxClasses} itemPath={itemId} />;
        })}
      </List>
    </Box>
  );
}
