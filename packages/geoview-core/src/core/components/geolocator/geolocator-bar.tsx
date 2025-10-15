import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import { CloseIcon, SearchIcon, AppBarUI, Box, Divider, IconButton, Toolbar } from '@/ui';
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
}

export function GeolocatorBar({ searchValue, onChange, onSearch, onReset, isLoading }: GeolocatorBarProps): JSX.Element {
  logger.logTraceRender('components/geolocator/geolocator-bar');

  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <AppBarUI position="static">
      <Toolbar variant="dense">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isLoading) onSearch();
          }}
        >
          <StyledInputField placeholder={t('geolocator.search')!} autoFocus onChange={onChange} value={searchValue} />
          <Box sx={{ display: 'flex', marginLeft: 'auto', alignItems: 'center' }}>
            <IconButton size="small" edge="end" color="inherit" sx={{ mr: 4 }} disabled={!searchValue.length} onClick={onSearch}>
              <SearchIcon sx={{ fontSize: theme.palette.geoViewFontSize.sm }} />
            </IconButton>
            <Divider orientation="vertical" variant="middle" flexItem />
            <IconButton size="small" edge="end" color="inherit" sx={{ mr: 2, ml: 4 }} onClick={onReset}>
              <CloseIcon sx={{ fontSize: theme.palette.geoViewFontSize.sm }} />
            </IconButton>
          </Box>
        </form>
      </Toolbar>
    </AppBarUI>
  );
}
