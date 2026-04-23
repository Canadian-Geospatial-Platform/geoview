import type { ReactNode } from 'react';
import { memo, useState, useMemo, useCallback, useEffect } from 'react';

import { renderToStaticMarkup } from 'react-dom/server';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import Markdown from 'markdown-to-jsx';

import { Box } from '@/ui';
import type { LayerListEntry } from '@/core/components/common';
import { Layout } from '@/core/components/common';
import type { TypeContainerBox } from '@/core/types/global-types';
import { useStoreAppGuide } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { TABS } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';
import { getSxClasses } from './guide-style';
import { GuideSearch } from './guide-search';
import type { SxStyles } from '@/ui/style/types';

/** Guide list item extending LayerListEntry with content. */
interface GuideListItem extends LayerListEntry {
  /** The rendered guide content. */
  content: string | ReactNode;
}

/** Props for the Guide component. */
interface GuideType {
  /** The container box type for layout. */
  containerType: TypeContainerBox;
}

/**
 * Creates the guide component to display help content.
 *
 * Memoized to prevent re-renders when parent updates but containerType has not changed.
 *
 * @param props - Properties defined in GuideType interface
 * @returns The guide component
 */
export const Guide = memo(function GuidePanel({ containerType }: GuideType): JSX.Element {
  logger.logTraceRender('components/guide/guide');

  // Store
  const guide = useStoreAppGuide();
  const mapId = useStoreGeoViewMapId();

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const memoSxClasses = useMemo((): SxStyles => {
    logger.logTraceUseMemo('GUIDE - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // State
  const [selectedLayerPath, setSelectedLayerPath] = useState<string>('loadingStatus');
  const [guideItemIndex, setGuideItemIndex] = useState<number>(0);
  const [highlightFunction, setHighlightFunction] = useState<(content: string, sectionIndex: number) => string>(
    () => (content: string) => content
  );

  // Callbacks & Memoize values
  /**
   * Handles search state changes from GuideSearch component.
   */
  const handleSearchStateChange = useCallback(
    (newSearchTerm: string, newHighlightFunction: (content: string, sectionIndex: number) => string): void => {
      setHighlightFunction(() => newHighlightFunction);
    },
    []
  );

  /**
   * Creates a markdown component with the given content.
   *
   * @param content - The markdown content string
   * @returns The rendered markdown component
   */
  const createMarkdownComponent = useCallback(
    (content: string): JSX.Element => <Markdown options={{ wrapper: 'article' }}>{content}</Markdown>,
    []
  );

  /**
   * Builds the memoized layer list with markdown content.
   */
  const memoLayersList = useMemo((): GuideListItem[] => {
    logger.logTraceUseMemo('GUIDE - memoLayersList', guide, mapId, createMarkdownComponent, containerType);

    if (!guide) return [];

    return Object.keys(guide).map((item: string) => {
      let { content } = guide[item];

      // Appends the subsection content to the section content
      // Use \n\n (blank line) so markdown-to-jsx treats the next section as a new block.
      // A single \n after a list item causes the following heading to be parsed as a lazy continuation line inside the <li>.
      if (guide[item].children) {
        Object.entries(guide[item].children).forEach(([, child]) => {
          content += `\n\n${child.content}`;

          // Appends sub subsection content
          if (child.children) {
            Object.values(child.children).forEach((grandChild) => {
              content += `\n\n${grandChild.content}`;
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
        layerUniqueId: `${mapId}-${containerType}-${TABS.GUIDE}-${item ?? ''}`,
      };
    });
  }, [guide, mapId, createMarkdownComponent, containerType]);

  /**
   * Handles section change from GuideSearch component.
   */
  const handleSectionChange = useCallback(
    (sectionIndex: number): void => {
      if (memoLayersList[sectionIndex]) {
        setGuideItemIndex(sectionIndex);
        setSelectedLayerPath(memoLayersList[sectionIndex].layerPath);
      }
    },
    [memoLayersList]
  );

  /**
   * Builds the current guide content with search highlighting applied.
   */
  const memoCurrentGuideContent = useMemo((): ReactNode => {
    logger.logTraceUseMemo('GUIDE - memoCurrentGuideContent', memoLayersList, guideItemIndex, guide, highlightFunction);

    const currentItem = memoLayersList[guideItemIndex];
    if (!currentItem || !guide) return null;

    const currentGuideKey = Object.keys(guide)[guideItemIndex];
    if (!currentGuideKey) return currentItem.content;

    let { content } = guide[currentGuideKey];

    // Append subsection content
    // Use \n\n (blank line) so markdown-to-jsx treats the next section as a new block.
    // A single \n after a list item causes the following heading to be parsed as a lazy continuation line inside the <li>.
    if (guide[currentGuideKey].children) {
      Object.entries(guide[currentGuideKey].children).forEach(([, child]) => {
        content += `\n\n${child.content}`;
        if (child.children) {
          Object.values(child.children).forEach((grandChild) => {
            content += `\n\n${grandChild.content}`;
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
  }, [memoLayersList, guideItemIndex, guide, highlightFunction]);

  /**
   * Handles guide layer list item click.
   *
   * @param layer - The clicked guide item layer
   */
  const handleGuideItemClick = useCallback(
    (layer: LayerListEntry): void => {
      const index: number = memoLayersList.findIndex((item) => item.layerName === layer.layerName);
      setGuideItemIndex(index);
      setSelectedLayerPath(layer.layerPath);
    },
    [memoLayersList]
  );

  /**
   * Resets scroll position and handles anchor link navigation when content changes.
   */
  useEffect(() => {
    logger.logTraceUseEffect('GUIDE - anchor link navigation and scroll reset', selectedLayerPath, guideItemIndex);

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
    <Box sx={memoSxClasses.guideContainer}>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <Layout
          containerType={containerType}
          titleFullscreen={t('guide.title')}
          selectedLayerPath={selectedLayerPath}
          layoutSwitch={
            <GuideSearch
              containerType={containerType}
              guide={guide}
              onSectionChange={handleSectionChange}
              onSearchStateChange={handleSearchStateChange}
            />
          }
          layerList={memoLayersList}
          onLayerListClicked={handleGuideItemClick}
          aria-label={ariaLabel}
        >
          <Box sx={memoSxClasses.rightPanelContainer} className="guidebox-container">
            <Box className="guideBox">{memoCurrentGuideContent}</Box>
          </Box>
        </Layout>
      </Box>
    </Box>
  );
});
