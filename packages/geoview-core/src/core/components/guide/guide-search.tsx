import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box, TextField, InputAdornment, IconButton } from '@/ui';
import { SearchIcon, CloseIcon, KeyboardArrowUpIcon, KeyboardArrowDownIcon } from '@/ui/icons';
import type { TypeGuideObject } from '@/core/stores/store-interface-and-intial-values/app-state';
import { logger } from '@/core/utils/logger';

// Protection pattern functions that return new regex instances
const getProtectionPatterns = (): RegExp[] => [
  /!\[[^\]]*\]\([^)]+\)/gi, // ![alt](image-url) - markdown images (case-insensitive)
  /\[[^\]]*\]\([^)]*\)/gi, // [text](url) - markdown links (case-insensitive)
  /`[^`]+`/g, // `code`
  /```[\s\S]*?```/g, // ```code blocks```
  /<img\s+[^>]*>/gi, // <img> tags
  /&lt;img\b[^&]*?&gt;/gi, // HTML-encoded <img> tags
  /<[^>]+>/gi, // <html tags> (case-insensitive)
];

interface GuideSearchProps {
  guide: TypeGuideObject | undefined;
  onSectionChange: (sectionIndex: number) => void;
  onSearchStateChange: (searchTerm: string, highlightFunction: (content: string, sectionIndex: number) => string) => void;
}

interface SearchMatch {
  sectionIndex: number;
}

export function GuideSearch({ guide, onSectionChange, onSearchStateChange }: GuideSearchProps): JSX.Element {
  logger.logTraceRender('components/guide/guide');

  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();

  // State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [allMatches, setAllMatches] = useState<SearchMatch[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // #region Helper functions
  /**
   * Gets ranges of protected content that should not be highlighted during search
   * @param {string} content - The content to analyze
   * @returns {Array<{start: number, end: number}>} Array of start/end positions for protected ranges
   */
  const getProtectedRanges = useCallback((content: string) => {
    // Log
    logger.logTraceUseCallback('GUIDE-SEARCH - getProtectedRanges');

    const protectedRanges: Array<{ start: number; end: number }> = [];
    getProtectionPatterns().forEach((pattern) => {
      let match = pattern.exec(content);
      while (match !== null) {
        protectedRanges.push({ start: match.index, end: match.index + match[0].length });
        match = pattern.exec(content);
      }
    });
    return protectedRanges;
  }, []);

  // #endregion Helper functions

  /**
   * Finds all search matches across all guide sections
   * @param {string} term - The search term to find
   */
  const findAllMatches = useCallback(
    (term: string) => {
      // Log
      logger.logTraceUseCallback('GUIDE-SEARCH - findAllMatches');

      if (!term.trim() || term.trim().length < 3 || !guide) {
        setAllMatches([]);
        setCurrentMatchIndex(0);
        return;
      }

      const matches: SearchMatch[] = [];
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi');

      Object.keys(guide).forEach((item, sectionIndex) => {
        let { content } = guide[item];

        if (guide[item].children) {
          Object.entries(guide[item].children).forEach(([, child]) => {
            content += `\n${child.content}`;
            if (child.children) {
              Object.values(child.children).forEach((grandChild) => {
                content += `\n${grandChild.content}`;
              });
            }
          });
        }

        const protectedRanges = getProtectedRanges(content);

        // Only count matches that are not in protected ranges
        regex.lastIndex = 0; // Reset regex state
        let currentMatch = regex.exec(content);

        while (currentMatch !== null) {
          const matchStart = currentMatch.index;
          const isProtected = protectedRanges.some((range) => matchStart >= range.start && matchStart < range.end);

          if (!isProtected) {
            matches.push({ sectionIndex });
          }
          currentMatch = regex.exec(content);
        }
      });

      setAllMatches(matches);
      setCurrentMatchIndex(-1);
    },
    [guide, getProtectedRanges]
  );

  /**
   * Recursively finds all text nodes in a DOM node, excluding certain elements
   * @param {Node} node - The DOM node to search
   * @param {Node[]} textNodes - Array to store found text nodes
   * @param {Set<string>} skipTags - Set of tag names to skip
   */
  const findTextNodes = useCallback(
    (node: Node, textNodes: Node[], skipTags: Set<string> = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'IMG'])): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const parentTag = node.parentElement?.tagName || '';
        // Skip if parent is in skipTags
        if (!skipTags.has(parentTag)) {
          // Special case: skip anchor tags that are inside table cells
          if (parentTag === 'A') {
            const grandparentTag = node.parentElement?.parentElement?.tagName || '';
            if (grandparentTag === 'TD') {
              return; // Skip anchor tags inside table cells
            }
          }
          textNodes.push(node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        if (!skipTags.has(element.tagName)) {
          node.childNodes.forEach((child) => findTextNodes(child, textNodes, skipTags));
        }
      }
    },
    []
  );

  /**
   * Highlights search terms in content with visual markers using DOM-based approach
   * @param {string} content - The content to highlight
   * @param {number} sectionIndex - The section index being processed
   * @returns {string} Content with highlighted search terms
   */
  const highlightSearchTerm = useCallback(
    (content: string, sectionIndex: number): string => {
      // Log
      logger.logTraceUseCallback('GUIDE-SEARCH - highlightSearchTerm');

      if (!searchTerm.trim() || searchTerm.trim().length < 3) return content;

      // Step 1: Extract and remove markdown image patterns only (not HTML img tags)
      const protectedPatterns: { placeholder: string; original: string }[] = [];
      let contentWithoutProtected = content;

      // Find markdown patterns
      const patterns = [
        /!\[[^\]]*\]\([^)]+\)/gi, // ![alt](url) - markdown images
        /\[[^\]]*\]\([^)]*\)/g, // [text](url) - markdown links
      ];

      let index = 0;
      patterns.forEach((patternTemplate) => {
        // Create a new regex instance to avoid modifying the original
        const pattern = new RegExp(patternTemplate.source, patternTemplate.flags);
        const matches = Array.from(content.matchAll(pattern));
        matches.forEach((match) => {
          const placeholder = `__GEOVIEW_PROTECTED_${index}__`;
          protectedPatterns.push({ placeholder, original: match[0] });
          // Replace this specific occurrence
          contentWithoutProtected = contentWithoutProtected.replace(match[0], placeholder);
          index++;
        });
      });

      // Step 2: Create a temporary DOM element to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contentWithoutProtected;

      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi');

      // Count matches from all previous sections to calculate the global match index
      let globalMatchCounter = 0;
      for (let i = 0; i < sectionIndex; i++) {
        const previousSectionMatches = allMatches.filter((m) => m.sectionIndex === i);
        globalMatchCounter += previousSectionMatches.length;
      }

      // Process all text nodes in document order and highlight matches
      const allTextNodes: Node[] = [];
      findTextNodes(tempDiv, allTextNodes);

      allTextNodes.forEach((textNode) => {
        const text = textNode.textContent || '';
        const matches = Array.from(text.matchAll(regex));

        if (matches.length > 0) {
          const fragment = document.createDocumentFragment();
          let lastIndex = 0;

          matches.forEach((match) => {
            const matchStart = match.index;
            const matchEnd = matchStart + match[0].length;

            // Add text before match
            if (matchStart > lastIndex) {
              fragment.appendChild(document.createTextNode(text.substring(lastIndex, matchStart)));
            }

            // Check if this is the current match
            const isThisMatchCurrent = globalMatchCounter === currentMatchIndex;

            // Create highlighted span
            const mark = document.createElement('mark');
            mark.className = `search-highlight${isThisMatchCurrent ? ' current-match' : ''}`;
            mark.textContent = match[0];
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

      // Step 3: Restore all protected patterns
      let finalHTML = tempDiv.innerHTML;
      protectedPatterns.forEach(({ placeholder, original }) => {
        finalHTML = finalHTML.replace(placeholder, original);
      });

      return finalHTML;
    },
    [searchTerm, allMatches, currentMatchIndex, findTextNodes]
  );

  /**
   * Updates search matches when search term changes
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GUIDE-SEARCH - search term changes');

    findAllMatches(searchTerm);
  }, [searchTerm, findAllMatches]);

  /**
   * Notifies parent component of search state changes
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GUIDE-SEARCH - notify parent of search state changes');

    onSearchStateChange(searchTerm, highlightSearchTerm);
  }, [searchTerm, highlightSearchTerm, onSearchStateChange]);

  /**
   * Navigates to a specific search match
   * @param {number} index - The match index to navigate to
   */
  const navigateToMatch = useCallback(
    (index: number) => {
      // Log
      logger.logTraceUseCallback('GUIDE-SEARCH - navigateToMatch');

      if (allMatches.length === 0) return;

      const match = allMatches[index];
      setCurrentMatchIndex(index);
      onSectionChange(match.sectionIndex);

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
        }, 100);
      }, 300);
    },
    [allMatches, onSectionChange]
  );

  /**
   * Navigates to the next search match
   */
  const handleNext = useCallback(() => {
    // Log
    logger.logTraceUseCallback('GUIDE-SEARCH - handleNext');

    const nextIndex = (currentMatchIndex + 1) % allMatches.length;
    navigateToMatch(nextIndex);
  }, [currentMatchIndex, allMatches.length, navigateToMatch]);

  /**
   * Navigates to the previous search match
   */
  const handlePrevious = useCallback(() => {
    // Log
    logger.logTraceUseCallback('GUIDE-SEARCH - handlePrevious');

    const prevIndex = currentMatchIndex === 0 ? allMatches.length - 1 : currentMatchIndex - 1;
    navigateToMatch(prevIndex);
  }, [currentMatchIndex, allMatches.length, navigateToMatch]);

  /**
   * Clears the search term and resets search state
   */
  const handleClear = useCallback(() => {
    // Log
    logger.logTraceUseCallback('GUIDE-SEARCH - handleClear');

    setSearchTerm('');
    setCurrentMatchIndex(0);
    setAllMatches([]);
    setTimeout(() => searchInputRef.current?.focus(), 0);
  }, []);

  /**
   * Handles keyboard navigation for search
   * @param {React.KeyboardEvent} e - The keyboard event
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Log
      logger.logTraceUseCallback('GUIDE-SEARCH - handleKeyDown');

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

  return (
    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', width: '400px', maxWidth: '100%' }}>
      <TextField
        fullWidth
        size="small"
        placeholder={t('guide.search')!}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        slotProps={{
          input: {
            ref: searchInputRef,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {allMatches.length > 0 && (
                    <>
                      <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {currentMatchIndex + 1} of {allMatches.length}
                      </Box>
                      <IconButton size="small" onClick={handlePrevious} disabled={allMatches.length === 0}>
                        <KeyboardArrowUpIcon sx={{ fontSize: theme.palette.geoViewFontSize.sm }} />
                      </IconButton>
                      <IconButton size="small" onClick={handleNext} disabled={allMatches.length === 0}>
                        <KeyboardArrowDownIcon sx={{ fontSize: theme.palette.geoViewFontSize.sm }} />
                      </IconButton>
                    </>
                  )}
                  <IconButton
                    size="small"
                    edge="end"
                    color="inherit"
                    onClick={handleClear}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClear();
                      }
                    }}
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
    </Box>
  );
}
