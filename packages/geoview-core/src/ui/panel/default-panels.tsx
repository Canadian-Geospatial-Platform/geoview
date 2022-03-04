import { Typography } from "@mui/material";
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
      <Typography variant="body2" color="textSecondary" component="p">
        This is a placeholder panel for the panel components
      </Typography>
    ),
    width: 300,
    status: false,
  },
};
