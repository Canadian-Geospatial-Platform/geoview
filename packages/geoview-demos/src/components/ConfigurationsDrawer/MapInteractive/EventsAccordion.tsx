import React, { useContext } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CGPVContext } from '../../../providers/cgpvContextProvider/CGPVContextProvider';
import SplitButton from '../../SplitButton';

export function NotificationsAccordion() {
  const cgpvContext = useContext(CGPVContext);

  if (!cgpvContext) {
    throw new Error('CGPVContent must be used within a CGPVProvider');
  }

  const { configJson, mapId } = cgpvContext;

  const notificationTypes = ['info', 'warning', 'error', 'success'];

  const onNotificationsAdd = (selectedIndex: number) => {
    switch (notificationTypes[selectedIndex]) {
      case 'info':
        cgpv.api.maps[mapId].notifications.addNotificationMessage('this is an info notification');
        break;
      case 'warning':
        cgpv.api.maps[mapId].notifications.addNotificationWarning('this is an warning notification');
        break;
      case 'error':
        cgpv.api.maps[mapId].notifications.addNotificationError('this is an error notification');
        break;
      case 'success':
        cgpv.api.maps[mapId].notifications.addNotificationSuccess('this is a success notification title');
        break;
      default:
        console.log('Unknown snackbar type');
        break;
    }
  };

  const onSnackbarAdd = (selectedIndex: number) => {
    switch (notificationTypes[selectedIndex]) {
      case 'info':
        cgpv.api.maps[mapId].notifications.showMessage('this is an info snack-bar');
        break;
      case 'warning':
        cgpv.api.maps[mapId].notifications.showWarning('this is an warning snack-bar');
        break;
      case 'error':
        cgpv.api.maps[mapId].notifications.showError('this is an error snack-bar');
        break;
      case 'success':
        cgpv.api.maps[mapId].notifications.showSuccess('this is a success snack-bar');
        break;
      default:
        console.log('Unknown snackbar type');
        break;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
        <SplitButton label="Info" title="Add notification" onClick={onNotificationsAdd} options={notificationTypes} />

        <SplitButton label="Info" title="Add snackbar" onClick={onSnackbarAdd} options={notificationTypes} />
      </Box>
    </Box>
  );
}
