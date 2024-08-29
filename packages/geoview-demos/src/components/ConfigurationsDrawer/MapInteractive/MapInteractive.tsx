import { LoadingButton } from '@mui/lab';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, ButtonGroup, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useContext } from 'react';
import { CGPVContext } from '../../../providers/cgpvContextProvider/CGPVContextProvider';
import GeneralAccordion from './GeneralAccordion';
import { NotificationsAccordion } from './EventsAccordion';

interface MapInteractiveProps {
  showConfigsList?: boolean;
}

export default function MapInteractive(props: MapInteractiveProps) {
  const cgpvContext = useContext(CGPVContext);

  if (!cgpvContext) {
    throw new Error('CGPVContent must be used within a CGPVProvider');
  }

  const { handleReloadMap, handleRemoveMap } = cgpvContext;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      <ButtonGroup variant="outlined" aria-label="Loading button group" size="small" sx={{mt: 2}}>
        <Button onClick={handleReloadMap}>Reload Map</Button>
        <LoadingButton onClick={handleRemoveMap}>Remove Map</LoadingButton>
      </ButtonGroup>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1-content" id="panel1-header">
          <Typography>General</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <GeneralAccordion showConfigsList={props.showConfigsList} />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel2-content" id="panel2-header">
          <Typography>Notifications/Events</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <NotificationsAccordion />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel2-content" id="panel2-header">
          <Typography>Panels - Navbar</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <NotificationsAccordion />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
