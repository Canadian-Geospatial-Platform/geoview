import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box, TextField, InputAdornment, IconButton } from '@/ui';
import { SearchIcon, CloseIcon, KeyboardArrowUpIcon, KeyboardArrowDownIcon } from '@/ui/icons';
import { TypeGuideObject } from '@/core/stores/store-interface-and-intial-values/app-state';
import { logger } from '@/core/utils/logger';

// Protection pattern functions that return new regex instances
const getProtectionPatterns = () => [
  /\[[^\]]*\]\([^)]*\)/gi, // [text](url) - markdown links (case-insensitive)
  /!\[([^\]]*)\]\([^)]+\)/gi, // ![alt](image-url) (case-insensitive)
  /`[^`]+`/g, // `code`
  /```[\s\S]*?```/g, // ```code blocks```
  /^\s*\|[-\s:]+\|\s*$/gm, // |---|---| (table separators)
  /^\s*\|\s*[-:]+\s*\|/gm, // table header separators
  /<img\s+[^>]*>/gi, // <img> tags with space after img
  /&lt;img\b[^&]*?&gt;/gi, // HTML-encoded <img> tags
  /<[^>]+>/gi, // <html tags> (case-insensitive)
  /<[^>]+\/>/gi, // <self-closing tags/> (case-insensitive)
];

interface GuideSearchProps {
  guide: TypeGuideObject | undefined;
  onSectionChange: (sectionIndex: number) => void;
  onSearchStateChange: (searchTerm: string, highlightFunction: (content: string, sectionIndex: number) => string) => void;
}

interface SearchMatch {
  sectionIndex: number;
  matchIndex: number;
  isTable?: boolean;
  tableLineStart?: number;
}

export function GuideSearch({ guide, onSectionChange, onSearchStateChange }: GuideSearchProps) {
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

  /**
   * Identifies table ranges in markdown content
   * @param {string} content - The content to analyze
   * @returns {Array<{start: number, end: number}>} Array of start/end positions for table ranges
   */
  const getTableRanges = useCallback((content: string) => {
    // Log
    logger.logTraceUseCallback('GUIDE-SEARCH - getTableRanges');

    const tableRanges: Array<{ start: number; end: number }> = [];
    const lines = content.split('\n');
    let currentTableStart = -1;

    lines.forEach((line, lineIndex) => {
      const isTableRow = /^\s*\|.*\|\s*$/.test(line);
      if (isTableRow && currentTableStart === -1) {
        currentTableStart = lineIndex;
      } else if (!isTableRow && currentTableStart !== -1) {
        const tableStartPos = lines.slice(0, currentTableStart).join('\n').length + (currentTableStart > 0 ? 1 : 0);
        const tableEndPos = lines.slice(0, lineIndex).join('\n').length;
        tableRanges.push({ start: tableStartPos, end: tableEndPos });
        currentTableStart = -1;
      }
    });

    if (currentTableStart !== -1) {
      const tableStartPos = lines.slice(0, currentTableStart).join('\n').length + (currentTableStart > 0 ? 1 : 0);
      tableRanges.push({ start: tableStartPos, end: content.length });
    }

    return tableRanges;
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
        const tableRanges = getTableRanges(content);

        // Only count matches that are not in protected ranges
        regex.lastIndex = 0; // Reset regex state
        let matchIndex = 0;
        const tablesWithMatches = new Set<number>();
        let currentMatch = regex.exec(content);

        while (currentMatch !== null) {
          const matchStart = currentMatch.index;
          const isProtected = protectedRanges.some((range) => matchStart >= range.start && matchStart < range.end);

          if (!isProtected) {
            // Check if match is in any table
            const tableRange = tableRanges.find((range) => matchStart >= range.start && matchStart < range.end);

            if (tableRange) {
              // Group all matches in the same table as one
              if (!tablesWithMatches.has(tableRange.start)) {
                tablesWithMatches.add(tableRange.start);
                matches.push({ sectionIndex, matchIndex, isTable: true, tableLineStart: tableRange.start });
                matchIndex++;
              }
            } else {
              matches.push({ sectionIndex, matchIndex });
              matchIndex++;
            }
          }
          currentMatch = regex.exec(content);
        }
      });

      setAllMatches(matches);
      setCurrentMatchIndex(-1);
    },
    [guide, getProtectedRanges, getTableRanges]
  );

  /**
   * Highlights search terms in content with visual markers
   * @param {string} content - The content to highlight
   * @param {number} sectionIndex - The section index being processed
   * @returns {string} Content with highlighted search terms
   */
  const highlightSearchTerm = useCallback(
    (content: string, sectionIndex: number): string => {
      // Log
      logger.logTraceUseCallback('GUIDE-SEARCH - highlightSearchTerm');

      if (!searchTerm.trim() || searchTerm.trim().length < 3) return content;

      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi');
      let matchCount = 0;

      const protectedRanges = getProtectedRanges(content);

      let result = content;
      let offset = 0;

      content.replace(regex, (match, p1, matchIndex) => {
        // Check if match is in protected range
        const isProtected = protectedRanges.some((range) => matchIndex >= range.start && matchIndex < range.end);

        if (!isProtected) {
          // Check if this match corresponds to a table match
          const lineStart = content.lastIndexOf('\n', matchIndex) + 1;
          const currentLine = content.substring(lineStart, content.indexOf('\n', matchIndex) || content.length);
          const isInTable = /^\s*\|.*\|\s*$/.test(currentLine);

          if (isInTable) {
            const tableRanges = getTableRanges(content);
            const tableRange = tableRanges.find((range) => matchIndex >= range.start && matchIndex < range.end);

            if (tableRange) {
              const tableMatch = allMatches.find(
                (m) => m.sectionIndex === sectionIndex && m.isTable && m.tableLineStart === tableRange.start
              );

              if (tableMatch) {
                const globalMatchIndex = allMatches.indexOf(tableMatch);
                const isCurrentMatch = globalMatchIndex === currentMatchIndex;

                // Add indicator before the table (only once per table)
                if (!result.includes(`<!-- table-indicator-${tableRange.start} -->`)) {
                  const insertPoint = tableRange.start + offset;

                  const indicator = `<span data-table-indicator="${tableRange.start}" style="display: inline-block; margin: 2px 5px; padding: 6px 10px; background: ${isCurrentMatch ? '#ff6b35' : 'transparent'}; color: ${isCurrentMatch ? 'white' : 'black'}; border-radius: 3px; font-size: 1.1em; font-weight: bold;">📋 ${t('guide.tableMatch')}</span><!-- table-indicator-${tableRange.start} -->`;

                  result = result.slice(0, insertPoint) + indicator + result.slice(insertPoint);
                  offset += indicator.length;
                  matchCount++;
                }
              }
            }
          } else {
            // Normal highlighting for non-table content
            const globalMatchIndex = allMatches.findIndex((m) => m.sectionIndex === sectionIndex && m.matchIndex === matchCount);
            const isCurrentMatch = globalMatchIndex === currentMatchIndex;
            const replacement = `<mark className="search-highlight${isCurrentMatch ? ' current-match' : ''}">${match}</mark>`;

            const actualIndex = matchIndex + offset;
            result = result.slice(0, actualIndex) + replacement + result.slice(actualIndex + match.length);
            offset += replacement.length - match.length;
            matchCount++;
          }
        }
        return match;
      });

      return result;
    },
    [searchTerm, allMatches, currentMatchIndex, t, getProtectedRanges, getTableRanges]
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
          if (match.isTable) {
            // For table matches, scroll to the table indicator
            const tableIndicator = document.querySelector(`span[data-table-indicator="${match.tableLineStart}"]`);
            if (tableIndicator) {
              tableIndicator.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          } else {
            // For regular matches, scroll to the highlighted text
            const currentMatch = document.querySelector('.current-match');
            if (currentMatch) {
              currentMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
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
