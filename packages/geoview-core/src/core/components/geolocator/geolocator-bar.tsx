import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, AppBarUI, Box, IconButton, Toolbar } from '@/ui';
import { StyledInputField } from '@/core/components/geolocator/geolocator-style';
import { logger } from '@/core/utils/logger';

interface GeolocatorBarProps {
  /** Current search input value */
  searchValue: string;
  /** Called when search input changes */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Called when search is triggered (via button or form submit) */
  onSearch: () => void;
  /** Called when reset/clear button is clicked */
  onReset: () => void;
  /** Loading state to disable search while fetching */
  isLoading: boolean;
  /** Ref for the search input element */
  inputRef?: React.RefObject<HTMLInputElement>;
}

export function GeolocatorBar({ searchValue, onChange, onSearch, onReset, isLoading, inputRef }: GeolocatorBarProps): JSX.Element {
  logger.logTraceRender('components/geolocator/geolocator-bar');

  // Hooks
  const { t } = useTranslation();

  return (
    <AppBarUI position="static" component="div">
      <Toolbar variant="dense">
        <form
          role="search"
          aria-label={t('geolocator.searchFormLabel')!}
          onSubmit={(e) => {
            e.preventDefault();
            if (!isLoading) onSearch();
          }}
        >
          <StyledInputField
            type="search"
            inputProps={{
              'aria-label': t('geolocator.searchInputLabel')!,
              'aria-controls': 'geolocator-results-region',
            }}
            placeholder={t('geolocator.search')!}
            onChange={onChange}
            value={searchValue}
            inputRef={inputRef}
          />
          <Box sx={{ display: 'flex', marginLeft: 'auto', alignItems: 'center' }}>
            <IconButton
              edge="end"
              aria-label={t('geolocator.searchClose')}
              className="buttonOutline"
              size="small"
              sx={{ mr: 2, ml: 4 }}
              onClick={onReset}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </form>
      </Toolbar>
    </AppBarUI>
  );
}
