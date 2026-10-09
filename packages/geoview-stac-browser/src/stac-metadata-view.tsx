import type { ReactNode } from 'react';
import type { SxStyles } from 'geoview-core/ui/style/types';
import { Box, Typography } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { containsHtmlTags, linkifyAndSanitizeHtml } from 'geoview-core/core/utils/utilities';
import { UseHtmlToReact } from 'geoview-core/core/components/common/hooks/use-html-to-react';

import type { StacItem, StacItemViewConfig } from './stac-browser-types';
import { StacFieldUtils } from './stac-field-utils';

/**
 * Renders URLs in metadata as safe external links while leaving surrounding text escaped by React.
 *
 * @param value - The metadata value to render
 * @param opensInNewTab - Accessible announcement for external links
 * @returns The value with URL segments rendered as links
 */
function renderMetadataLinks(value: string, opensInNewTab: string): ReactNode {
  const safeHtml = linkifyAndSanitizeHtml(value, opensInNewTab);
  return containsHtmlTags(safeHtml) ? <UseHtmlToReact htmlContent={safeHtml} omitWrappers /> : safeHtml;
}

/** Props for the StacMetadataView component. */
interface StacMetadataViewProps {
  /** The STAC item to display. */
  item: StacItem;
  /** Optional item display options (metadataFields, excludeFields). */
  itemView?: StacItemViewConfig;
  /** The sx classes object. */
  sxClasses: SxStyles;
}

/**
 * Creates the key/value metadata view of a STAC item, driven by the itemView configuration.
 *
 * @param props - Properties defined in StacMetadataViewProps interface
 * @returns The metadata view component
 */
export function StacMetadataView(props: StacMetadataViewProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-stac-browser/stac-metadata-view');

  const { item, itemView, sxClasses } = props;
  const { t } = useTranslation();

  const rows = StacFieldUtils.getMetadataRows(item, itemView);

  return (
    <Box sx={sxClasses.metadataGrid} component="dl">
      {rows.map((row) => (
        <Box key={row.field} sx={{ display: 'contents' }}>
          <Typography component="dt" sx={sxClasses.metadataKey}>
            {row.isConfiguredLabel ? t(row.label) : row.label}
          </Typography>
          <Typography component="dd" sx={sxClasses.metadataValue}>
            {renderMetadataLinks(row.value, t('general.opensInNewTab'))}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
