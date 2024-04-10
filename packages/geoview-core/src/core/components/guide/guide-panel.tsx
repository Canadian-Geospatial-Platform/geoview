import React, { useState, ReactNode, useEffect } from 'react';
import Markdown from 'markdown-to-jsx';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box } from '@/ui';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useAppDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';

import { getSxClasses } from './guide-style';
import { LayerListEntry, Layout } from '@/core/components/common';
import { useFetchAndParseMarkdown } from './custom-hook';

type renderedMarkdownFileType = Record<string, string>;

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
  const mapId = useGeoViewMapId();
  const language = useAppDisplayLanguage();

  const [selectedLayerPath, setSelectedLayerPath] = useState<string>('');
  const [guideItemIndex, setGuideItemIndex] = useState<number>(0);
  const [leftPanelHelpItems, setLeftPanelHelpItems] = useState<renderedMarkdownFileType | null>(null);

  // fetch the content of general guide items with custom hook
  const mdFilePath = `./locales/${language}/guide.md`;
  useFetchAndParseMarkdown(mapId, mdFilePath, t('guide.errorMessage'), setLeftPanelHelpItems);

  const leftPanelItemKeys = leftPanelHelpItems && Object.keys(leftPanelHelpItems);
  const contentOfFooterInRightPanel = leftPanelHelpItems && leftPanelHelpItems['!Footer'];
  // search for matches like %legend%
  const sectionsOfFooters = contentOfFooterInRightPanel?.split(/%([^%]+)%/);

  // example:
  /**
    {
       "legend": "Here is the markdown content of legend"
       "layers": "Here is the markdown content of layers"
    }
   */
  const footerContentKeyValues: Record<string, string> = {};
  if (sectionsOfFooters) {
    if (sectionsOfFooters[0]?.trim() === '') {
      sectionsOfFooters.shift();
    }
    for (let i = 0; i < sectionsOfFooters.length; i += 1) {
      const heading = sectionsOfFooters[i]?.trim();
      const sectionContent = sectionsOfFooters[i + 1]?.trim();
      footerContentKeyValues[heading] = sectionContent;
    }
  }

  // TODO: Check - These 2 constants are probably not what we want, as they'll change on every render. Consider putting them to references or states.
  const helpItems: GuideListItem[] = [];

  leftPanelItemKeys?.forEach((item) => {
    helpItems.push({
      // remove the exclamation mark "!" from layer name that is in MD file
      layerName: item.substring(1),
      layerPath: item,
      layerStatus: 'loaded',
      queryStatus: 'processed',
      content: <Markdown options={{ wrapper: 'article' }}>{(leftPanelHelpItems && leftPanelHelpItems[item]) as string}</Markdown>,
    });
  });

  const handleGuideItemClick = (layer: LayerListEntry) => {
    const index: number = helpItems.findIndex((item) => item.layerName === layer.layerName);
    setGuideItemIndex(index);
    setSelectedLayerPath(layer.layerPath);
  };

  useEffect(() => {
    if (leftPanelHelpItems) {
      // select the first item in left panel
      setSelectedLayerPath(helpItems[0].layerPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftPanelHelpItems]);

  return (
    <Layout
      selectedLayerPath={selectedLayerPath || ''}
      layerList={helpItems}
      onLayerListClicked={handleGuideItemClick}
      fullWidth={fullWidth}
      aria-label={t('guide.title')}
    >
      <Box sx={sxClasses.rightPanelContainer} aria-label={t('guide.title')}>
        <Box sx={sxClasses.guideBox}>{helpItems[guideItemIndex]?.content}</Box>
      </Box>
    </Layout>
  );
}
