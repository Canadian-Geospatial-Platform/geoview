/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState, useContext, useCallback, Fragment } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { FocusTrap } from '@mui/base/FocusTrap';

import { Map } from '@/core/components/map/map';
import { Appbar } from '@/core/components/app-bar/app-bar';
import { Navbar } from '@/core/components/nav-bar/nav-bar';
import { FooterTabs } from '@/core/components/footer-tabs/footer-tabs';
import { Geolocator } from '@/core/components/geolocator/geolocator';
import { Footerbar } from '@/core/components/footer-bar/footer-bar';

import { FocusTrapDialog } from './focus-trap';

import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';

import { Box, CircularProgress, Link, Modal, Snackbar } from '@/ui';
import {
  PayloadBaseClass,
  mapConfigPayload,
  payloadIsAMapComponent,
  payloadIsAModal,
  payloadIsAmapFeaturesConfig,
} from '@/api/events/payloads';
import { MapContext } from '@/core/app-start';
import { getShellSxClasses } from './containers-style';
import { useMapLoaded } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';
import ExportModal from '@/core/components/export/export-modal';
import DataTableModal from '@/core/components/data-table/data-table-modal';

/**
 * Interface for the shell properties
 */
interface ShellProps {
  shellId: string;
}

/**
 * Create a shell component to wrap the map and other components not inside the map
 * @param {ShellProps} props the shell properties
 * @returns {JSX.Element} the shell component
 */
export function Shell(props: ShellProps): JSX.Element {
  const { shellId } = props;

  const mapContext = useContext(MapContext);
  const mapFeaturesConfig = mapContext.mapFeaturesConfig!;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getShellSxClasses(theme);

  // render additional components if added by api
  const [components, setComponents] = useState<Record<string, JSX.Element>>({});
  const [update, setUpdate] = useState<number>(0);

  // get values from the store
  const mapLoaded = useMapLoaded();
  const activeTrapGeoView = useUIActiveTrapGeoView();

  /**
   * Causes the shell to re-render
   */
  const updateShell = useCallback(() => {
    setUpdate((prevState) => {
      return 1 + prevState;
    });
  }, []);

  const mapAddComponentHandler = (payload: PayloadBaseClass) => {
    if (payloadIsAMapComponent(payload)) {
      setComponents((tempComponents) => ({
        ...tempComponents,
        [payload.mapComponentId]: payload.component!,
      }));
    }
  };

  useEffect(() => {
    // listen to adding a new component events
    api.event.on(EVENT_NAMES.MAP.EVENT_MAP_ADD_COMPONENT, mapAddComponentHandler, shellId);

    const mapRemoveComponentHandler = (payload: PayloadBaseClass) => {
      if (payloadIsAMapComponent(payload)) {
        const tempComponents: Record<string, JSX.Element> = { ...components };
        delete tempComponents[payload.mapComponentId];

        setComponents(() => ({
          ...tempComponents,
        }));
      }
    };

    // listen to removing a component events
    api.event.on(EVENT_NAMES.MAP.EVENT_MAP_REMOVE_COMPONENT, mapRemoveComponentHandler, shellId);

    const modalCreateHandler = (payload: PayloadBaseClass) => {
      if (payloadIsAModal(payload)) updateShell();
    };

    // CHANGED
    api.event.on(EVENT_NAMES.MODAL.EVENT_MODAL_CREATE, modalCreateHandler, shellId);

    // Reload
    const mapReloadHandler = (payload: PayloadBaseClass) => {
      if (payloadIsAmapFeaturesConfig(payload)) {
        mapContext.mapFeaturesConfig = payload.mapFeaturesConfig;
        api.event.emit(mapConfigPayload(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, `${shellId}/delete_old_map`, payload.mapFeaturesConfig));
        updateShell();
      }
    };

    api.event.on(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, mapReloadHandler, shellId);

    return () => {
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_ADD_COMPONENT, shellId, mapAddComponentHandler);
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_REMOVE_COMPONENT, shellId, mapRemoveComponentHandler);
      api.event.off(EVENT_NAMES.MODAL.EVENT_MODAL_CREATE, shellId, modalCreateHandler);
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, shellId, mapReloadHandler);
    };
  }, [components, shellId, updateShell, mapContext, mapFeaturesConfig]);

  return (
    <Box sx={sxClasses.all}>
      <Link id={`toplink-${shellId}`} href={`#bottomlink-${shellId}`} tabIndex={0} sx={[sxClasses.skip, { top: '0px' }]}>
        {t('keyboardnav.start')}
      </Link>
      <FocusTrap open={activeTrapGeoView}>
        <Box id={`shell-${shellId}`} sx={sxClasses.shell} className="geoview-shell" key={update} tabIndex={-1}>
          <CircularProgress isLoaded={mapLoaded} />
          <Box sx={sxClasses.mapShellContainer} className="mapContainer">
            <Appbar />
            {/* load geolocator component if config includes in list of components in appBar */}
            {mapFeaturesConfig?.appBar?.includes('geolocator') && mapFeaturesConfig?.map.interaction === 'dynamic' && <Geolocator />}
            <Box sx={sxClasses.mapContainer}>
              <Map {...mapFeaturesConfig} />
              <Footerbar />
            </Box>
            {mapFeaturesConfig?.map.interaction === 'dynamic' && <Navbar />}
          </Box>
          {mapFeaturesConfig?.corePackages && mapFeaturesConfig?.corePackages.includes('footer-panel') && <FooterTabs />}
          {Object.keys(api.maps[shellId].modal.modals).map((modalId) => (
            <Modal key={modalId} id={modalId} open={false} mapId={shellId} />
          ))}
          {/* modal section start */}
          <FocusTrapDialog mapId={mapFeaturesConfig.mapId} focusTrapId={shellId} />
          <ExportModal />
          <DataTableModal />
          {/* modal section end */}
          {Object.keys(components).map((key: string) => {
            return <Fragment key={key}>{components[key]}</Fragment>;
          })}
          <Snackbar snackBarId={shellId} />
        </Box>
      </FocusTrap>
      <Link id={`bottomlink-${shellId}`} href={`#toplink-${shellId}`} tabIndex={0} sx={[sxClasses.skip, { bottom: '0px' }]}>
        {t('keyboardnav.end')}
      </Link>
    </Box>
  );
}
