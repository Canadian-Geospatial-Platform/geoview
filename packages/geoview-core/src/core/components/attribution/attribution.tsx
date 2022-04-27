import React, { useCallback, useContext, useEffect, useState } from 'react';

import makeStyles from '@mui/styles/makeStyles';

import { LEAFLET_POSITION_CLASSES } from '../../../geo/utils/constant';

import { api } from '../../../app';
import { EVENT_NAMES } from '../../../api/events/event';

import { MapContext } from '../../app-start';
import { payloadIsAButtonPanel } from '../../../api/events/payloads/button-panel-payload';

const useStyles = makeStyles((theme) => ({
  attributionContainer: {
    marginLeft: '50px',
    backgroundColor: theme.palette.primary.light,
    padding: theme.spacing(0, 4),
  },
  attributionText: {
    margin: '0 !important',
    padding: theme.spacing(2),
    fontSize: theme.typography.subtitle2.fontSize,
  },
}));

type AttributionProps = {
  attribution: string;
};

/**
 * Create an Attribution component that will display an attribution box
 * with the attribution text
 * @param props attribution properties to get the attribution text
 */
export function Attribution(props: AttributionProps): JSX.Element {
  const { attribution } = props;

  const [, setUpdateComponent] = useState(0);

  const classes = useStyles();

  const mapConfig = useContext(MapContext);

  const mapId = mapConfig.id;

  /**
   * function that causes rerender when changing appbar content
   */
  const updateComponent = useCallback(() => {
    setUpdateComponent((refresh) => refresh + 1);
  }, []);

  useEffect(() => {
    // listen to new panel creation
    api.event.on(
      EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE,
      (payload) => {
        if (payloadIsAButtonPanel(payload)) {
          if (payload.handlerName && payload.handlerName === mapId) {
            updateComponent();
          }
        }
      },
      mapId
    );

    // listen on panel removal
    api.event.on(
      EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE,
      (payload) => {
        if (payloadIsAButtonPanel(payload)) {
          if (payload.handlerName && payload.handlerName === mapId) {
            updateComponent();
          }
        }
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE, mapId);
      api.event.off(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE, mapId);
    };
  }, [mapId, updateComponent]);

  return (
    <div
      className={[classes.attributionContainer, LEAFLET_POSITION_CLASSES.bottomleft].join(' ')}
      style={{
        marginLeft: Object.keys(api.map(mapId).appBarButtons.getAllButtonPanels()).filter((buttonPanel) => {
          return api.map(mapId).appBarButtons.getAllButtonPanels()[buttonPanel].button?.visible;
        }).length
          ? 50
          : 0,
      }}
    >
      <span className={['leaflet-control', classes.attributionText].join(' ')}>{attribution}</span>
    </div>
  );
}
