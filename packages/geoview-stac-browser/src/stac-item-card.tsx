import { memo, useId } from 'react';

import type { SxProps, SxStyles } from 'geoview-core/ui/style/types';
import { Box, Button, Checkbox, Tooltip, Typography } from 'geoview-core/ui';
import { ChevronRightIcon, MapIcon, VisibilityIcon, ZoomInSearchIcon } from 'geoview-core/ui/icons';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';

import type { StacItem, StacItemDisplayOptions } from './stac-browser-types';
import { StacAssetUtils } from './stac-asset-utils';
import { StacConfigUtils } from './stac-config-utils';
import { StacFieldUtils } from './stac-field-utils';

/** Props for the StacItemCard component. */
interface StacItemCardProps {
  /** The STAC item to display. */
  item: StacItem;
  /** Stable item identity used by list keys and event routing. */
  itemKey: string;
  /** Display options shared by all cards. */
  display: StacItemDisplayOptions;
  /** Color of the item when selected, undefined when not selected. */
  selectedColor?: string;
  /** Whether the item is previewed on the map. */
  isPreviewed: boolean;
  /** The sx classes object. */
  sxClasses: SxStyles;
  /** Callback when the selection checkbox changes; the stable item identity is the checkbox name. */
  onToggleSelected: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Callback for the map/detail actions; the item identity and action are read from data-item-key and data-action. */
  onAction: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Creates a STAC item card (light view) with selection, summary fields, and item actions.
 *
 * Memoized so that toggling one item does not re-render every card of the page.
 *
 * @param props - Properties defined in StacItemCardProps interface
 * @returns The item card component
 */
export const StacItemCard = memo(function StacItemCardComponent(props: StacItemCardProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-stac-browser/stac-item-card');

  const { item, itemKey, display, selectedColor, isPreviewed, sxClasses, onToggleSelected, onAction } = props;
  const effectiveDisplay = StacConfigUtils.resolveItemDisplayOptions(display, item.collection);
  const { itemView, actions, dateDisplay } = effectiveDisplay;
  const { t } = useTranslation();
  const titleId = useId();

  const title = StacFieldUtils.getTitle(item, itemView?.titleField);
  const footprintLabel = t('stacBrowser.highlightFootprint', { title });
  const thumbnailUrl = StacAssetUtils.getThumbnailUrl(item);
  const badge = StacAssetUtils.getAssetTypeBadge(item);
  const datetime = item.properties.datetime ?? item.properties.start_datetime;
  const canZoom = actions?.zoom !== false && !!StacFieldUtils.getBbox(item);
  const canPreview =
    effectiveDisplay.isPreviewEnabled && actions?.showOnMap !== false && !!StacAssetUtils.getPreviewAsset(item, effectiveDisplay.preview);

  return (
    <Box component="li" sx={[sxClasses.itemCard, !!selectedColor && { borderLeftColor: selectedColor }] as SxProps}>
      <Box sx={sxClasses.itemCardHeader}>
        <Tooltip title={footprintLabel}>
          <Checkbox
            name={itemKey}
            checked={!!selectedColor}
            onChange={onToggleSelected}
            size="small"
            sx={[sxClasses.itemCheckbox, !!selectedColor && { '&.Mui-checked': { color: selectedColor } }] as SxProps}
            slotProps={{ input: { 'aria-label': footprintLabel } }}
          />
        </Tooltip>
        {thumbnailUrl && <Box component="img" src={thumbnailUrl} alt="" sx={sxClasses.itemThumbnail} />}
        <Box sx={sxClasses.itemRowText}>
          <Typography id={titleId} sx={sxClasses.resultTitle}>
            {title}
          </Typography>
          {(badge || !itemView?.summaryFields?.length) && (
            <Typography sx={sxClasses.resultMeta}>
              {badge && (
                <Box component="span" sx={sxClasses.assetTypeBadge}>
                  {badge}
                </Box>
              )}
              {!itemView?.summaryFields?.length && datetime ? StacFieldUtils.formatValue(datetime, 'date', dateDisplay) : ''}
            </Typography>
          )}
          {!!itemView?.summaryFields?.length && (
            <Box sx={sxClasses.itemSummary}>
              {itemView.summaryFields.map((field) => {
                const value = StacFieldUtils.getFormattedValue(item, field, dateDisplay);
                if (!value) return null;
                return (
                  <Box component="span" key={field.field}>
                    <Box component="span" sx={sxClasses.itemSummaryLabel}>
                      {field.label ? t(field.label) : StacFieldUtils.getLabel(field)}:
                    </Box>{' '}
                    {value}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={sxClasses.itemCardActions}>
        {canZoom && (
          <Button
            type="text"
            size="small"
            startIcon={<ZoomInSearchIcon fontSize="small" />}
            data-item-key={itemKey}
            data-action="zoom"
            aria-describedby={titleId}
            onClick={onAction}
          >
            {t('stacBrowser.zoom')}
          </Button>
        )}
        {canPreview && (
          <Button
            type="text"
            size="small"
            startIcon={isPreviewed ? <VisibilityIcon fontSize="small" /> : <MapIcon fontSize="small" />}
            data-item-key={itemKey}
            data-action="preview"
            aria-describedby={titleId}
            onClick={onAction}
            aria-pressed={isPreviewed}
            sx={isPreviewed ? sxClasses.itemActionActive : undefined}
          >
            {t('stacBrowser.showOnMap')}
          </Button>
        )}
        <Button
          type="text"
          size="small"
          endIcon={<ChevronRightIcon fontSize="small" />}
          data-item-key={itemKey}
          data-action="detail"
          aria-describedby={titleId}
          onClick={onAction}
        >
          {t('stacBrowser.details')}
        </Button>
      </Box>
    </Box>
  );
});
