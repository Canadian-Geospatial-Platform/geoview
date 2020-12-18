# HOW TO ORDER IMPORTS

We do the import statement in the following order
* react
* react-dom
* react-i18n
* material-ui
* leaflet
* react-lealfet
* other project dependecies

We add an empty line between each group of import from different category

>import { useRef, useEffect } from 'react';
>import { render } from 'react-dom';
>
>import { useTranslation } from 'react-i18next';
>
>import { makeStyles, createStyles } from '@material-ui/core/styles';
>import { Card, CardHeader, CardContent, Divider, IconButton } from '@material-ui/core';
>import CloseIcon from '@material-ui/icons/Close';
>
>import { DomEvent } from 'leaflet';
>import { useMap } from 'react-leaflet';