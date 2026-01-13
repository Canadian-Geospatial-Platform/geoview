import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import linkifyHtml from 'linkify-html';

import { CardMedia, Box, Grid } from '@/ui';
import { isImage, stringify, generateId, sanitizeHtmlContent } from '@/core/utils/utilities';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';
import { useAppDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';
import {
  useLayerDateTemporalMode,
  useLayerDisplayDateFormat,
  useLayerDisplayDateTimezone,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { logger } from '@/core/utils/logger';
import type { TypeDisplayLanguage, TypeFieldEntry } from '@/api/types/map-schema-types';
import { DateMgt, type TemporalMode, type TimeIANA, type TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import { useLightBox } from '@/core/components/common';
import { Button } from '@/ui/button/button';
import { getSxClasses } from './details-style';

interface FeatureInfoTableProps {
  layerPath: string;
  featureInfoList: TypeFieldEntry[];
}

interface FeatureItemProps {
  item: string;
  alias: string;
  index: number;
  featureInfoItem: TypeFieldEntry;
  onInitLightBox: (value: string, alias: string, index: number) => void;
}

interface FeatureRowProps {
  featureInfoItem: TypeFieldEntry;
  onInitLightBox: (value: string, alias: string, index: number) => void;
  language: TypeDisplayLanguage;
  layerDateTemporalMode: TemporalMode;
  displayDateFormat: TypeDisplayDateFormat;
  displayDateTimezone: TimeIANA;
}

// Extracted FeatureItem component
export const FeatureItem = memo(function FeatureItem({
  item,
  alias,
  index,
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
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '5px' }}>
        <CardMedia
          key={generateId()}
          sx={{ ...sxClasses.featureInfoItemValue, cursor: 'pointer' }}
          alt={`${alias} ${index}`}
          className={`returnLightboxFocusItem-${index}`}
          src={item}
          tabIndex={0}
          title={t('general.clickEnlarge')!}
          onClick={() => onInitLightBox(featureInfoItem.value as string, featureInfoItem.alias, index)}
          onKeyDown={(event: React.KeyboardEvent) => {
            if (event.key === 'Enter') {
              onInitLightBox(featureInfoItem.value as string, `${index}_${featureInfoItem.alias}`, index);
            }
          }}
        />
        <Button
          type="text"
          sx={{ fontSize: theme.palette.geoViewFontSize.xs }}
          onClick={() => onInitLightBox(featureInfoItem.value as string, featureInfoItem.alias, index)}
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
  language,
  layerDateTemporalMode,
  displayDateFormat,
  displayDateTimezone,
}: FeatureRowProps): JSX.Element {
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const { alias, value } = featureInfoItem;

  // Get the original value in an array
  let stringValues = useMemo(() => [''], []);
  if (value !== undefined) {
    stringValues = [String(value)];
  }

  // TODO: Check - Solidify this logic. I'm adding an attempt to guess the value content is a list of images before proceeding with
  // TO.DOCONT: the logic with the ';' here. It's rough, but it's an improvement. Originally it was not checking at all what the
  // TO.DOCONT: content was and was doing it on everything, including html content and such!
  // If the value contains an array of images
  if (typeof value === 'string' && String(value).includes?.(';http')) {
    // Stringify values and create array of string to split item with ';' to separate images
    const stringValue: string = Array.isArray(value) ? String(value.map(stringify)) : String(stringify(value));
    stringValues = stringValue.split(';');
  } else if (value instanceof Date) {
    // The value is a date, format it
    stringValues = [DateMgt.formatDate(value, displayDateFormat[language], language, displayDateTimezone, layerDateTemporalMode)];
  }

  // Generate stable IDs for each item when component mounts
  const itemIds = useMemo(() => stringValues.map(() => generateId()), [stringValues]);

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
            featureInfoItem={featureInfoItem}
            onInitLightBox={onInitLightBox}
          />
        ))}
      </Grid>
    </Grid>
  );
});

export const FeatureInfoTable = memo(function FeatureInfoTable({ layerPath, featureInfoList }: FeatureInfoTableProps): JSX.Element {
  logger.logTraceRender('components/details/feature-info-table');

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store hooks
  const language = useAppDisplayLanguage();
  const layerDateTemporalMode = useLayerDateTemporalMode(layerPath);
  const displayDateFormat = useLayerDisplayDateFormat(layerPath);
  const displayDateTimezone = useLayerDisplayDateTimezone(layerPath);

  // Store
  const { initLightBox, LightBoxComponent } = useLightBox();

  // Remove last item who is the internall geoviewID field
  if (featureInfoList.length > 0 && featureInfoList[featureInfoList.length - 1].alias === 'geoviewID') featureInfoList.pop();

  return (
    <Box className="details-feature-info-table" sx={sxClasses.boxContainerFeatureInfo}>
      {featureInfoList.map((featureInfoItem) => (
        <FeatureRow
          key={`${featureInfoItem.alias}_${generateId()}`}
          featureInfoItem={featureInfoItem}
          language={language}
          layerDateTemporalMode={layerDateTemporalMode}
          displayDateFormat={displayDateFormat}
          displayDateTimezone={displayDateTimezone}
          onInitLightBox={initLightBox}
        />
      ))}
      <LightBoxComponent />
    </Box>
  );
});
