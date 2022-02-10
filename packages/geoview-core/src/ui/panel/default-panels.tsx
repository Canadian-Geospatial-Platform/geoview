import { Typography } from "@mui/material";
import LayersIcon from "@mui/icons-material/Layers";

import { TypeButtonPanelProps } from "../../core/types/cgpv-types";

/**
 * Create a layers button panel for the appbar
 */
export const LayersPanel: TypeButtonPanelProps = {
  button: {
    id: "layer-panel",
    tooltip: "appbar.layers",
    tooltipPlacement: "right",
    icon: <LayersIcon />,
    type: "textWithIcon",
  },
  panel: {
    title: "appbar.layers",
    icon: LayersIcon,
    content: (
      <Typography variant="body2" color="textSecondary" component="p">
        This is a place holder panel for the panel components
      </Typography>
    ),
    width: 300,
  },
};
