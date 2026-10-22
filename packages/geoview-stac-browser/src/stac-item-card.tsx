import { memo } from 'react';

import type { SxProps, SxStyles } from 'geoview-core/ui/style/types';
import { Box, Button, Checkbox, Switch, Tooltip, Typography } from 'geoview-core/ui';
import { ChevronRightIcon, ZoomInSearchIcon } from 'geoview-core/ui/icons';
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
  /** Callback when the show-on-map switch changes; the stable item identity is the switch name. */
  onTogglePreview: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Callback for the zoom/detail actions; the item identity and action are read from data-item-key and data-action. */
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

  const { item, itemKey, display, selectedColor, isPreviewed, sxClasses, onToggleSelected, onTogglePreview, onAction } = props;
  const effectiveDisplay = StacConfigUtils.resolveItemDisplayOptions(display, item.collection);
  const { itemView, actions, dateDisplay } = effectiveDisplay;
  const { t } = useTranslation();

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
          <Typography sx={sxClasses.resultTitle}>{title}</Typography>
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
            aria-label={t('stacBrowser.zoomOf', { title })}
            onClick={onAction}
          >
            {t('stacBrowser.zoom')}
          </Button>
        )}
        {canPreview && (
          <Switch
            size="small"
            name={itemKey}
            checked={isPreviewed}
            onChange={onTogglePreview}
            label={t('stacBrowser.showOnMap')}
            // Replaces the wrapper input slotProps, so aria-checked is set again here
            slotProps={{ input: { 'aria-label': t('stacBrowser.showOnMapOf', { title }), 'aria-checked': isPreviewed } }}
          />
        )}
        <Button
          type="text"
          size="small"
          endIcon={<ChevronRightIcon fontSize="small" />}
          data-item-key={itemKey}
          data-action="detail"
          aria-label={t('stacBrowser.detailsOf', { title })}
          onClick={onAction}
        >
          {t('stacBrowser.details')}
        </Button>
      </Box>
    </Box>
  );
});
