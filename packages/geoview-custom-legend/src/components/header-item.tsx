import type { TypeWindow } from 'geoview-core/core/types/global-types';

import { DescriptionText } from './description-text';
import type { TypeHeaderLayer } from '../custom-legend-types';
import { isHeaderLayer } from '../custom-legend-types';
import type { getSxClasses } from '../custom-legend-style';

interface HeaderItemProps {
  item: TypeHeaderLayer;
  sxClasses: ReturnType<typeof getSxClasses>;
}

/**
 * Renders a header item.
 * @param {HeaderItemProps} props - Component props
 * @returns {JSX.Element | undefined} The rendered header
 */
export function HeaderItem({ item, sxClasses }: HeaderItemProps): JSX.Element | undefined {
  const { cgpv } = window as TypeWindow;
  const { ui } = cgpv;
  const { Box, Typography } = ui.elements;

  if (!isHeaderLayer(item)) return;

  // Create the override object and if values are present, they will override the default values
  const styleOverrides = {
    ...(item.fontSize && { fontSize: `${item.fontSize}px` }),
    ...(item.fontWeight && { fontWeight: item.fontWeight }),
  };

  return (
    <Box sx={sxClasses.headerItem}>
      <Typography sx={{ ...sxClasses.headerText, ...styleOverrides }}>{item.text}</Typography>
      {item.description && <DescriptionText description={item.description} sxClasses={sxClasses} />}
    </Box>
  );
}
