import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import makeStyles from '@mui/styles/makeStyles';

import { TypeBasemapCardProps } from '../../core/types/cgpv-types';

const useStyles = makeStyles((theme) => ({
  basemapCard: {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.light,
    display: 'flex',
    flexDirection: 'column',
    backgroundClip: 'padding-box',
    border: `1px solid ${theme.basemapPanel.borderDefault}`,
    borderRadius: 6,
    boxShadow: 'none',
    marginBottom: 16,
    transition: 'all 0.3s ease-in-out',
    '&:last-child': {
      marginBottom: 0,
    },
    '& .MuiCardHeader-root': {
      backgroundColor: theme.palette.primary.dark,
      color: theme.basemapPanel.header,
      fontSize: 14,
      fontWeight: 400,
      margin: 0,
      padding: '0 12px',
      height: 60,
      width: '100%',
      order: 2,
    },
    '& .MuiCardContent-root': {
      order: 1,
      height: 190,
      position: 'relative',
      padding: 0,
      '&:last-child': {
        padding: 0,
      },
      '& .basemapCardThumbnail': {
        position: 'absolute',
        height: '100%',
        width: '100%',
        objectFit: 'cover',
        top: 0,
        left: 0,
      },
      '& .basemapCardThumbnailOverlay': {
        display: 'block',
        height: '100%',
        width: '100%',
        position: 'absolute',
        backgroundColor: theme.basemapPanel.overlayDefault,
        transition: 'all 0.3s ease-in-out',
      },
    },
    '&:hover': {
      cursor: 'pointer',
      borderColor: theme.basemapPanel.borderHover,
      '& .MuiCardContent-root': {
        '& .basemapCardThumbnailOverlay': {
          backgroundColor: theme.basemapPanel.overlayHover,
        },
      },
    },
    '&.active': {
      borderColor: theme.basemapPanel.borderActive,
      '& .MuiCardContent-root': {
        '& .basemapCardThumbnailOverlay': {
          backgroundColor: theme.basemapPanel.overlayActive,
        },
      },
      '&:hover': {
        borderColor: 'rgba(255,255,255,0.75)',
        '& .MuiCardContent-root': {
          '& .basemapCardThumbnailOverlay': {
            backgroundColor: 'rgba(0,0,0,0)',
          },
        },
      },
    },
  },
}));

/**
 * Create a customized Material UI Card
 *
 * @param {TypeBasemapCardProps} props the properties passed to the BaseMapCard element
 * @returns {JSX.Element} the created Card element
 */

export function BasemapCard(props: TypeBasemapCardProps): JSX.Element {
  const classes = useStyles();
  const { thumbnailUrl, altText, title, ...rest } = props;
  return (
    <Card {...rest} classes={{ root: classes.basemapCard }}>
      <CardHeader title={title} component="h3" disableTypography />
      <CardContent>
        {typeof thumbnailUrl === 'string' && (
          // TODO - KenChase - If needed, add ability to display basemap description as an ovelay above the thumbnail image
          <img src={thumbnailUrl} className="basemapCardThumbnail" alt={altText} />
        )}
        {Array.isArray(thumbnailUrl) &&
          thumbnailUrl.map((thumbnail, index) => {
            // eslint-disable-next-line react/no-array-index-key
            return <img key={index} src={thumbnail} className="basemapCardThumbnail" alt={altText} />;
          })}
        <div className="basemapCardThumbnailOverlay" />
      </CardContent>
    </Card>
  );
}
