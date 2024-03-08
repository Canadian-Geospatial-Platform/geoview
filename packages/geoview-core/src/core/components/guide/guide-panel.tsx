import React, { useState, ReactNode, memo, useEffect } from 'react';
import Markdown from 'markdown-to-jsx';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box, List, ListItem } from '@/ui';
import { useGeoViewConfig, useGeoViewMapId } from '@/core/stores/geoview-store';
import { TypeValidFooterBarTabsCoreProps } from '@/geo/map/map-schema-types';

import { getSxClasses } from './guide-style';
import { LayerListEntry, Layout } from '../common';
import { useFetchAndParseMarkdown } from './custom-hook';

type renderedMarkdownFileType = Record<string, string>;

interface GuideListItem extends LayerListEntry {
  content: string | ReactNode;
}

interface GuidePanelType {
  // eslint-disable-next-line react/require-default-props
  fullWidth?: boolean;
}

type RenderFooterContentProps = {
  footerContenKeys: string[];
  footerContentKeyValues: Record<string, string>;
  allTabs: TypeValidFooterBarTabsCoreProps | undefined;
};

// TODO: refactor - can we get rid of the warning?
// eslint-disable-next-line react/display-name
const RenderFooterContentInRightPanel = memo(({ footerContenKeys, footerContentKeyValues, allTabs }: RenderFooterContentProps) => {
  return (
    <List>
      {footerContenKeys
        .filter((footerKey) => allTabs?.includes(footerKey as TypeValidFooterBarTabsCoreProps[number]))
        .map((footerKey) => {
          return (
            <ListItem key={footerKey}>
              <Markdown options={{ wrapper: 'article' }}>{footerContentKeyValues[footerKey]}</Markdown>
            </ListItem>
          );
        })}
    </List>
  );
});

export function GuidePanel({ fullWidth }: GuidePanelType): JSX.Element {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const mapId = useGeoViewMapId();

  const [selectedLayerPath, setSelectedLayerPath] = useState<string>('');
  const [guideItemIndex, setGuideItemIndex] = useState<number>(0);
  const [leftPanelHelpItems, setLeftPanelHelpItems] = useState<renderedMarkdownFileType | null>(null);

  // get store config for footer bar
  const footerBarConfig = useGeoViewConfig()?.footerBar;
  const appbarConfig = useGeoViewConfig()?.appBar;
  const allTabs: TypeValidFooterBarTabsCoreProps | undefined =
    footerBarConfig?.tabs.core || (appbarConfig?.tabs.core as unknown as TypeValidFooterBarTabsCoreProps);

  // fetch the content of general guide items with custom hook
  const mdFilePath = './locales/markdown/general-content.md';
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
  const footerContenKeys = Object.keys(footerContentKeyValues);
  const helpItems: GuideListItem[] = [];

  leftPanelItemKeys?.forEach((item) => {
    // TODO review to see if we can change this logic to make it more reusable
    if (item !== '!Footer') {
      helpItems.push({
        // remove the exclamation mark "!" from layer name that is in MD file
        layerName: item.substring(1),
        layerPath: item,
        layerStatus: 'loaded',
        queryStatus: 'processed',
        content: <Markdown options={{ wrapper: 'article' }}>{(leftPanelHelpItems && leftPanelHelpItems[item]) as string}</Markdown>,
      });
    } else {
      // we hit footer content now
      helpItems.push({
        layerName: 'Footer',
        layerPath: '!footer',
        layerStatus: 'loaded',
        queryStatus: 'processed',
        content: <RenderFooterContentInRightPanel {...{ footerContenKeys, footerContentKeyValues, allTabs }} />,
      });
    }
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
    >
      <Box sx={sxClasses.rightPanelContainer}>
        <Box sx={{ ml: '30px', mb: '18px' }}>{helpItems[guideItemIndex]?.content}</Box>
      </Box>
    </Layout>
  );
}
