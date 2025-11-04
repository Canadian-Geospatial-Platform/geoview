# Using Types

This document provides guidance on creating types, events, and payloads for new components in the GeoView application.

## Creating Types for New Components

Let' say I want to use a new component and needs to create type, event and payloads...

- Inside `external-types.ts` I would need to import my MUI component, export my payload, export my type and create my element props signature

```ts
      import {
        ...
        SliderProps,
        ...
      } from '@mui/material';

      export * from '../../api/events/payloads/slider-payload';

      export type TypeCGPVMUI = {
        ...
        Slider: typeof MUI.Slider;
        ...
      };

      /**
       * Properties for the Slider
       */
      export interface TypeSliderProps extends SliderProps {
        min: number;
        max: number;
        value: Array<number> | number;
        marks?: Array<{ label?: string, value: number }>;
        step?: number;
        size?: 'small' | 'medium';
        orientation?: 'horizontal' | 'vertical';
        disabled?: boolean;
        mapId?: string;
      }
```

- I need to create a constant ts file, in my case `slider.ts` in the src/api/events/constants folder. This file will contains all the events associated with this component.

- I need to create a payload ts file, in my case `slider-payloads.ts` in the src/api/events/payloads folder. This file will contains the payload infromation for this component.

- I need to add my events inside the `events.ts` file.

```ts
      import { SLIDER, SliderEventKey } from './constants/slider';

      /**
       * constant contains event names
       */
      export const EVENT_NAMES = {
        ...
        SLIDER,
        ...
      };

      export type EventCategories =
        ...
        | 'SLIDER'
        ...;

      export type EventKey =
        ...
        | SliderEventKey
        ...;

    export type EventStringId =
      ...
      | 'slider/on_change_value'
      | 'slider/set_values'
      | 'slider/set_min_max'
      ...;
```
