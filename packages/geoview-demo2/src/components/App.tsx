import React, { useContext, useEffect } from 'react';
import { Button, Drawer, Grid } from '@mui/material';
import SettingsPanel from './SettingsPanel/SettingsPanel';
import RightPanel from './RightPanel';
import { ConfigTextEditor } from './ConfigTextEditor';
import { CGPVContext } from '../providers/cgpvContextProvider/CGPVContextProvider';
import { DEFAULT_CONFIG } from '../constants';


function App() {

  const cgpvContext = useContext(CGPVContext);

  if (!cgpvContext) {
    throw new Error('CGPVContent must be used within a CGPVProvider');
  }

  const { initializeMap, isInitialized } = cgpvContext;

  /*useEffect(() => {
    if (!isInitialized) {
      console.log("Initializing map-----------------------------------------------------------------------");
      initializeMap("sandboxMap3", DEFAULT_CONFIG);
    }
  }, []);*/

  const [settingsDrawerOpen, setSettingsDrawerOpen] = React.useState(false);

  const toggleSettingsDrawer = (newOpen: boolean) => () => {
    setSettingsDrawerOpen(newOpen);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4} lg={3} p={1}>
        <SettingsPanel />
      </Grid>
      <Grid item xs={12} md={8} lg={9} p={1}>
        <Button onClick={toggleSettingsDrawer(true)}>Open drawer</Button>
        <Drawer open={settingsDrawerOpen} onClose={toggleSettingsDrawer(false)}>
          <SettingsPanel />
        </Drawer>

        <RightPanel />
        <div id="sandboxMapContainer">
          <div id="sandboxMap3"></div>
        </div>
        <ConfigTextEditor />
      </Grid>
    </Grid>
  );
}

export default App;
