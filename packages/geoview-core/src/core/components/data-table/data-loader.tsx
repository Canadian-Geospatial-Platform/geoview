import { memo } from 'react';
import { Box, CircularProgress } from '@mui/material';

function DataLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <CircularProgress />
    </Box>
  );
}
export default memo(DataLoader);
