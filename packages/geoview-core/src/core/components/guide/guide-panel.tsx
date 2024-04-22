import React, { useState, ReactNode, useMemo, useCallback } from 'react';
import Markdown from 'markdown-to-jsx';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box } from '@/ui';
import { TypeGuideObject, useAppGuide } from '@/core/stores/store-interface-and-intial-values/app-state';

import { getSxClasses } from './guide-style';
import { LayerListEntry, Layout } from '@/core/components/common';

interface GuideListItem extends LayerListEntry {
  content: string | ReactNode;
}

interface GuidePanelType {
  // eslint-disable-next-line react/require-default-props
  fullWidth?: boolean;
}

export function GuidePanel({ fullWidth }: GuidePanelType): JSX.Element {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const guide = useAppGuide();

  const [selectedLayerPath, setSelectedLayerPath] = useState<string>('');
  const [guideItemIndex, setGuideItemIndex] = useState<number>(0);

  /**
   * Get Layer list with markdown content.
   */
  const getListOfGuides = useCallback((): GuideListItem[] => {
    if (!guide) {
      return [];
    }
    return Object.keys(guide).map((item: string) => {
      let { content } = guide[item];

      // Appends the subsection content to the section content
      if (guide[item].children) {
        Object.keys(guide[item].children as TypeGuideObject).forEach((child: string) => {
          content += `\n${guide[item]!.children![child].content}`;

          // Appends sub subsection content
          if (guide[item]!.children![child].children) {
            Object.keys(guide[item]!.children![child].children as TypeGuideObject).forEach((grandChild: string) => {
              content += `\n${guide[item]!.children![child].children![grandChild].content}`;
            });
          }
        });
      }
      return {
        layerName: guide[item].heading,
        layerPath: item,
        layerStatus: 'loaded',
        queryStatus: 'processed',
        content: <Markdown options={{ wrapper: 'article' }}>{content}</Markdown>,
      };
    });
  }, [guide]);

  /**
   * Memo version of layer list with markdown content
   */
  const layersList = useMemo(() => {
    return getListOfGuides();
  }, [getListOfGuides]);

  /**
   * Handle Guide layer list.
   * @param {LayerListEntry} layer geoview layer.
   */
  const handleGuideItemClick = (layer: LayerListEntry): void => {
    const index: number = layersList.findIndex((item) => item.layerName === layer.layerName);
    setGuideItemIndex(index);
    setSelectedLayerPath(layer.layerPath);
  };

  return (
    <Layout
      selectedLayerPath={selectedLayerPath || ''}
      layerList={layersList}
      onLayerListClicked={handleGuideItemClick}
      fullWidth={fullWidth}
      aria-label={t('guide.title')}
    >
      <Box sx={sxClasses.rightPanelContainer} aria-label={t('guide.title')} className="guidebox-container">
        <Box sx={sxClasses.guideBox}>{layersList[guideItemIndex]?.content}</Box>
      </Box>
    </Layout>
  );
}
