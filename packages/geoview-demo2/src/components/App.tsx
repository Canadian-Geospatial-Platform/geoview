import React, { useContext, useEffect } from 'react';
import { AppBar, Box, Button, CssBaseline, Drawer, Grid, IconButton, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ConfigurationDrawer from './ConfigurationsDrawer/ConfigurationsDrawer';
import { ConfigTextEditor } from './ConfigTextEditor';
import { CGPVContext } from '../providers/cgpvContextProvider/CGPVContextProvider';
import { DEFAULT_CONFIG } from '../constants';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { MapRenderer } from './MapRenderer';


function App() {

  const cgpvContext = useContext(CGPVContext);

  if (!cgpvContext) {
    throw new Error('CGPVContent must be used within a CGPVProvider');
  }

  const { initializeMap, isInitialized } = cgpvContext;

  const drawerWidth = 440;

  //when component is mounted, initialize the map
  useEffect(() => {
    if (!isInitialized) {
      initializeMap("sandboxMap3", DEFAULT_CONFIG);
    }
  }, []);

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState('map');

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
  };

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  const renderBodyContent = () => {
    return (
      <Box sx={{ width: '100%', typography: 'body1' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={handleTabChange} aria-label="handling tabs change">
            <Tab label="Map" value="map" />
            <Tab label="Config Editor" value="config-editor" />
          </Tabs>
        </Box>
        <Box sx={{display: (selectedTab === 'map' ? 'unset' : 'none')}}>
          <MapRenderer />
        </Box>
        <Box sx={{display: (selectedTab === 'config-editor' ? 'unset' : 'none')}}>
          <ConfigTextEditor />
        </Box>
    </Box>
    )
  }


  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Canadian Geospatial Platform (CGP) - GeoView Project
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="settings panel"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            bgcolor: '#f4f4f4',
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          <ConfigurationDrawer />
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            bgcolor: '#f4f4f4',
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          <ConfigurationDrawer />
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, pt: 1, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        {renderBodyContent()}

      </Box>
    </Box>
  );
}

export default App;
