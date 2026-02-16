import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import linkifyHtml from 'linkify-html';

import { CardMedia, Box, Grid } from '@/ui';
import { isImage, stringify, generateId, sanitizeHtmlContent } from '@/core/utils/utilities';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';
import { logger } from '@/core/utils/logger';
import type { TypeFieldEntry } from '@/api/types/map-schema-types';
import type { TypeContainerBox } from '@/core/types/global-types';
import { getSxClasses } from './details-style';
import { useLightBox } from '@/core/components/common';
import { Button } from '@/ui/button/button';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

interface FeatureInfoTableProps {
  featureInfoList: TypeFieldEntry[];
  containerType: TypeContainerBox;
}

interface FeatureItemProps {
  item: string;
  alias: string;
  index: number;
  uniqueItemId: string;
  mapId: string;
  containerType: TypeContainerBox;
  featureInfoItem: TypeFieldEntry;
  onInitLightBox: (value: string, elementId: string, index: number) => void;
}

interface FeatureRowProps {
  featureInfoItem: TypeFieldEntry;
  onInitLightBox: (value: string, elementId: string, index: number) => void;
  mapId: string;
  containerType: TypeContainerBox;
}

// Extracted FeatureItem component
export const FeatureItem = memo(function FeatureItem({
  item,
  alias,
  index,
  uniqueItemId,
  mapId,
  containerType,
  featureInfoItem,
  onInitLightBox,
}: FeatureItemProps): JSX.Element {
  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  const linkifyOptions = useMemo(
    () => ({
      attributes: {
        title: t('details.externalLink'),
      },
      defaultProtocol: 'https',
      format: {
        url: (value: string) => (value.length > 50 ? `${value.slice(0, 40)}…${value.slice(value.length - 10)}` : value),
      },
      ignoreTags: ['script', 'style', 'img'],
      target: '_blank',
    }),
    [t]
  );

  if (alias === 'html') {
    return (
      <Box key={generateId()} sx={sxClasses.featureInfoItemValue}>
        <UseHtmlToReact htmlContent={sanitizeHtmlContent(item)} />
      </Box>
    );
  }

  if (typeof item === 'string' && isImage(item)) {
    const imageElementId = `${mapId}-${containerType}-img-${uniqueItemId}`;
    const buttonElementId = `${mapId}-${containerType}-btn-${uniqueItemId}`;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '5px' }}>
        <CardMedia
          key={generateId()}
          id={imageElementId}
          sx={{ ...sxClasses.featureInfoItemValue, cursor: 'pointer' }}
          alt={`${alias} ${index}`}
          src={item}
          tabIndex={0}
          title={t('general.clickEnlarge')!}
          onClick={() => onInitLightBox(featureInfoItem.value as string, imageElementId, index)}
          onKeyDown={(event: React.KeyboardEvent) => {
            if (event.key === 'Enter') {
              onInitLightBox(featureInfoItem.value as string, imageElementId, index);
            }
          }}
        />
        <Button
          id={buttonElementId}
          type="text"
          sx={{ fontSize: theme.palette.geoViewFontSize.xs }}
          onClick={() => onInitLightBox(featureInfoItem.value as string, buttonElementId, index)}
        >
          {t('general.clickEnlarge')!}
        </Button>
      </Box>
    );
  }

  return (
    <Box key={generateId()} sx={sxClasses.featureInfoItemValue}>
      <UseHtmlToReact htmlContent={sanitizeHtmlContent(linkifyHtml(item.toString(), linkifyOptions))} />
    </Box>
  );
});

// Extracted FeatureRow component
export const FeatureRow = memo(function FeatureRow({
  featureInfoItem,
  onInitLightBox,
  mapId,
  containerType,
}: FeatureRowProps): JSX.Element {
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const { alias, value } = featureInfoItem;

  // Get the original value in an array - properly memoized
  const stringValues = useMemo(() => {
    if (value === undefined) return [''];

    // TODO: Solidify this logic - currently using ';http' to guess if value contains semicolon-delimited images.
    // TO.DOCONT: This is rough and could falsely trigger on HTML or other content containing ';http' patterns.
    // If the value contains an array of images
    if (typeof value === 'string' && String(value).includes?.(';http')) {
      // Stringify values and create array of string to split item with ';' to separate images
      const stringValue: string = Array.isArray(value) ? String(value.map(stringify)) : String(stringify(value));
      return stringValue.split(';');
    }

    return [String(value)];
  }, [value]);

  // Generate stable deterministic IDs for each item: {fieldKey}-{index}
  // Using fieldKey and index ensures IDs remain stable across re-renders
  // Full ID format will be: {mapId}-{containerType}-{elementType}-{fieldKey}-{index}
  const itemIds = useMemo(
    () => stringValues.map((_, idx) => `${featureInfoItem.fieldKey}-${idx}`),
    [stringValues, featureInfoItem.fieldKey]
  );

  return (
    <Grid container spacing={5} className="feature-info-row" sx={sxClasses.featureInfoRow}>
      {featureInfoItem.alias !== 'html' && (
        <Grid
          sx={{
            fontWeight: 'bold',
            width: '80%',
            flexGrow: 0,
            maxWidth: 'none',
            flexBasis: 'auto',
          }}
        >
          {alias}
        </Grid>
      )}
      <Grid
        sx={{
          marginLeft: 'auto',
          wordWrap: 'break-word',
          paddingRight: '0.3125rem',
          flexGrow: 1,
        }}
      >
        {stringValues.map((item: string, idx: number) => (
          <FeatureItem
            key={`${alias}_${itemIds[idx]}`}
            item={item}
            alias={alias}
            index={idx}
            uniqueItemId={itemIds[idx]}
            mapId={mapId}
            containerType={containerType}
            featureInfoItem={featureInfoItem}
            onInitLightBox={onInitLightBox}
          />
        ))}
      </Grid>
    </Grid>
  );
});

export const FeatureInfoTable = memo(function FeatureInfoTable({ featureInfoList, containerType }: FeatureInfoTableProps): JSX.Element {
  logger.logTraceRender('components/details/feature-info-table');

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  const mapId = useGeoViewMapId();
  const { initLightBox, LightBoxComponent } = useLightBox();

  // Remove last item who is the internal geoviewID field
  if (featureInfoList.length > 0 && featureInfoList[featureInfoList.length - 1].alias === 'geoviewID') featureInfoList.pop();

  return (
    <Box className="details-feature-info-table" sx={sxClasses.boxContainerFeatureInfo}>
      {featureInfoList.map((featureInfoItem) => (
        <FeatureRow
          key={`${featureInfoItem.alias}_${generateId()}`}
          featureInfoItem={featureInfoItem}
          onInitLightBox={initLightBox}
          mapId={mapId}
          containerType={containerType}
        />
      ))}
      <LightBoxComponent />
    </Box>
  );
});
