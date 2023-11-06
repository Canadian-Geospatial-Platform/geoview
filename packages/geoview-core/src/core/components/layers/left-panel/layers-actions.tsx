import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Button } from '@mui/material';
import { Box, Typography, Stack, ExpandIcon, RemoveCircleOutlineIcon, AddCircleOutlineIcon } from '@/ui';
import { getSxClasses } from '../layers-style';

export function LayersActions(): JSX.Element {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
      <div>
        <Typography sx={sxClasses.categoryTitle}>{t('general.layers')}</Typography>
      </div>
      <Stack style={{ alignItems: 'center', gap: '15px' }} direction="row">
        <Button
          variant="contained"
          size="small"
          sx={{ backgroundColor: '#F4F5FF', borderRadius: '20px' }}
          startIcon={<ExpandIcon fontSize="small" sx={{ color: '#515BA5' }} />}
        >
          <Typography sx={sxClasses.legendButtonText}>{t('legend.re-arrange')}</Typography>
        </Button>
        <Button
          variant="contained"
          size="small"
          sx={{ backgroundColor: '#F4F5FF', borderRadius: '20px' }}
          startIcon={<AddCircleOutlineIcon fontSize="small" sx={{ color: '#515BA5' }} />}
        >
          <Typography sx={sxClasses.legendButtonText}>{t('general.add')}</Typography>
        </Button>
        <Button
          variant="contained"
          size="small"
          sx={{ backgroundColor: '#F4F5FF', borderRadius: '20px' }}
          startIcon={<RemoveCircleOutlineIcon fontSize="small" sx={{ color: '#515BA5' }} />}
        >
          <Typography sx={sxClasses.legendButtonText}>{t('general.remove')}</Typography>
        </Button>
      </Stack>
    </Box>
  );
}
