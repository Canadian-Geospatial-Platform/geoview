import { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import linkifyHtml from 'linkify-html';

import { TypeFieldEntry } from '@/api/events/payloads';
import { LightboxImg, LightBoxSlides } from '@/core/components/lightbox/lightbox';
import { CardMedia, Box, Grid } from '@/ui';
import { isImage, stringify, generateId, sanitizeHtmlContent } from '@/core/utils/utilities';
import { HtmlToReact } from '@/core/containers/html-to-react';
import { getSxClasses } from './details-style';

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
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const [isLightBoxOpen, setIsLightBoxOpen] = useState(false);
  const [slides, setSlides] = useState<LightBoxSlides[]>([]);
  const [slidesIndex, setSlidesIndex] = useState(0);

  // linkify options
  const linkifyOptions = {
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

  /**
   * Parse the content of the field to see if we need to create an image, a string element or a link
   * @param {TypeFieldEntry} featureInfoItem the field item
   * @returns {JSX.Element | JSX.Element[]} the React element(s)
   */
  function setFeatureItem(featureInfoItem: TypeFieldEntry): JSX.Element | JSX.Element[] {
    const slidesSetup: LightBoxSlides[] = [];

    function process(item: string, alias: string, index: number): JSX.Element {
      let element: JSX.Element;
      if (typeof item === 'string' && isImage(item)) {
        slidesSetup.push({ src: item, alt: alias, downloadUrl: item });
        element = (
          <CardMedia
            key={generateId()}
            sx={{ ...sxClasses.featureInfoItemValue, cursor: 'pointer' }}
            alt={alias}
            src={item}
            tabIndex={0}
            click={() => {
              setIsLightBoxOpen(true);
              setSlides(slidesSetup);
              setSlidesIndex(index);
            }}
            keyDown={(e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                setIsLightBoxOpen(true);
                setSlides(slidesSetup);
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
      {isLightBoxOpen && (
        <LightboxImg
          open={isLightBoxOpen}
          slides={slides}
          index={slidesIndex}
          exited={() => {
            // TODO: because lighbox element is render outside the map container, the focus trap is not able to access it.
            // TODO: if we use the keyboard to access the image, we can only close with esc key.
            // TODO: #1113
            setIsLightBoxOpen(false);
            setSlides([]);
          }}
        />
      )}
      {featureInfoList.map((featureInfoItem, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Grid container spacing={5} sx={{ backgroundColor: index % 2 > 0 ? '#F1F2F5' : '', marginBottom: '20px' }} key={index}>
          <Grid item xs="auto" sx={{ fontWeight: 'bold' }}>
            {featureInfoItem.alias}
          </Grid>
          <Grid item sx={{ ml: 'auto', wordWrap: 'break-word' }}>
            {setFeatureItem(featureInfoItem)}
          </Grid>
        </Grid>
      ))}
    </Box>
  );
}
