import React, { useContext } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CGPVContext } from '../../../providers/cgpvContextProvider/CGPVContextProvider';

export function NavbarPanelsAccordion() {
  const cgpvContext = useContext(CGPVContext);

  if (!cgpvContext) {
    throw new Error('CGPVContent must be used within a CGPVProvider');
  }

  const { configJson } = cgpvContext;

  return <div>Navbar Panels</div>;
}
