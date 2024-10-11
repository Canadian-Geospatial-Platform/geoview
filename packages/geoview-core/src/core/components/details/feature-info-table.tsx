import { useMemo } from 'react';
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

/**
 * Feature info table that creates a table keys/values of the given feature info
 *
 * @param {FeatureInfoTableProps} Feature info table properties
 * @returns {JSX.Element} the layers list
 */
export function FeatureInfoTable({ featureInfoList }: FeatureInfoTableProps): JSX.Element {
  // Log
  logger.logTraceRender('components/details/feature-info-table');

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const { initLightBox, LightBoxComponent } = useLightBox();

  // linkify options
  const linkifyOptions = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DETAILS PANEL - Feature Info table - linkifyOptions');

    return {
      attributes: {
        title: t('details.externalLink'),
      },
      defaultProtocol: 'https',
      format: {
        url: (value: string) => (value.length > 50 ? `${value.slice(0, 40)}…${value.slice(value.length - 10, value.length)}` : value),
      },
      ignoreTags: ['script', 'style', 'img'],
      target: '_blank',
    };
  }, [t]);

  /**
   * Parse the content of the field to see if we need to create an image, a string element or a link
   * @param {TypeFieldEntry} featureInfoItem the field item
   * @returns {JSX.Element | JSX.Element[]} the React element(s)
   */
  function setFeatureItem(featureInfoItem: TypeFieldEntry): JSX.Element | JSX.Element[] {
    function process(item: string, alias: string, index: number): JSX.Element {
      let element: JSX.Element;
      if (typeof item === 'string' && isImage(item)) {
        element = (
          <CardMedia
            key={generateId()}
            sx={{ ...sxClasses.featureInfoItemValue, cursor: 'pointer' }}
            alt={`${alias} ${index}`}
            className={`returnLightboxFocusItem-${index}`}
            src={item}
            tabIndex={0}
            click={() => initLightBox(featureInfoItem.value as string, featureInfoItem.alias, index)}
            keyDown={(e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                initLightBox(featureInfoItem.value as string, featureInfoItem.alias, index);
              }
            }}
          />
        );
      } else {
        element = (
          <Box key={generateId()} sx={sxClasses.featureInfoItemValue}>
            <HtmlToReact htmlContent={sanitizeHtmlContent(linkifyHtml(item, linkifyOptions))} />
          </Box>
        );
      }

      return element;
    }

    const { alias, value } = featureInfoItem;
    let values: string | string[] = Array.isArray(value) ? String(value.map(stringify)) : String(stringify(value));
    values = values.toString().split(';');
    const results = Array.isArray(values)
      ? values.map((item: string, index: number) => process(item, alias, index))
      : process(values, alias, 0);

    return results;
  }

  return (
    <Box sx={sxClasses.boxContainerFeatureInfo}>
      {featureInfoList.map((featureInfoItem, index) => (
        <Grid
          container
          spacing={5}
          sx={{
            backgroundColor: index % 2 > 0 ? theme.palette.geoViewColor.bgColor.darken(0.1) : '',
            color: index % 2 > 0 ? theme.palette.geoViewColor.bgColor.darken(0.9) : '',
            marginBottom: '1.25rem',
          }}
          key={`${featureInfoItem.alias} ${index.toString()}`}
        >
          <Grid size={{ xs: 'auto' }} sx={{ fontWeight: 'bold', width: '80% !important' }}>
            {featureInfoItem.alias}
          </Grid>
          <Grid sx={{ ml: 'auto', wordWrap: 'break-word', pr: '0.3125rem' }}>{setFeatureItem(featureInfoItem)}</Grid>
        </Grid>
      ))}
      <LightBoxComponent />
    </Box>
  );
}
