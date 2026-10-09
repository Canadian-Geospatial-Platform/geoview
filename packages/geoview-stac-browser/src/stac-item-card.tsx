import { memo } from 'react';

import type { SxProps, SxStyles } from 'geoview-core/ui/style/types';
import { Box, Button, Checkbox, Typography } from 'geoview-core/ui';
import { ChevronRightIcon, MapIcon, VisibilityIcon, ZoomInSearchIcon } from 'geoview-core/ui/icons';
import { logger } from 'geoview-core/core/utils/logger';
import { useTranslation } from 'geoview-core/core/translation/i18n';

import type { StacItem, StacItemDisplayOptions } from './stac-browser-types';
import { StacAssetUtils } from './stac-asset-utils';
import { resolveStacItemDisplayOptions } from './stac-config-utils';
import { StacFieldUtils } from './stac-field-utils';

/** Props for the StacItemCard component. */
interface StacItemCardProps {
  /** The STAC item to display. */
  item: StacItem;
  /** Display options shared by all cards. */
  display: StacItemDisplayOptions;
  /** Color of the item when selected, undefined when not selected. */
  selectedColor?: string;
  /** Whether the item is previewed on the map. */
  isPreviewed: boolean;
  /** The sx classes object. */
  sxClasses: SxStyles;
  /** Callback when the selection checkbox changes; the item id is the checkbox name. */
  onToggleSelected: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Callback for the map/detail actions; the item id and action are read from data-item-id and data-action. */
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

  const { item, display, selectedColor, isPreviewed, sxClasses, onToggleSelected, onAction } = props;
  const effectiveDisplay = resolveStacItemDisplayOptions(display, item.collection);
  const { itemView, actions } = effectiveDisplay;
  const { t } = useTranslation();

  const title = StacFieldUtils.getTitle(item, itemView?.titleField);
  const thumbnailUrl = StacAssetUtils.getThumbnailUrl(item);
  const badge = StacAssetUtils.getAssetTypeBadge(item);
  const datetime = item.properties.datetime ?? item.properties.start_datetime;
  const canZoom = actions?.zoom !== false && !!StacFieldUtils.getBbox(item);
  const canPreview =
    effectiveDisplay.isPreviewEnabled && actions?.showOnMap !== false && !!StacAssetUtils.getPreviewAsset(item, effectiveDisplay.preview);

  return (
    <Box component="li" sx={[sxClasses.itemCard, !!selectedColor && { borderLeftColor: selectedColor }] as SxProps}>
      <Box sx={sxClasses.itemCardHeader}>
        <Checkbox
          name={item.id}
          checked={!!selectedColor}
          onChange={onToggleSelected}
          size="small"
          sx={[sxClasses.itemCheckbox, !!selectedColor && { '&.Mui-checked': { color: selectedColor } }] as SxProps}
          slotProps={{ input: { 'aria-label': t('stacBrowser.selectItem', { title }) } }}
        />
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
              {!itemView?.summaryFields?.length && datetime ? new Date(datetime).toLocaleDateString() : ''}
            </Typography>
          )}
          {!!itemView?.summaryFields?.length && (
            <Box sx={sxClasses.itemSummary}>
              {itemView.summaryFields.map((field) => {
                const value = StacFieldUtils.getFormattedValue(item, field);
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
            data-item-id={item.id}
            data-action="zoom"
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
            data-item-id={item.id}
            data-action="preview"
            onClick={onAction}
            aria-pressed={isPreviewed}
            sx={isPreviewed ? sxClasses.itemActionActive : undefined}
          >
            {isPreviewed ? t('stacBrowser.hideFromMap') : t('stacBrowser.showOnMap')}
          </Button>
        )}
        <Button
          type="text"
          size="small"
          endIcon={<ChevronRightIcon fontSize="small" />}
          data-item-id={item.id}
          data-action="detail"
          onClick={onAction}
        >
          {t('stacBrowser.details')}
        </Button>
      </Box>
    </Box>
  );
});
