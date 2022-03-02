import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import HelpIcon from "@mui/icons-material/Help";

import { TypeButtonPanelProps } from "../../core/types/cgpv-types";

/**
 * Create a default button panel for the appbar
 */
export const DefaultPanel: TypeButtonPanelProps = {
  button: {
    id: "default-panel",
    tooltip: "Default",
    tooltipPlacement: "right",
    icon: <HelpIcon />,
    type: "textWithIcon",
  },
  panel: {
    title: "Default",
    icon: HelpIcon,
    content: (
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Age</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={10}
          label="Age"
          onChange={() => {}}
        >
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
      </FormControl>
    ),
    width: 300,
    status: false,
  },
};
