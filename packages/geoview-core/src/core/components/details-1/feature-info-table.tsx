import React, { useState } from 'react';
import linkifyHtml from 'linkify-html';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';
import { TypeFieldEntry } from '@/api/events/payloads';
import { LightboxImg, LightBoxSlides } from '../lightbox/lightbox';
import { CardMedia, Box } from '@/ui';

import { isImage, stringify, generateId, sanitizeHtmlContent } from '../../utils/utilities';
import { HtmlToReact } from '../../containers/html-to-react';

interface FeatureInfoTableProps {
  featureInfoList: TypeFieldEntry[];
}

const getSxClasses = (isOdd = true, isFeatureImage = false) => {
  return {
    featureInfoItemValue: {
      fontSize: '0.85em',
      marginRight: 0,
      marginTop: '5px',
      wordBreak: 'break-word',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      ...(isFeatureImage && { cursor: 'pointer' }),
    },
    featureTableRow: {
      ...(isOdd && { backgroundColor: '#F1F2F5' }),
    },
  };
};

/**
 * Feature info table that creates a table keys/values of the given feature info
 *
 * @param {FeatureInfoTableProps} Feature info table properties
 * @returns {JSX.Element} the layers list
 */
export function FeatureInfoTable({ featureInfoList }: FeatureInfoTableProps): JSX.Element {
  const { t } = useTranslation<string>();
  const [isLightBoxOpen, setIsLightBoxOpen] = useState(false);
  const [slides, setSlides] = useState<LightBoxSlides[]>([]);
  const [slidesIndex, setSlidesIndex] = useState(0);

  // linkify options
  const linkifyOptions = {
    attributes: {
      title: t('details.external_link'),
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
            sx={getSxClasses(true, true).featureInfoItemValue}
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
          <Box key={generateId()} sx={getSxClasses().featureInfoItemValue}>
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
    <TableContainer sx={{ backgroundColor: '#FFFFFF' }}>
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
      <Table
        sx={{
          border: '1px solid #BDBDBD',
          minWidth: 300,
        }}
      >
        <TableBody>
          {featureInfoList.map((featureInfoItem, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <TableRow key={index} sx={getSxClasses(index % 2 > 0).featureTableRow}>
              <TableCell
                sx={{
                  borderRight: '1px solid #BDBDBD',
                  p: '5px',
                  width: '70%',
                }}
              >
                {featureInfoItem.alias}
              </TableCell>
              <TableCell
                sx={{
                  p: '5px',
                  textAlign: 'start',
                }}
              >
                {setFeatureItem(featureInfoItem)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
