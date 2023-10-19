import { MutableRefObject, RefObject, useRef, useState } from "react";
import {
  TypeLegend,
  isVectorLegend,
  isWmsLegend,
  isImageStaticLegend,
  TypeWmsLegendStyle,
} from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeListOfLayerEntryConfig, TypeDisplayLanguage, layerEntryIsGroupLayer } from '@/geo/map/map-schema-types';
import { Box, BrowserNotSupportedIcon, CloseIcon, GroupWorkOutlinedIcon, IconButton, ListItemIcon, MoreHorizIcon, TodoIcon, Tooltip } from "@/ui";

const sxClasses = {
  expandableGroup: {
    paddingRight: 0,
    paddingLeft: 28,
  },
  expandableIconContainer: {
    paddingLeft: 10,
  },
  legendIcon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
    background: '#fff',
  },
  legendIconTransparent: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  maxIconImg: {
    maxWidth: 24,
    maxHeight: 24,
  },
  iconPreview: {
    marginLeft: 8,
    padding: 0,
    borderRadius: 0,
    border: '1px solid',
    borderColor: 'palette.grey.600',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    '&:focus': {
      border: 'revert',
    },
  },
  stackIconsBox: {
    position: 'relative',
    marginLeft: 8,
    '&:focus': {
      outlineColor: 'grey',
    },
  },
  iconPreviewHoverable: {
    position: 'absolute',
    left: -3,
    top: -2,
    padding: 0,
    borderRadius: 0,
    border: '1px solid',
    borderColor: 'grey.600',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    transition: 'transform .3s ease-in-out',
    '&:hover': {
      transform: 'rotate(-18deg) translateX(-8px)',
    },
  },
  iconPreviewStacked: {
    // marginLeft: 8,
    padding: 0,
    borderRadius: 0,
    border: '1px solid',
    borderColor: 'grey.600',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    background: '#fff',
  },
};

export interface LegendItemIconProps {
  layerId: string;
  mapId: string;
  isLegendOpen: boolean;
}

export function LegendItemIcon(props: LegendItemIconProps): JSX.Element {
  const { layerId, isLegendOpen } = props;

  const [iconType, setIconType] = useState<string | null>(null);
  const [iconImg, setIconImg] = useState<string | null>(null);
  const [iconImgStacked, setIconImgStacked] = useState<string | null>(null);
  const [iconList, setIconList] = useState<string[] | null>(null);
  const [groupItems, setGroupItems] = useState<TypeListOfLayerEntryConfig>([]);
  const [WMSStyles, setWMSStyles] = useState<TypeWmsLegendStyle[]>([]);
  const [currentWMSStyle, setCurrentWMSStyle] = useState<string>();

  const closeIconRef = useRef() as RefObject<HTMLButtonElement>;
  const stackIconRef = useRef() as MutableRefObject<HTMLDivElement | undefined>;
  const maxIconRef = useRef() as RefObject<HTMLButtonElement>;

  const getLegendDetails = (layerLegend: TypeLegend) => {
    if (layerLegend) {
      if (layerLegend.legend === null) setIconImg('no data');
      // WMS layers just return a string and get styles
      if (isWmsLegend(layerLegend) || isImageStaticLegend(layerLegend)) {
        if (isWmsLegend(layerLegend) && layerLegend.styles) {
          setWMSStyles(layerLegend.styles);
          setCurrentWMSStyle(layerLegend.styles[0].name);
        }
        setIconType('simple');
        if (layerLegend.legend) setIconImg(layerLegend.legend?.toDataURL());
      } else if (isVectorLegend(layerLegend) && layerLegend.legend) {
        Object.entries(layerLegend.legend).forEach(([, styleRepresentation]) => {
          if (styleRepresentation.arrayOfCanvas) {
            setIconType('list');
            const iconImageList = (styleRepresentation.arrayOfCanvas as HTMLCanvasElement[]).map((canvas) => {
              return canvas.toDataURL();
            });
            if (iconImageList.length > 0) setIconImg(iconImageList[0]);
            if (iconImageList.length > 1) setIconImgStacked(iconImageList[1]);
            if (styleRepresentation.defaultCanvas) iconImageList.push(styleRepresentation.defaultCanvas.toDataURL());
            if (styleRepresentation.clusterCanvas) iconImageList.push(styleRepresentation.clusterCanvas.toDataURL());
            setIconList(iconImageList);
          } else {
            setIconType('simple');
            setIconImg((styleRepresentation.defaultCanvas as HTMLCanvasElement).toDataURL());
          }
        });
      } else {
        // eslint-disable-next-line no-console
        console.log(`${layerId} - UNHANDLED LEGEND TYPE`);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log(`${layerId} - NULL LAYER DATA`);
    }
  };
  return (
    <ListItemIcon>
      {(groupItems.length > 0 || WMSStyles.length > 1) && (
        <IconButton color="primary">
          <GroupWorkOutlinedIcon />
        </IconButton>
      )}
      {groupItems.length === 0 && isLegendOpen && (
        <IconButton sx={sxClasses.iconPreview} color="primary" size="small" iconRef={closeIconRef}>
          {iconList || iconImg !== null ? <CloseIcon /> : <MoreHorizIcon />}
        </IconButton>
      )}
      {iconType === 'simple' && iconImg !== null && !isLegendOpen && WMSStyles.length < 2 && (
        <IconButton sx={sxClasses.iconPreview} color="primary" size="small" iconRef={maxIconRef}>
          {iconImg === 'no data' ? (
            <BrowserNotSupportedIcon />
          ) : (
            <Box sx={sxClasses.legendIcon}>
              <img alt="icon" src={iconImg} style={sxClasses.maxIconImg} />
            </Box>
          )}
        </IconButton>
      )}
      {iconType === 'list' && !isLegendOpen && (
        <Tooltip title={t('legend.expand_legend')!} placement="top" enterDelay={1000}>
          <Box
            tabIndex={0}
            sx={sxClasses.stackIconsBox}
            ref={stackIconRef}
          >
            <IconButton sx={sxClasses.iconPreviewStacked} color="primary" size="small" tabIndex={-1}>
              <Box sx={sxClasses.legendIconTransparent}>
                {iconImgStacked && <img alt="icon" src={iconImgStacked} style={sxClasses.maxIconImg} />}
              </Box>
            </IconButton>
            <IconButton sx={sxClasses.iconPreviewHoverable} color="primary" size="small" tabIndex={-1}>
              <Box sx={sxClasses.legendIcon}>{iconImg && <img alt="icon" src={iconImg} style={sxClasses.maxIconImg} />}</Box>
            </IconButton>
          </Box>
        </Tooltip>
      )}
      {groupItems.length === 0 && WMSStyles.length < 2 && !iconType && !isLegendOpen && (
        <IconButton sx={sxClasses.iconPreview} color="primary" size="small">
          <TodoIcon />
        </IconButton>
      )}
    </ListItemIcon>
  )
}