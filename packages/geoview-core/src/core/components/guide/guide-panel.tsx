/* eslint-disable react/require-default-props */
import React, { useState, useCallback, ReactNode, memo } from 'react';
import Markdown from 'markdown-to-jsx';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { getSxClasses } from './guide-style';
import { Box, List, ListItem } from '@/ui';
import { useGeoViewMapId } from '@/app';
import { ResponsiveGrid, CloseButton, EnlargeButton, LayerList, LayerTitle, useFooterPanelHeight, LayerListEntry } from '../common';
import { useFetchAndParseMarkdown } from './custom-hook';

import { useGeoViewConfig } from '@/core/stores/geoview-store';
import { TypeFooterBarProps } from '@/geo/map/map-schema-types';

type coreTabsType = TypeFooterBarProps['tabs']['core'];
type renderedMarkdownFileType = Record<string, string>;

interface guideListItems extends LayerListEntry {
  content: string | ReactNode;
}

type RenderFooterContentProps = {
  footerContenKeys: string[];
  footerContentKeyValues: Record<string, string>;
  allTabs: coreTabsType | undefined;
};

// eslint-disable-next-line react/display-name
const RenderFooterContentInRightPanel = memo(({ footerContenKeys, footerContentKeyValues, allTabs }: RenderFooterContentProps) => {
  return (
    <List>
      {footerContenKeys.map((footerKey: string) => {
        return (
          allTabs?.includes(footerKey as coreTabsType[number]) && (
            <ListItem key={footerKey}>
              <Markdown options={{ wrapper: 'article' }}>{footerContentKeyValues[footerKey]}</Markdown>
            </ListItem>
          )
        );
      })}
    </List>
  );
});

export function GuidePanel(): JSX.Element {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const mapId = useGeoViewMapId();

  const [guideItemIndex, setGuideItemIndex] = useState<number>(0);
  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
  const [isEnlargeDataTable, setIsEnlargeDataTable] = useState(false);
  const [leftPanelHelpItems, setLeftPanelHelpItems] = useState<renderedMarkdownFileType | null>(null);

  // Custom hook for calculating the height of footer panel
  const { leftPanelRef, rightPanelRef, panelTitleRef } = useFooterPanelHeight({ footerPanelTab: 'details' });

  // get store config for footer tabs
  const footerTabsConfig = useGeoViewConfig()?.footerBar;
  const allTabs: coreTabsType | undefined = footerTabsConfig?.tabs.core;

  // fetch the content of general guide items with custom hook
  useFetchAndParseMarkdown(mapId, '/geoview/locales/markdown/general-content.md', t('guide.errorMessage'), setLeftPanelHelpItems);

  const leftPanelItemKeys = leftPanelHelpItems && Object.keys(leftPanelHelpItems);
  const contentOfFooterInRightPanel = leftPanelHelpItems?.Footer;
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
    for (let i = 0; i < sectionsOfFooters.length; i += 2) {
      const heading = sectionsOfFooters[i]?.trim();
      const sectionContent = sectionsOfFooters[i + 1]?.trim();
      footerContentKeyValues[heading] = sectionContent;
    }
  }

  // [legend, layers, ...]
  const footerContenKeys = Object.keys(footerContentKeyValues);
  const helpItems: guideListItems[] = [];

  leftPanelItemKeys?.forEach((item) => {
    if (item !== 'Footer') {
      helpItems.push({
        layerName: item,
        layerPath: '',
        content: <Markdown options={{ wrapper: 'article' }}>{(leftPanelHelpItems && leftPanelHelpItems[item]) as string}</Markdown>,
      });
    } else {
      // we hit footer content now
      helpItems.push({
        layerName: 'Footer',
        layerPath: '',
        content: <RenderFooterContentInRightPanel {...{ footerContenKeys, footerContentKeyValues, allTabs }} />,
      });
    }
  });

  const guideItemClick = (layer: LayerListEntry) => {
    const index: number = helpItems.findIndex((item) => item.layerName === layer.layerName);
    setGuideItemIndex(index);
    setIsLayersPanelVisible(true);
  };

  const renderLayerList = useCallback(() => {
    return (
      <LayerList
        layerList={helpItems}
        isEnlargeDataTable={isEnlargeDataTable}
        selectedLayerIndex={guideItemIndex}
        handleListItemClick={(layer) => guideItemClick(layer)}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guideItemIndex, helpItems]);

  return (
    <Box sx={sxClasses.guideContainer}>
      {helpItems.length ? (
        <>
          <ResponsiveGrid.Root sx={{ pt: 8, pb: 8 }} ref={panelTitleRef}>
            <ResponsiveGrid.Left isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible}>
              <LayerTitle>{t('guide.title')}</LayerTitle>
            </ResponsiveGrid.Left>
            <ResponsiveGrid.Right isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  [theme.breakpoints.up('md')]: { justifyContent: 'right' },
                  [theme.breakpoints.down('md')]: { justifyContent: 'space-between' },
                }}
              >
                <LayerTitle hideTitle>{t('guide.title')}</LayerTitle>

                <Box>
                  <EnlargeButton isEnlargeDataTable={isEnlargeDataTable} setIsEnlargeDataTable={setIsEnlargeDataTable} />
                  <CloseButton isLayersPanelVisible={isLayersPanelVisible} setIsLayersPanelVisible={setIsLayersPanelVisible} />
                </Box>
              </Box>
            </ResponsiveGrid.Right>
          </ResponsiveGrid.Root>
          <ResponsiveGrid.Root>
            <ResponsiveGrid.Left isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible} ref={leftPanelRef}>
              {renderLayerList()}
            </ResponsiveGrid.Left>
            <ResponsiveGrid.Right isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible} ref={rightPanelRef}>
              <Box sx={sxClasses.rightPanelContainer}>
                <Box sx={{ ml: '30px', mb: '18px' }}>{helpItems[guideItemIndex]?.content}</Box>
              </Box>
            </ResponsiveGrid.Right>
          </ResponsiveGrid.Root>
        </>
      ) : (
        <Box sx={sxClasses.errorMessage}>{t('guide.errorMessage')}</Box>
      )}
    </Box>
  );
}
