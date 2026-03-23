import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { logger } from 'geoview-core/core/utils/logger';

import { DescriptionText } from './description-text';
import type { TypeHeaderLayer } from '../custom-legend-types';
import { isHeaderLayer } from '../custom-legend-types';
import type { getSxClasses } from '../custom-legend-style';

/** Props for the HeaderItem component. */
interface HeaderItemProps {
  item: TypeHeaderLayer;
  sxClasses: ReturnType<typeof getSxClasses>;
}

/**
 * Renders a header item.
 *
 * @param props - Component props
 * @returns The rendered header, or undefined if the item is not a header
 */
export function HeaderItem({ item, sxClasses }: HeaderItemProps): JSX.Element | undefined {
  logger.logTraceRender('geoview-custom-legend/components/header-item');

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
