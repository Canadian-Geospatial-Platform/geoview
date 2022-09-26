# Using TypeJson* #

Among the types that have been created for the GeoView application, those that allow working with Json-encoded data
are probably the most subtle to understand. For this reason we have put together some explanations here to help you
use them when programming.

## Characteristics to know when using the Json types ##

Json types were created to allow us working with data coming from the outside. When we read a Json file or request a URL to get a response in the 'application/json' format, it is usually not possible to guarantee a unique structure. This is where TypeJson* types come into play. These types allow to work with Json-encoded data without having to define a specific type for the data set used. They have the advantage of being able to adapt to a multitude of structures, or even a subset of the Json structure used without having to code a single type. They are in a way generic types. However, this advantage comes with a flaw. By their generic nature, the Json types we created accept any name for the nodes. A syntax error in the path to a node will not raise an error. So we have to be very careful when we write our paths. If we want to avoid this disadvantage, we must create a specific type for the data structure we want to use.

## The TypeJson* types ##

There are only three types defined to manipulate Json objects: TypeJsonObject, TypeJsonValue and TypeJsonArray. Let's start with the TypeJsonObject type. This type only applies to javascript objects of type object, defined using braces like this { ... }. We use it when we read data from a file, a URL or when we define a javascript object using braces. All attributes of a TypeJsonObject are TypeJsonObject, whether it is an intermediate node or a leaf node. A function named toJsonObject has been created to validate the conversion of a variable or an attribute to the TypeJsonObject type. The use of this function is necessary to guarantee that the object to be converted is of the form { ... }, which the Cast function does not do.

Here are two declaration examples that use the TypeJsonObject type.

- Declaration of a typed variable:

```ts
      getMetadata = async (): Promise<TypeJsonObject> => {
          const response = await fetch(`${this.url}?f=json`);
          const result: TypeJsonObject = await response.json();
          return result;
        };
```

- Declaration of a javascript object:

```ts
      translations = toJsonObject({
        en: {
          detailsPanel: 'Details',
          nothing_found: 'Nothing found',
          action_back: 'Back',
        },
        fr: {
          detailsPanel: 'Détails',
          nothing_found: 'Aucun résultats',
          action_back: 'Retour',
        },
      });
```

The TypeJsonObject type allows to code long access paths to the different nodes of the objects without having to deal with the error "Property 'x' does not exist on type 'y'". However, when we get to the node we are interested in, we may have to specify the data type of the actual node. This situation arises when we code functions whose parameter type is not a TypeJsonObject or an assignment when the left and right sides of the = operand are not both TypeJsonObject. An interesting fact to know is that it is possible to specify the type of the final node of a path as well on the left and right side of the assignment operator. Let's look at some examples.

```ts
      const aJsonObject = toJsonObject({ field1: { field2a: { field3: 'Value of field3' }, field2b: '' } });
      const doSomething = (parameter?: string): void => {
        if (parameter) doSomething();
      };
      const doSomethingElse = (parameter?: TypeJsonValue): void => {
        if (parameter) doSomething();
      };
      const aString: string = aJsonObject.field1.field2a.field3 as string;  // we must specify that the ending node on the right side of the assignment operator is a string
      (aJsonObject.field1.fiel2b as string) = aString; // we must specify that the ending node on the left side of the assignment operator is a string

      doSomething(aJsonObject.field1.fiel2a.field3 as string); // we must specify that the ending node of the parameter is a string
      doSomethingElse(aJsonObject.field1.fiel2a.field3); // string is compatible with TypeJsonValue
      doSomethingElse(aJsonObject.field1.fiel2a); // TypeJsonObject is compatible with TypeJsonValue
```

As you can see, a TypeJsonObject node cannot be assigned to a string unless you specify that the json node is a string. This rule applies to both assignments and function parameters. The type specification can be applied on the left side of the assignment operator. The TypeJsonObject, as well as any other types that are part of TypeJsonValue can be assigned to TypeJsonValue, but the inverse is not true.

Let's move on to the TypeJsonValue type. It allows to define the six valid types to compose json objects, namely: null value, string, number, boolean, array and json object. When you declare an attribute of this type, it can contain any of those types.

Finally, TypeJsonArray allows to define json arrays or to transform a TypeJsonObject node in a TypeJsonObject[].

## The recipe ##

Let' say I want to use a new component and needs to create type, event and payloads...
- Inside ```cgpv-types.ts``` I would need to import my MUI component, export my payload, export my type and create my element props signature
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

- I need to create a constant ts file, in my case ```slider.ts``` in the src/api/events/constants folder. This file will contains all the events associated with this component.


- I need to create a payload ts file, in my case ```slider-payloads.ts``` in the src/api/events/payloads folder. This file will contains the payload infromation for this component.

- I need to add my events inside the ```events.ts``` file.
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