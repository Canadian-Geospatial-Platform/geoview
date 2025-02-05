import { useTheme } from '@mui/material/styles';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Skeleton } from '@/ui';

/**
 * Custom data table skeleton build with table and mui skelton
 * @returns {JSX.Element}
 */
export default function DataSkeleton(): JSX.Element {
  const theme = useTheme();

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {[...Array(5).keys()].map((value) => (
              <TableCell sx={{ width: '20%' }} key={value}>
                <Skeleton variant="text" width="100%" height="25px" sx={{ bgcolor: theme.palette.grey[400] }} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {[...Array(20).keys()].map((row) => (
            <TableRow key={row} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              {[...Array(5).keys()].map((value) => (
                <TableCell sx={{ width: '20%' }} key={value}>
                  <Skeleton variant="text" width="100%" height="25px" sx={{ bgcolor: theme.palette.grey[400] }} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
