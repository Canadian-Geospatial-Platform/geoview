import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import linkifyHtml from 'linkify-html';

import { Box, Button, Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@/ui';
import { isImage, stringify, sanitizeHtmlContent, enhanceLinksAccessibility } from '@/core/utils/utilities';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';
import { useAppDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';
import {
  useLayerDateTemporalMode,
  useLayerDisplayDateFormat,
  useLayerDisplayDateTimezone,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { logger } from '@/core/utils/logger';
import type { TypeDisplayLanguage, TypeFieldEntry } from '@/api/types/map-schema-types';
import type { TypeContainerBox } from '@/core/types/global-types';
import { DateMgt, type TemporalMode, type TimeIANA, type TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import { useLightBox } from '@/core/components/common';
import { getSxClasses } from './details-style';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

interface FeatureInfoTableProps {
  layerPath: string;
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
  onInitLightBox: (images: string, altText: string, returnFocusId: string, index?: number) => void;
}

interface FeatureRowProps {
  featureInfoItem: TypeFieldEntry;
  onInitLightBox: (images: string, altText: string, returnFocusId: string, index?: number) => void;
  language: TypeDisplayLanguage;
  layerDateTemporalMode: TemporalMode;
  displayDateFormat: TypeDisplayDateFormat;
  displayDateTimezone: TimeIANA;
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
        target: '_blank',
        rel: 'noopener noreferrer',
      },
      defaultProtocol: 'https',
      format: {
        url: (value: string) => `${alias || value}`,
      },
      ignoreTags: ['script', 'style', 'img'],
    }),
    [alias]
  );

  if (alias === 'html') {
    return (
      <Box sx={sxClasses.featureInfoItemValue}>
        <UseHtmlToReact htmlContent={sanitizeHtmlContent(item)} />
      </Box>
    );
  }

  if (typeof item === 'string' && isImage(item)) {
    const buttonElementId = `${mapId}-${containerType}-image-btn-${uniqueItemId}`; // Create unique ID for focus management after lightbox closes

    return (
      <Button
        type="icon"
        sx={sxClasses.imageButton}
        id={buttonElementId}
        onClick={() => onInitLightBox(featureInfoItem.value as string, '', buttonElementId, index)}
        tooltip={t('general.enlargeImage')!} // Tooltip for visual users to indicate the image can be enlarged
        tooltipPlacement="top"
        aria-label={t('general.enlargeImageName', { title: index === 0 ? alias : `${alias} ${index + 1}` })!} // WCAG - Descriptive aria-label for screen readers
        disableRipple
      >
        <Box
          src={item}
          component="img"
          sx={sxClasses.featureInfoItemImage}
          alt="" // WCAG - Using empty alt text for images as descriptive text is not available
        />
      </Button>
    );
  }

  return (
    <Box sx={sxClasses.featureInfoItemValue}>
      <UseHtmlToReact
        htmlContent={sanitizeHtmlContent(
          enhanceLinksAccessibility(linkifyHtml(item.toString(), linkifyOptions), t('general.opensInNewTab'))
        )}
      />
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
  containerType,
}: FeatureRowProps): JSX.Element {
  const mapId = useGeoViewMapId();
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

  // Generate stable deterministic IDs for each item: {fieldKey}-{index}
  // Using fieldKey and index ensures IDs remain stable across re-renders
  // Full ID format will be: {mapId}-{containerType}-{elementType}-{fieldKey}-{index}
  const itemIds = useMemo(
    () => stringValues.map((_, idx) => `${featureInfoItem.fieldKey}-${idx}`),
    [stringValues, featureInfoItem.fieldKey]
  );

  return (
    <TableRow className="feature-info-row" sx={sxClasses.featureInfoRow}>
      {featureInfoItem.alias !== 'html' ? (
        <>
          <TableCell
            component="th"
            scope="row"
            sx={{
              fontWeight: 'bold',
              width: '50%',
              verticalAlign: 'top',
            }}
          >
            {alias}
          </TableCell>
          <TableCell
            sx={{
              wordWrap: 'break-word',
              paddingRight: '0.3125rem',
            }}
          >
            {stringValues.map((item: string, idx: number) => (
              <FeatureItem
                key={`${alias}-${itemIds[idx]}`}
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
          </TableCell>
        </>
      ) : (
        <TableCell
          colSpan={2}
          sx={{
            wordWrap: 'break-word',
            paddingRight: '0.3125rem',
          }}
        >
          {stringValues.map((item: string, idx: number) => (
            <FeatureItem
              key={`${alias}-${itemIds[idx]}`}
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
        </TableCell>
      )}
    </TableRow>
  );
});

export const FeatureInfoTable = memo(function FeatureInfoTable({
  layerPath,
  featureInfoList,
  containerType,
}: FeatureInfoTableProps): JSX.Element {
  logger.logTraceRender('components/details/feature-info-table');

  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store hooks
  const language = useAppDisplayLanguage();
  const layerDateTemporalMode = useLayerDateTemporalMode(layerPath);
  const displayDateFormat = useLayerDisplayDateFormat(layerPath);
  const displayDateTimezone = useLayerDisplayDateTimezone(layerPath);

  // Store
  const { initLightBox, LightBoxComponent } = useLightBox();

  // Remove last item who is the internal geoviewID field
  if (featureInfoList.length > 0 && featureInfoList[featureInfoList.length - 1].alias === 'geoviewID') featureInfoList.pop();

  return (
    <>
      <TableContainer className="details-feature-info-table" sx={sxClasses.boxContainerFeatureInfo}>
        <Table aria-label={t('details.featureInfoTable')!}>
          <TableHead sx={sxClasses.visuallyHidden}>
            <TableRow>
              <TableCell component="th" scope="col">
                {t('details.featureInfoTableField')}
              </TableCell>
              <TableCell component="th" scope="col">
                {t('details.featureInfoTableValue')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {featureInfoList.map((featureInfoItem) => (
              <FeatureRow
                key={`${layerPath}-${featureInfoItem.fieldKey}`}
                featureInfoItem={featureInfoItem}
                language={language}
                layerDateTemporalMode={layerDateTemporalMode}
                displayDateFormat={displayDateFormat}
                displayDateTimezone={displayDateTimezone}
                onInitLightBox={initLightBox}
                containerType={containerType}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <LightBoxComponent />
    </>
  );
});
