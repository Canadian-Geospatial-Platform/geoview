import type { ReactNode } from 'react';
import { memo, useState, useMemo, useCallback, useEffect } from 'react';
import Markdown from 'markdown-to-jsx';
import { renderToStaticMarkup } from 'react-dom/server';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box } from '@/ui';
import { useAppGuide } from '@/core/stores/store-interface-and-intial-values/app-state';
import { logger } from '@/core/utils/logger';
import { getSxClasses } from './guide-style';
import type { LayerListEntry } from '@/core/components/common';
import { Layout } from '@/core/components/common';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { CONTAINER_TYPE, TABS } from '@/core/utils/constant';
import type { TypeContainerBox } from '@/core/types/global-types';
import { GuideSearch } from './guide-search';

interface GuideListItem extends LayerListEntry {
  content: string | ReactNode;
}

interface GuideType {
  containerType?: TypeContainerBox;
}

/**
 * Guide component to display help content
 *
 * @returns {JSX.Element} the guide (help) component
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const Guide = memo(function GuidePanel({ containerType = CONTAINER_TYPE.FOOTER_BAR }: GuideType): JSX.Element {
  logger.logTraceRender('components/guide/guide');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // State
  const [selectedLayerPath, setSelectedLayerPath] = useState<string>('loadingStatus');
  const [guideItemIndex, setGuideItemIndex] = useState<number>(0);
  const [highlightFunction, setHighlightFunction] = useState<(content: string, sectionIndex: number) => string>(
    () => (content: string) => content
  );

  // Store
  const guide = useAppGuide();
  const mapId = useGeoViewMapId();

  // Callbacks & Memoize values
  /**
   * Handle search state changes from GuideSearch component
   */
  const handleSearchStateChange = useCallback(
    (newSearchTerm: string, newHighlightFunction: (content: string, sectionIndex: number) => string) => {
      logger.logTraceUseCallback('GUIDE - handleSearchStateChange');
      setHighlightFunction(() => newHighlightFunction);
    },
    []
  );

  /**
   * Creates a markdown component with the given content
   */
  const createMarkdownComponent = useCallback((content: string) => <Markdown options={{ wrapper: 'article' }}>{content}</Markdown>, []);

  /**
   * Get Layer list with markdown content.
   */
  const getListOfGuides = useCallback((): GuideListItem[] => {
    logger.logTraceUseCallback('GUIDE - getListOfGuides');

    if (!guide) return [];

    return Object.keys(guide).map((item: string) => {
      let { content } = guide[item];

      // Appends the subsection content to the section content
      if (guide[item].children) {
        Object.entries(guide[item].children).forEach(([, child]) => {
          content += `\n${child.content}`;

          // Appends sub subsection content
          if (child.children) {
            Object.values(child.children).forEach((grandChild) => {
              content += `\n${grandChild.content}`;
            });
          }
        });
      }

      return {
        layerName: guide[item].heading,
        layerPath: item,
        layerStatus: 'loaded',
        queryStatus: 'processed',
        content: createMarkdownComponent(content),
        layerUniqueId: `${mapId}-${TABS.GUIDE}-${item ?? ''}`,
      };
    });
  }, [guide, mapId, createMarkdownComponent]);

  /**
   * Memo version of layer list with markdown content
   */
  const layersList = useMemo(() => getListOfGuides(), [getListOfGuides]);

  /**
   * Handle section change from GuideSearch component
   */
  const handleSectionChange = useCallback(
    (sectionIndex: number) => {
      logger.logTraceUseCallback('GUIDE - handleSectionChange');

      if (layersList[sectionIndex]) {
        setGuideItemIndex(sectionIndex);
        setSelectedLayerPath(layersList[sectionIndex].layerPath);
      }
    },
    [layersList]
  );

  /**
   * Current guide content with search highlighting
   */
  const currentGuideContent = useMemo(() => {
    const currentItem = layersList[guideItemIndex];
    if (!currentItem || !guide) return null;

    const currentGuideKey = Object.keys(guide)[guideItemIndex];
    if (!currentGuideKey) return currentItem.content;

    let { content } = guide[currentGuideKey];

    // Append subsection content
    if (guide[currentGuideKey].children) {
      Object.entries(guide[currentGuideKey].children).forEach(([, child]) => {
        content += `\n${child.content}`;
        if (child.children) {
          Object.values(child.children).forEach((grandChild) => {
            content += `\n${grandChild.content}`;
          });
        }
      });
    }

    // Convert markdown to HTML React elements
    const markdownElement = <Markdown>{content}</Markdown>;

    // Convert React element to HTML string
    const htmlString = renderToStaticMarkup(markdownElement);

    // Apply highlighting to the HTML
    const highlightedHTML = highlightFunction(htmlString, guideItemIndex);

    // GV: dangerouslySetInnerHTML is safe here because:
    // 1. Content originates from trusted markdown files in the codebase (guide.md)
    // 2. Markdown is converted to HTML via markdown-to-jsx (sanitized React elements)
    // 3. HTML is then processed to add <mark> tags for search highlighting
    // 4. No user-generated content is involved in this process
    // eslint-disable-next-line react/no-danger
    return <article dangerouslySetInnerHTML={{ __html: highlightedHTML }} />;
  }, [layersList, guideItemIndex, guide, highlightFunction]);

  /**
   * Handle Guide layer list.
   * @param {LayerListEntry} layer geoview layer.
   */
  const handleGuideItemClick = useCallback(
    (layer: LayerListEntry): void => {
      logger.logTraceUseCallback('GUIDE - handleGuideItemClick', layer);

      const index: number = layersList.findIndex((item) => item.layerName === layer.layerName);
      setGuideItemIndex(index);
      setSelectedLayerPath(layer.layerPath);
    },
    [layersList]
  );

  useEffect(() => {
    const container = document.querySelector('.guidebox-container')!.parentElement;

    // Reset scroll position when content changes - use requestAnimationFrame to ensure DOM is ready
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTo({
          top: 0,
          behavior: 'instant',
        });
      });
    }

    const handleClick = (e: Event): void => {
      const target = e.target as HTMLAnchorElement;
      if (target.tagName === 'A' && target.hash) {
        e.preventDefault();
        e.stopPropagation();

        const element = container?.querySelector(target.hash);
        if (element && container) {
          const elementPosition = element.getBoundingClientRect().top;
          const containerPosition = container.getBoundingClientRect().top;
          const scrollPosition = elementPosition - containerPosition + container.scrollTop;

          container.scrollTo({
            top: scrollPosition,
            behavior: 'smooth',
          });
        }
      }
    };

    container?.addEventListener('click', handleClick);

    // Cleanup function to remove the event listener
    return () => {
      container?.removeEventListener('click', handleClick);
    };
  }, [selectedLayerPath, guideItemIndex]);

  const ariaLabel = t('guide.title');
  return (
    <Box sx={sxClasses.guideContainer}>
      <GuideSearch guide={guide} onSectionChange={handleSectionChange} onSearchStateChange={handleSearchStateChange} />
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <Layout
          containerType={containerType}
          selectedLayerPath={selectedLayerPath}
          layerList={layersList}
          onLayerListClicked={handleGuideItemClick}
          aria-label={ariaLabel}
        >
          <Box sx={sxClasses.rightPanelContainer} className="guidebox-container">
            <Box className="guideBox">{currentGuideContent}</Box>
          </Box>
        </Layout>
      </Box>
    </Box>
  );
});
