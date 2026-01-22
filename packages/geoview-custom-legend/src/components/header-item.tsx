import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';

import type { TypeHeaderLayer } from '../custom-legend-types';
import { isHeaderLayer, getLocalizedText } from '../custom-legend-types';
import type { getSxClasses } from '../custom-legend-style';

interface HeaderItemProps {
  item: TypeHeaderLayer;
  sxClasses: ReturnType<typeof getSxClasses>;
}

/**
 * Renders a header item.
 * @param {HeaderItemProps} props - Component props
 * @returns {JSX.Element} The rendered header
 */
export function HeaderItem({ item, sxClasses }: HeaderItemProps): JSX.Element | undefined {
  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Box, Typography } = ui.elements;

  const appDisplayLanguage = useAppDisplayLanguage();

  if (!isHeaderLayer(item)) return;

  const headerText = getLocalizedText(item.text, appDisplayLanguage);

  // Create the override object and if values are present, they will override the default values
  const styleOverrides = {
    ...(item.fontSize && { fontSize: `${item.fontSize}px` }),
    ...(item.fontWeight && { fontWeight: item.fontWeight }),
  };

  return (
    <Box sx={sxClasses.headerItem}>
      <Typography sx={{ ...sxClasses.headerText, ...styleOverrides }}>{headerText}</Typography>
    </Box>
  );
}
