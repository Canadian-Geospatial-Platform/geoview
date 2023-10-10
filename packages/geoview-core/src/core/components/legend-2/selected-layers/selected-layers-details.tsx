import { Box, Grid } from '@/ui';

export function ShowSelectedLayers(): JSX.Element {
  return (
    <Grid item xs={6}>
      <Box>
        <p>All selected Layers will be displayed here eventually.</p>
      </Box>
    </Grid>
  );
}

// import React from 'react';
// import { Grid, Typography, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';

// export function ShowSelectedLayers({selectedLayers}): JSX.Element {

//   if (selectedLayers) {
//   const numItems = selectedLayers.length;

//   const selectedLayersList = selectedLayers.map((layer) => (
//     <TableRow key={layer}>
//       <TableCell>{layer}</TableCell>
//     </TableRow>
//   ));

//   return (
//     <Grid item sm={12}>
//       <TableContainer>
//         <div>
//           <Typography > Selection: Legend Overview </Typography>
//           <Typography sx={{ fontSize: '0.6em' }}> {numItems} items available </Typography>
//         </div>
//         <div>
//           <Table>
//             <TableBody>
//               <TableRow >
//                 <TableCell>Name</TableCell>
//               </TableRow>
//               {selectedLayersList}
//             </TableBody>
//           </Table>
//         </div>
//       </TableContainer>
//     </Grid>
//   );
// }
