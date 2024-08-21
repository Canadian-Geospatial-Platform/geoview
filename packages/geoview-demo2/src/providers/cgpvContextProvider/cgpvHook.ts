import { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_DISPLAY_LANGUAGE, DEFAULT_DISPLAY_PROJECTION, DEFAULT_DISPLAY_THEME, DEFAULT_MAP_HEIGHT, DEFAULT_MAP_WIDTH } from "../../constants";


export function useCgpvHook() {

  const [mapId, setMapId] = useState<string>('sandboxMap2');
  const [displayLanguage, setDisplayLanguage] = useState<string>(DEFAULT_DISPLAY_LANGUAGE);
  const [displayTheme, setDisplayTheme] = useState<string>(DEFAULT_DISPLAY_THEME);
  const [displayProjection, setDisplayProjection] = useState<number | string>(DEFAULT_DISPLAY_PROJECTION);
  const [mapWidth, setMapWidth] = useState<number>(DEFAULT_MAP_WIDTH);
  const [mapHeight, setMapHeight] = useState<number>(DEFAULT_MAP_HEIGHT);
  const [configFilePath, setConfigFilePath] = useState<string>('');
  const [configJson, setConfigJson] = useState<object>({});
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const initializeMap = (mapId: string, config: string | object) => {
    if(isInitialized) return;
    setIsInitialized(true);
    const configJson = typeof config === 'string' ? JSON.parse(config) : config;
    handleCreateMap(mapId, configJson);
    cgpv.init((mapId: string) => {
      // write some code ...
      
    });
  }

  const handleConfigFileChange = (filePath: string | null) => {
    if (!filePath) return;
    setConfigFilePath(filePath);
    fetch(`./assets/configs/${filePath}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        handleConfigJsonChange(data);
      })

  }

  //removes map and creates a new map
  const handleRemoveMap = (): string => {
    cgpv.api.maps[mapId]?.remove(true);

    const newMapId = 'sandboxMap_' + uuidv4();
    // replace div with id 'sandboxMap' with another div
    const mapContainerDiv = document.getElementById('sandboxMapContainer');
    const newDiv = document.createElement('div');
    newDiv.id = newMapId;
    mapContainerDiv?.appendChild(newDiv);
    setMapId(newMapId);

    return newMapId;
  }

  const handleReloadMap = () => {
    cgpv.api.maps[mapId].reload();
  }

  const handleDisplayLanguage = (e: any) => {
    setDisplayLanguage(e.target.value);
    cgpv.api.maps[mapId].setLanguage(e.target.value);
  }

  const handleDisplayTheme = (e: any) => {
    setDisplayTheme(e.target.value);
    cgpv.api.maps[mapId].setTheme(e.target.value);
  }

  const handleDisplayProjection = (e: any) => {
    setDisplayProjection(e.target.value);
    cgpv.api.maps[mapId].setProjection(e.target.value);
  }

  const handleCreateMap = (theMapId: string, data: any) => {
    cgpv.api.createMapFromConfig(theMapId, JSON.stringify(data));
    setConfigJson({ ...data });
    setMapId(theMapId);
  }

  //when config settings changes recreate map
  const handleConfigJsonChange = (data: any) => {
    // pre-select theme and projection from config file
    setDisplayTheme(data.theme);
    setDisplayProjection(data.map.viewSettings.projection);

    const newMapId = handleRemoveMap();
    setTimeout(() => {
      // create map
      handleCreateMap(newMapId, data);

    }, 1500);
  }

  return {
    displayLanguage,
    displayTheme,
    displayProjection,
    configFilePath,
    configJson,
    mapWidth,
    setMapWidth,
    mapHeight,
    setMapHeight,
    isInitialized,

    initializeMap,
    handleDisplayLanguage,
    handleDisplayTheme,
    handleDisplayProjection,
    handleReloadMap,
    handleRemoveMap,
    handleConfigFileChange,
    handleConfigJsonChange
  }
}