import type { TypeWindow } from 'geoview-core/core/types/global-types';
import type { TypeLegendItem } from '../custom-legend-types';
import { getLocalizedText, isHeaderLayer } from '../custom-legend-types';
import type { getSxClasses } from '../custom-legend-style';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';

interface HeaderItemProps {
  item: TypeLegendItem;
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

  return (
    <Box sx={sxClasses.headerItem}>
      <Typography
        variant="h5"
        sx={{
          fontSize: item.fontSize ? `${item.fontSize}` : '1.25rem',
          fontWeight: item.fontWeight || 'bold',
          padding: '8px 16px',
        }}
      >
        {headerText}
      </Typography>
    </Box>
  );
}
