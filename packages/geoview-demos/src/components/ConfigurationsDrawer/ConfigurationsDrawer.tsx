import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Tab } from '@mui/material';
import { useState } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import GridViewIcon from '@mui/icons-material/GridView';
import MapInteractive from './MapInteractive/MapInteractive';
import { ConfigBuilderTab } from './ConfigBuilderTab/ConfigBuilderTab';

export default function ConfigurationDrawer() {
  const [selectedTab, setSelectedTab] = useState('settings');

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
  };

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={selectedTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleTabChange} aria-label="handling tabs change" variant="scrollable" scrollButtons="auto">
            <Tab icon={<SettingsIcon />} aria-label="settings" value="settings" />
            <Tab icon={<ListAltIcon />} aria-label="Features" value="features" />
          </TabList>
        </Box>
        <TabPanel value="settings" sx={{ padding: 0 }}>
          <MapInteractive />
        </TabPanel>
        <TabPanel value="features">
          <ConfigBuilderTab />
        </TabPanel>
      </TabContext>
    </Box>
  );
}
