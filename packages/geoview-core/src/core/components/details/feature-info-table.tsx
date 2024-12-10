import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import linkifyHtml from 'linkify-html';

import { CardMedia, Box, Grid } from '@/ui';
import { isImage, stringify, generateId, sanitizeHtmlContent } from '@/core/utils/utilities';
import { HtmlToReact } from '@/core/containers/html-to-react';
import { logger } from '@/core/utils/logger';
import { TypeFieldEntry } from '@/geo/map/map-schema-types';
import { getSxClasses } from './details-style';
import { useLightBox } from '@/core/components/common';

interface FeatureInfoTableProps {
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
  index: number;
  onInitLightBox: (value: string, alias: string, index: number) => void;
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
  const sxClasses = getSxClasses(theme);

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
        <HtmlToReact htmlContent={sanitizeHtmlContent(item)} />
      </Box>
    );
  }

  if (typeof item === 'string' && isImage(item)) {
    return (
      <CardMedia
        key={generateId()}
        sx={{ ...sxClasses.featureInfoItemValue, cursor: 'pointer' }}
        alt={`${alias} ${index}`}
        className={`returnLightboxFocusItem-${index}`}
        src={item}
        tabIndex={0}
        onClick={() => onInitLightBox(featureInfoItem.value as string, featureInfoItem.alias, index)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter') {
            onInitLightBox(featureInfoItem.value as string, `${index}_${featureInfoItem.alias}`, index);
          }
        }}
      />
    );
  }

  return (
    <Box key={generateId()} sx={sxClasses.featureInfoItemValue}>
      <HtmlToReact htmlContent={sanitizeHtmlContent(linkifyHtml(stringify(item) as string, linkifyOptions))} />
    </Box>
  );
});

// Extracted FeatureRow component
export const FeatureRow = memo(function FeatureRow({ featureInfoItem, index, onInitLightBox }: FeatureRowProps): JSX.Element {
  const theme = useTheme();
  const { alias, value } = featureInfoItem;

  // Convert value to string, handling arrays and other types
  const stringValue = useMemo((): string => {
    if (Array.isArray(value)) {
      return value.map((item) => stringify(item)).join(';');
    }
    return stringify(value) as string;
  }, [value]);

  // Split text but leave html intact
  const valueArray = alias !== 'html' ? stringValue.split(';') : [stringValue];

  // Generate stable IDs for each item when component mounts
  const itemIds = useMemo(() => valueArray.map(() => generateId()), [valueArray]);

  return (
    <Grid
      container
      spacing={5}
      sx={{
        backgroundColor: index % 2 > 0 ? theme.palette.geoViewColor.bgColor.darken(0.1) : '',
        color: index % 2 > 0 ? theme.palette.geoViewColor.bgColor.darken(0.9) : '',
        marginBottom: '1.25rem',
      }}
    >
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
        {valueArray.map((item: string, idx: number) => (
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

export const FeatureInfoTable = memo(function FeatureInfoTable({ featureInfoList }: FeatureInfoTableProps): JSX.Element {
  logger.logTraceRender('components/details/feature-info-table');

  // Hooks
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Store
  const { initLightBox, LightBoxComponent } = useLightBox();

  // Remove last item who is the internall geoviewID field
  if (featureInfoList[featureInfoList.length - 1].alias === 'geoviewID') featureInfoList.pop();

  return (
    <Box sx={sxClasses.boxContainerFeatureInfo}>
      {featureInfoList.map((featureInfoItem, index) => (
        <FeatureRow
          key={`${featureInfoItem.alias}_${generateId()}`}
          featureInfoItem={featureInfoItem}
          index={index}
          onInitLightBox={initLightBox}
        />
      ))}
      <LightBoxComponent />
    </Box>
  );
});
