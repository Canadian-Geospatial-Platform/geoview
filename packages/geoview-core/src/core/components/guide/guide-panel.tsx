import React, { useState, ReactNode, useEffect } from 'react';
import Markdown from 'markdown-to-jsx';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box } from '@/ui';
import { useAppGuide } from '@/core/stores/store-interface-and-intial-values/app-state';

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
  const [layersList, setLayersList] = useState<GuideListItem[]>([]);

  useEffect(() => {
    const helpItems: GuideListItem[] = [];

    if (guide !== undefined) {
      Object.keys(guide).forEach((item: string) => {
        helpItems.push({
          layerName: guide[item].heading,
          layerPath: item,
          layerStatus: 'loaded',
          queryStatus: 'processed',
          content: <Markdown options={{ wrapper: 'article' }}>{guide[item].content as string}</Markdown>,
        });
      });
      setSelectedLayerPath(helpItems[0].layerPath);
      setLayersList(helpItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGuideItemClick = (layer: LayerListEntry) => {
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
      <Box sx={sxClasses.rightPanelContainer} aria-label={t('guide.title')}>
        <Box sx={sxClasses.guideBox}>{layersList[guideItemIndex]?.content}</Box>
      </Box>
    </Layout>
  );
}
