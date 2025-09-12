import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box, TextField, InputAdornment, IconButton } from '@/ui';
import { SearchIcon, CloseIcon } from '@/ui/icons';
import { TypeGuideObject } from '@/core/stores/store-interface-and-intial-values/app-state';
import { logger } from '@/core/utils/logger';

interface GuideSearchProps {
  guide: TypeGuideObject | undefined;
  onSectionChange: (sectionIndex: number) => void;
  onSearchStateChange: (searchTerm: string, highlightFunction: (content: string, sectionIndex: number) => string) => void;
}

interface SearchMatch {
  sectionIndex: number;
  matchIndex: number;
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

  /**
   * Find all matches across all sections
   */
  const findAllMatches = useCallback(
    (term: string) => {
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

        const sectionMatches = content.match(regex);
        if (sectionMatches) {
          sectionMatches.forEach((_, matchIndex) => {
            matches.push({ sectionIndex, matchIndex });
          });
        }
      });

      setAllMatches(matches);
      setCurrentMatchIndex(0);
    },
    [guide]
  );

  /**
   * Highlights search term in content with navigation markers
   */
  const highlightSearchTerm = useCallback(
    (content: string, sectionIndex: number): string => {
      logger.logTraceUseCallback('GUIDE-SEARCH - highlightSearchTerm');

      if (!searchTerm.trim() || searchTerm.trim().length < 3) return content;

      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi');
      let matchCount = 0;

      // Protect markdown links and code blocks from highlighting
      const protectedRanges: Array<{ start: number; end: number }> = [];
      const patterns = [
        /\[([^\]]+)\]\([^)]+\)/g, // [text](url)
        /`[^`]+`/g, // `code`
        /```[\s\S]*?```/g, // ```code blocks```
      ];

      patterns.forEach((pattern) => {
        let match = pattern.exec(content);
        while (match !== null) {
          protectedRanges.push({ start: match.index, end: match.index + match[0].length });
          match = pattern.exec(content);
        }
      });

      let result = content;
      let offset = 0;

      content.replace(regex, (match, p1, matchIndex) => {
        // Check if match is in protected range
        const isProtected = protectedRanges.some((range) => matchIndex >= range.start && matchIndex < range.end);

        if (!isProtected) {
          const globalMatchIndex = allMatches.findIndex((m) => m.sectionIndex === sectionIndex && m.matchIndex === matchCount);
          const isCurrentMatch = globalMatchIndex === currentMatchIndex;
          const replacement = `<mark class="search-highlight${isCurrentMatch ? ' current-match' : ''}">${match}</mark>`;

          const actualIndex = matchIndex + offset;
          result = result.slice(0, actualIndex) + replacement + result.slice(actualIndex + match.length);
          offset += replacement.length - match.length;
        }
        matchCount++;
        return match;
      });

      return result;
    },
    [searchTerm, allMatches, currentMatchIndex]
  );

  // Update matches when search term changes
  useEffect(() => {
    logger.logTraceUseEffect('GUIDE-SEARCH - search term changes');

    findAllMatches(searchTerm);
  }, [searchTerm, findAllMatches]);

  // Notify parent of search state changes
  useEffect(() => {
    logger.logTraceUseEffect('GUIDE-SEARCH - notify parent of search state changes');

    onSearchStateChange(searchTerm, highlightSearchTerm);
  }, [searchTerm, highlightSearchTerm, onSearchStateChange]);

  const handleClear = useCallback(() => {
    logger.logTraceUseCallback('GUIDE-SEARCH - handleClear');

    setSearchTerm('');
    setCurrentMatchIndex(0);
    setAllMatches([]);
    setTimeout(() => searchInputRef.current?.focus(), 0);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      logger.logTraceUseCallback('GUIDE-SEARCH - handleKeyDown');

      if (e.key === 'Enter' && allMatches.length > 0) {
        e.preventDefault();
        const nextIndex = (currentMatchIndex + 1) % allMatches.length;
        const nextMatch = allMatches[nextIndex];

        setCurrentMatchIndex(nextIndex);
        onSectionChange(nextMatch.sectionIndex);

        setTimeout(() => {
          const currentMatch = document.querySelector('.current-match');
          if (currentMatch) {
            currentMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          searchInputRef.current?.focus();
        }, 300);
      }
    },
    [allMatches, currentMatchIndex, onSectionChange]
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {allMatches.length > 0 && (
                    <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {currentMatchIndex + 1} of {allMatches.length}
                    </Box>
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
