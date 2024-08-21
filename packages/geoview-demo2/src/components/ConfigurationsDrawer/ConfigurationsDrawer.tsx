import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Tab } from "@mui/material";
import { useState } from "react";
import SettingsIcon from '@mui/icons-material/Settings';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import GridViewIcon from '@mui/icons-material/GridView';
import SettingsTab from "./SettingsTab";
import { ConfigBuilderTab } from "./ConfigBuilderTab";


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
        <TabPanel value="settings">
          <SettingsTab />
        </TabPanel>
        <TabPanel value="features">
          <ConfigBuilderTab />
        </TabPanel>
      </TabContext>
    </Box>

  );
}
