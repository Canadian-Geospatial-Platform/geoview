import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

import { renderToStaticMarkup } from 'react-dom/server';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import Markdown from 'markdown-to-jsx';

import { Box, TextField, InputAdornment, IconButton } from '@/ui';
import { SearchIcon, CloseIcon, KeyboardArrowUpIcon, KeyboardArrowDownIcon } from '@/ui/icons';
import type { TypeContainerBox } from '@/core/types/global-types';
import type { TypeGuideObject } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { TIMEOUT, TABS } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';
import { getSxClasses } from './guide-style';

/** Props for the GuideSearch component. */
interface GuideSearchProps {
  /** The container type (footerBar, appBar, etc.). */
  containerType: TypeContainerBox;
  /** The guide content object. */
  guide: TypeGuideObject | undefined;
  /** Callback to change the active guide section. */
  onSectionChange: (sectionIndex: number) => void;
  /** Callback to notify parent of search state changes. */
  onSearchStateChange: (searchTerm: string, highlightFunction: (content: string, sectionIndex: number) => string) => void;
}

/** Represents a search match location. */
interface SearchMatch {
  /** The index of the guide section containing the match. */
  sectionIndex: number;
}

/**
 * Creates the guide search component.
 *
 * @param props - Properties defined in GuideSearchProps interface
 * @returns The guide search input and navigation controls
 */
export function GuideSearch({ containerType, guide, onSectionChange, onSearchStateChange }: GuideSearchProps): JSX.Element {
  logger.logTraceRender('components/guide/guide-search');

  // Store
  const mapId = useStoreGeoViewMapId();

  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const memoSxClasses = useMemo(() => {
    logger.logTraceUseMemo('GUIDE-SEARCH - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [allMatches, setAllMatches] = useState<SearchMatch[]>([]);
  const [srAnnouncement, setSrAnnouncement] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  /** Unique ID for the search instructions element. */
  const searchInstructionsId = `${mapId}-${containerType}-${TABS.GUIDE}-search-instructions`;

  /** Determines if navigation buttons should be disabled (when no matches or when showing the only available match).*/
  const isNavigationDisabled = allMatches.length === 0 || (allMatches.length === 1 && currentMatchIndex === 0);

  // #region Helper functions
  /**
   * Normalizes text by removing accents/diacritics for accent-insensitive search.
   *
   * GV IMPORTANT: Allows searching for "legende" to match "légende", and vice versa
   *
   * @param text - Text to normalize
   * @returns Text with accents removed
   */
  const normalizeAccents = useCallback((text: string): string => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }, []);

  /**
   * Creates a regex pattern that allows proximity search with up to maxWords between keywords.
   *
   * @param term - The search term
   * @param maxWords - Optional maximum number of words allowed between keywords (default: 5)
   * @returns Regex pattern for proximity search
   */
  const createProximitySearchPattern = useCallback(
    (term: string, maxWords: number = 5): RegExp => {
      // Normalize accents in the search term
      const normalizedTerm = normalizeAccents(term);

      // Split the term into individual words
      const words = normalizedTerm.trim().split(/\s+/);

      if (words.length === 1) {
        // Single word search - match word with optional markdown around it, but only capture the word
        const escapedWord = words[0].replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
        return new RegExp(`[*_]*(${escapedWord})[*_]*`, 'gi');
      }

      // Multi-word search - allow up to maxWords between each keyword
      // Escape special regex characters in each word
      const escapedWords = words.map((w) => w.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'));

      // Build pattern with markdown-aware word matching
      const wordPatterns = escapedWords.map((w) => `[*_]*${w}[*_]*`);

      // Pattern to match 0 to maxWords between keywords
      const wordGap = `(?:\\s+\\S+){0,${maxWords}}\\s+`;

      // Join words with the gap pattern and capture the whole phrase
      const pattern = wordPatterns.join(wordGap);

      return new RegExp(`(${pattern})`, 'gi');
    },
    [normalizeAccents]
  );

  // #endregion Helper functions

  /**
   * Recursively finds all text nodes in a DOM node, excluding certain elements.
   *
   * GV IMPORTANT: This function processes HTML content after markdown conversion.
   * GV When using anchor tags (<a href>) in markdown tables, they can break table rendering
   * GV because the markdown-to-jsx parser applies HTML conversion before processing table syntax.
   * GV To preserve table formatting, use plain text in table cells instead of anchor tags.
   *
   * @param node - The DOM node to search
   * @param textNodes - Array to store found text nodes
   * @param skipTags - Optional set of tag names to skip
   */
  const findTextNodes = useCallback(
    (node: Node, textNodes: Node[], skipTags: Set<string> = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'IMG', 'A'])): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent || '';
        const parentTag = node.parentElement?.tagName || '';

        // Skip if text contains GEOVIEW_PROTECTED placeholders
        if (textContent.includes('__GEOVIEW_PROTECTED_')) {
          return;
        }

        // Skip if parent is in skipTags (includes A, IMG, SCRIPT, STYLE, CODE, PRE)
        if (!skipTags.has(parentTag)) {
          textNodes.push(node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        // If this element should be skipped entirely (like IMG, A), don't process it or its children
        if (skipTags.has(element.tagName)) {
          return;
        }
        // Otherwise, process all children
        node.childNodes.forEach((child) => findTextNodes(child, textNodes, skipTags));
      }
    },
    []
  );

  /**
   * Finds all search matches across all guide sections.
   *
   * @param term - The search term to find
   */
  const findAllMatches = useCallback(
    (term: string): void => {
      if (!term.trim() || term.trim().length < 3 || !guide) {
        setAllMatches([]);
        setCurrentMatchIndex(0);
        return;
      }

      const matches: SearchMatch[] = [];
      const regex = createProximitySearchPattern(term, 5);

      Object.keys(guide).forEach((item, sectionIndex) => {
        let { content } = guide[item];

        // Use \n\n (blank line) so markdown-to-jsx treats the next section as a new block.
        // A single \n after a list item causes the following heading to be parsed as a lazy continuation line inside the <li>.
        if (guide[item].children) {
          Object.entries(guide[item].children).forEach(([, child]) => {
            content += `\n\n${child.content}`;
            if (child.children) {
              Object.values(child.children).forEach((grandChild) => {
                content += `\n\n${grandChild.content}`;
              });
            }
          });
        }

        // Convert markdown to HTML (same as guide.tsx) to properly parse structure
        const markdownElement = <Markdown options={{ wrapper: 'article' }}>{content}</Markdown>;
        const htmlString = renderToStaticMarkup(markdownElement);

        // Parse HTML to properly exclude <img> and <a> tags
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;

        // Collect all searchable text (excluding text inside img and a tags)
        const searchableTextNodes: Node[] = [];
        findTextNodes(tempDiv, searchableTextNodes);

        // Combine all searchable text and normalize accents for matching
        const searchableContent = normalizeAccents(searchableTextNodes.map((node) => node.textContent || '').join(' '));

        // Only count matches in the searchable content
        regex.lastIndex = 0; // Reset regex state
        let currentMatch = regex.exec(searchableContent);

        while (currentMatch !== null) {
          matches.push({ sectionIndex });
          currentMatch = regex.exec(searchableContent);
        }
      });

      setAllMatches(matches);
      setCurrentMatchIndex(-1);
    },
    [guide, createProximitySearchPattern, findTextNodes, normalizeAccents]
  );

  /**
   * Highlights search terms in content with visual markers using DOM-based approach.
   *
   * @param content - The content to highlight
   * @param sectionIndex - The section index being processed
   * @returns Content with highlighted search terms
   */
  const highlightSearchTerm = useCallback(
    (content: string, sectionIndex: number): string => {
      if (!searchTerm.trim() || searchTerm.trim().length < 3) return content;

      // Parse HTML - anchor tags and images are automatically excluded by DOM structure
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      const regex = createProximitySearchPattern(searchTerm, 5);

      // Count matches from all previous sections to calculate the global match index
      let globalMatchCounter = 0;
      for (let i = 0; i < sectionIndex; i++) {
        const previousSectionMatches = allMatches.filter((m) => m.sectionIndex === i);
        globalMatchCounter += previousSectionMatches.length;
      }

      // Process all text nodes in document order
      const allTextNodes: Node[] = [];
      findTextNodes(tempDiv, allTextNodes);

      // GV IMPORTANT: For multi-word searches with formatted text (e.g., **legend** panel),
      // text nodes are split by HTML tags (<strong>, <em>, etc.). We need to search across
      // the combined text to find matches, then highlight each text node that contains part of the match.
      const words = searchTerm.trim().split(/\s+/);

      if (words.length > 1) {
        // Multi-word: combine all text to find matches that span across formatting tags
        const combinedText = allTextNodes.map((node) => node.textContent || '').join(' ');
        const normalizedCombinedText = normalizeAccents(combinedText);
        const phraseMatches = Array.from(normalizedCombinedText.matchAll(regex));

        if (phraseMatches.length > 0) {
          // Create a map of which characters in each text node should be highlighted
          const highlightMap = new Map<Node, Array<{ start: number; end: number; isCurrent: boolean }>>();

          phraseMatches.forEach((match) => {
            const matchStart = match.index || 0;
            const matchEnd = matchStart + match[0].length;
            const isThisMatchCurrent = globalMatchCounter === currentMatchIndex;

            // Find which text nodes contain parts of this match
            let pos = 0;
            for (let i = 0; i < allTextNodes.length; i++) {
              const node = allTextNodes[i];
              const nodeText = node.textContent || '';
              const nodeStart = pos;
              const nodeEnd = pos + nodeText.length;

              // Check if this node overlaps with the match
              if (matchStart < nodeEnd && matchEnd > nodeStart) {
                const highlightStart = Math.max(0, matchStart - nodeStart);
                const highlightEnd = Math.min(nodeText.length, matchEnd - nodeStart);

                if (!highlightMap.has(node)) {
                  highlightMap.set(node, []);
                }
                highlightMap.get(node)!.push({
                  start: highlightStart,
                  end: highlightEnd,
                  isCurrent: isThisMatchCurrent,
                });
              }

              pos = nodeEnd + 1; // +1 for the space between nodes
              if (pos > matchEnd) break;
            }

            globalMatchCounter++;
          });

          // Apply highlights to each text node based on the map
          highlightMap.forEach((ranges, textNode) => {
            const text = textNode.textContent || '';
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;

            ranges.forEach((range) => {
              // Add text before highlight
              if (range.start > lastIndex) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, range.start)));
              }

              // Add highlighted text
              const mark = document.createElement('mark');
              mark.className = `search-highlight${range.isCurrent ? ' current-match' : ''}`;
              mark.textContent = text.substring(range.start, range.end);
              fragment.appendChild(mark);

              lastIndex = range.end;
            });

            // Add remaining text
            if (lastIndex < text.length) {
              fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            }

            textNode.parentNode?.replaceChild(fragment, textNode);
          });
        }
      } else {
        // Single word: use original per-node approach
        allTextNodes.forEach((textNode) => {
          const text = textNode.textContent || '';
          const normalizedText = normalizeAccents(text);
          const matches = Array.from(normalizedText.matchAll(regex));

          if (matches.length > 0) {
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;

            matches.forEach((match) => {
              const matchStart = match.index || 0;
              const matchEnd = matchStart + match[0].length;

              // Add text before match
              if (matchStart > lastIndex) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, matchStart)));
              }

              // Check if this is the current match
              const isThisMatchCurrent = globalMatchCounter === currentMatchIndex;

              // Create highlighted span with ORIGINAL text (preserving accents)
              const mark = document.createElement('mark');
              mark.className = `search-highlight${isThisMatchCurrent ? ' current-match' : ''}`;
              mark.textContent = text.substring(matchStart, matchEnd);
              fragment.appendChild(mark);

              lastIndex = matchEnd;
              globalMatchCounter++;
            });

            // Add remaining text after last match
            if (lastIndex < text.length) {
              fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            }

            // Replace text node with fragment
            textNode.parentNode?.replaceChild(fragment, textNode);
          }
        });
      }

      return tempDiv.innerHTML;
    },
    [searchTerm, allMatches, currentMatchIndex, findTextNodes, createProximitySearchPattern, normalizeAccents]
  );

  /**
   * Navigates to a specific search match.
   *
   * @param index - The match index to navigate to
   */
  const navigateToMatch = useCallback(
    (index: number): void => {
      if (allMatches.length === 0) return;

      const match = allMatches[index];
      setCurrentMatchIndex(index);
      onSectionChange(match.sectionIndex);

      setSrAnnouncement(
        t('guide.searchNavigationAnnouncement', {
          current: index + 1,
          total: allMatches.length,
        })!
      );

      setTimeout(() => {
        // Ensure the section is expanded/visible
        const sectionElements = document.querySelectorAll('[data-section-index]');
        const targetSection = Array.from(sectionElements).find(
          (el) => el.getAttribute('data-section-index') === match.sectionIndex.toString()
        );

        if (targetSection) {
          // If section has a collapse/expand mechanism, ensure it's expanded
          const collapseButton = targetSection.querySelector('[aria-expanded="false"]');
          if (collapseButton) {
            (collapseButton as HTMLElement).click();
          }
        }

        // Wait a bit more for potential expansion animation
        setTimeout(() => {
          // For all matches, scroll to the highlighted text
          const currentMatchElement = document.querySelector('.current-match');
          if (currentMatchElement) {
            currentMatchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, TIMEOUT.guideSearchVisibility);
      }, TIMEOUT.guideSearchSectionExpand);
    },
    [allMatches, onSectionChange, t]
  );

  /**
   * Updates search matches when search term changes
   */
  useEffect(() => {
    logger.logTraceUseEffect('GUIDE-SEARCH - search term changes', searchTerm);
    findAllMatches(searchTerm);
  }, [searchTerm, findAllMatches]);

  /**
   * Announces search results for screen readers.
   */
  useEffect(() => {
    logger.logTraceUseEffect('GUIDE-SEARCH - announce search results', searchTerm, allMatches.length);

    if (searchTerm.trim().length >= 3) {
      if (allMatches.length === 0) {
        setSrAnnouncement(t('guide.noResults')!);
      } else if (allMatches.length === 1) {
        setSrAnnouncement(t('guide.oneResult')!);
      } else {
        setSrAnnouncement(t('guide.multipleResults', { count: allMatches.length })!);
      }
    } else {
      setSrAnnouncement('');
    }
  }, [allMatches.length, searchTerm, t]);

  /**
   * Notifies parent component of search state changes
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GUIDE-SEARCH - notify parent of search state changes');

    onSearchStateChange(searchTerm, highlightSearchTerm);
  }, [searchTerm, highlightSearchTerm, onSearchStateChange]);

  // #region Handlers

  /**
   * Navigates to the next search match.
   */
  const handleNext = useCallback((): void => {
    if (isNavigationDisabled) return;
    const nextIndex = (currentMatchIndex + 1) % allMatches.length;
    navigateToMatch(nextIndex);
  }, [isNavigationDisabled, currentMatchIndex, allMatches.length, navigateToMatch]);

  /**
   * Navigates to the previous search match.
   */
  const handlePrevious = useCallback((): void => {
    if (isNavigationDisabled) return;
    const prevIndex = currentMatchIndex === -1 || currentMatchIndex === 0 ? allMatches.length - 1 : currentMatchIndex - 1;
    navigateToMatch(prevIndex);
  }, [isNavigationDisabled, currentMatchIndex, allMatches.length, navigateToMatch]);

  /**
   * Clears the search term and resets search state.
   */
  const handleClear = useCallback((): void => {
    setSearchTerm('');
    setCurrentMatchIndex(0);
    setAllMatches([]);
    setTimeout(() => searchInputRef.current?.focus(), TIMEOUT.deferExecution);
  }, []);

  /**
   * Handles keyboard events on the clear button.
   */
  const handleClearKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        handleClear();
      }
    },
    [handleClear]
  );

  /**
   * Handles keyboard events on navigation buttons to prevent event propagation.
   */
  const handleNavigationKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.stopPropagation();
    }
  }, []);

  /**
   * Handles keyboard navigation for search.
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (allMatches.length === 0) return;

      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
        searchInputRef.current?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevious();
        searchInputRef.current?.focus();
      }
    },
    [allMatches.length, handleNext, handlePrevious]
  );

  /**
   * Handles form submission to prevent page reload.
   */
  const handleFormSubmit = useCallback((event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
  }, []);

  /**
   * Handles search term input changes.
   */
  const handleSearchTermChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(event.target.value);
  }, []);

  // #endregion Handlers

  return (
    <Box sx={memoSxClasses.guideSearch}>
      {/* WCAG - Live region announces search results and navigation state to screen readers */}
      <Box role="status" aria-live="polite" aria-atomic="true" sx={memoSxClasses.visuallyHidden}>
        {srAnnouncement}
      </Box>
      <form onSubmit={handleFormSubmit} role="search" aria-label={t('guide.searchFormLabel')!}>
        <TextField
          inputRef={searchInputRef}
          fullWidth
          size="small"
          placeholder={t('guide.search')!}
          value={searchTerm}
          onChange={handleSearchTermChange}
          onKeyDown={handleKeyDown}
          slotProps={{
            htmlInput: {
              'aria-label': t('guide.searchInputLabel')!,
              'aria-describedby': searchInstructionsId,
            },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {allMatches.length > 0 && (
                      <>
                        <Box
                          role="status"
                          sx={{ fontSize: '0.75rem', color: theme.palette.geoViewColor.textColor.light[200], whiteSpace: 'nowrap' }}
                          aria-label={
                            t('guide.searchMatchCountLabel', {
                              current: currentMatchIndex + 1,
                              total: allMatches.length,
                            })!
                          }
                        >
                          {currentMatchIndex + 1} of {allMatches.length}
                        </Box>
                        <IconButton
                          size="small"
                          aria-label={t('guide.previousMatch')}
                          className="buttonOutline"
                          onClick={handlePrevious}
                          aria-disabled={isNavigationDisabled}
                          onKeyDown={handleNavigationKeyDown}
                        >
                          <KeyboardArrowUpIcon sx={{ fontSize: theme.palette.geoViewFontSize.sm }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label={t('guide.nextMatch')}
                          className="buttonOutline"
                          onClick={handleNext}
                          aria-disabled={isNavigationDisabled}
                          onKeyDown={handleNavigationKeyDown}
                        >
                          <KeyboardArrowDownIcon sx={{ fontSize: theme.palette.geoViewFontSize.sm }} />
                        </IconButton>
                      </>
                    )}
                    {searchTerm.trim().length >= 3 && allMatches.length === 0 && (
                      <Box
                        sx={{ fontSize: '0.75rem', color: theme.palette.geoViewColor.textColor.light[200], whiteSpace: 'nowrap', mr: 1 }}
                        role="status"
                      >
                        {t('guide.noResults')}
                      </Box>
                    )}
                    <IconButton
                      size="small"
                      edge="end"
                      color="inherit"
                      className="buttonOutline"
                      aria-label={t('general.clearSearch')}
                      onClick={handleClear}
                      onKeyDown={handleClearKeyDown}
                      sx={{ ml: 1 }}
                    >
                      <CloseIcon sx={{ fontSize: theme.palette.geoViewFontSize.sm }} />
                    </IconButton>
                  </Box>
                </InputAdornment>
              ),
            },
          }}
        />
      </form>
      <Box id={searchInstructionsId} sx={memoSxClasses.visuallyHidden}>
        {t('guide.searchInstructions')!}
      </Box>
    </Box>
  );
}
