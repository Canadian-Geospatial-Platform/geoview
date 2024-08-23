import { LoadingButton } from '@mui/lab';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, ButtonGroup, Typography } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useContext } from 'react';
import { CGPVContext } from '../../../providers/cgpvContextProvider/CGPVContextProvider';
import GeneralAccordion from './GeneralAccordion';
import { NotificationsAccordion } from './EventsAccordion';

export default function MapInteractive() {
  const cgpvContext = useContext(CGPVContext);

  if (!cgpvContext) {
    throw new Error('CGPVContent must be used within a CGPVProvider');
  }

  const { handleReloadMap, handleRemoveMap } = cgpvContext;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" sx={{ margin: 0 }}>
        Interactive Map
      </Typography>

      <ButtonGroup variant="outlined" aria-label="Loading button group" size="small" sx={{ marginBottom: '20px' }}>
        <Button onClick={handleReloadMap}>Reload Map</Button>
        <LoadingButton onClick={handleRemoveMap}>Remove Map</LoadingButton>
        <LoadingButton loading loadingPosition="start" startIcon={<SaveIcon />}>
          Apply
        </LoadingButton>
      </ButtonGroup>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1-content" id="panel1-header">
          <Typography>General</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <GeneralAccordion />
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

      <ButtonGroup variant="outlined" aria-label="outlined button group" size="small">
        <Button>Add notification</Button>
        <Button>Remove notification</Button>
      </ButtonGroup>

      <ButtonGroup variant="outlined" aria-label="outlined button group" size="small">
        <Button>Add Panel</Button>
        <Button>Remove Panel</Button>
      </ButtonGroup>
    </Box>
  );
}
