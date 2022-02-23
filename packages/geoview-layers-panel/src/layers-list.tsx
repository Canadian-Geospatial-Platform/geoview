/* eslint-disable react/no-array-index-key */
import { TypeLayersListProps } from "geoview-core";

const w = window as any;

/**
 * A react component that will list the map server layers defined in the map config
 * @param {TypeLayersListProps} props properties passed to the component
 * @returns a React JSX Element containing map server layers
 */
const LayersList = (props: TypeLayersListProps): JSX.Element => {
  const { layersData } = props;

  const cgpv = w["cgpv"];
  const { ui } = cgpv;

  const useStyles = ui.makeStyles(() => ({
    layersContainer: {
      overflow: "hidden",
      overflowY: "auto",
      width: "100%",
    },
    layerItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      margin: "5px 0",
      padding: "10px 5px",
      boxSizing: "content-box",
      "&:hover": {
        cursor: "pointer",
        backgroundColor: "#c9c9c9",
      },
      zIndex: 1000,
      border: "none",
      width: "100%",
    },
    layerParentText: {
      fontSize: "16px",
      fontWeight: "bold",
    },
    layerCountTextContainer: {
      display: "flex",
      alignItems: "center",
      width: "100%",
      height: "32px",
    },
    layerItemText: {
      fontSize: "14px",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
      marginLeft: "10px",
    },
  }));

  const classes = useStyles();

  return (
    <div className={classes.layersContainer}>
      {Object.keys(layersData).map((dataKey) => {
        const data = layersData[dataKey];
        return (
          <div key={data.id}>
            {Object.keys(data.layers).map((layerKey: string, index: number) => {
              const { layer, layerData, groupLayer } = data.layers[layerKey];
              return (
                <div
                  key={index}
                  tabIndex={layerData.length > 0 && !groupLayer ? 0 : -1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (!groupLayer) {
                        e.preventDefault();
                      }
                    }
                  }}
                  role="button"
                >
                  {groupLayer ? (
                    <div className={classes.layerParentText} title={layer.name}>
                      {layer.name}
                    </div>
                  ) : (
                    <button
                      type="button"
                      tabIndex={-1}
                      className={classes.layerItem}
                      disabled={layerData.length === 0}
                    >
                      <div className={classes.layerCountTextContainer}>
                        <div
                          className={classes.layerItemText}
                          title={layer.name}
                        >
                          {layer.name}
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default LayersList;
