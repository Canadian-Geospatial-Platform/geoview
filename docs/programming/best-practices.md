# Best Practices #
In the VS Code development environment, many of the coding rules are imposed by the prettier and eslint code checkers. However, the
configuration of some rules is not easily done for these checkers. We must therefore, for these particular cases, rely on the
goodwill of our programmers. Here are some additional rules that you must follow.

## 1- Clearly identify the types of data you are using. ##

The decision to use typescript to code the GeoView application implies that we define the type of everything we declare in our
code. Otherwise, we would not have imposed this constraint on ourselves. Declaring types allows us to detect inconsistencies
in the code at the time of writing, which saves us from difficult debugging sessions when switching to runtime mode.

Never use `any` if you can define the type of the data used. The use of the `any` type is only allowed if it is impossible
to do otherwise. If you must use it, disable eslint detection on the previous line and insert a comment above the disable line
to explain why. It is strongly discouraged to disable the `any` type detection for the whole file because programmers who edit
the file in the future will not be warned if they use the type `any` without realizing it. Believe me, it can happen.

Avoid using TypeJsonObject, TypeJsonValue and TypeJsonArray types when you can define the structure of the type you use. These
three types should be used as a last resort, when we cannot accurately predict the structure of the data that usually comes
from a file or a URL.

When using react hooks, define the data type they use, even if it's trivial. This way of doing things allows the correct data
type to be associated with the hook so that typescript features can perform code validation. Type definition is done using the
brackets '<' and '>' as follows:

```ts
const [basemapList, setBasemapList] = useState<TypeBasemapProps[]>([]);
```

## 2- Avoid using variable names that are too short. ##

It is difficult to know what a variable with the name `e` refers to. Is it an `element`, an `event` or anything else whose name starts
with 'e'. In some cases, the name of the referred element does not even begin with 'e'. Don't hesitate to use long names like
`elementOfTheList`. This way, we know that the variable contains an element that comes from a list and if we know the type of the
list, we can even deduce the type of the `elementOfTheList` variable. The use of long variable names contributes to the
self-documentation of our code. This rule may seem to require more time to write our code, but the gain in clarity makes it much
faster to understand what the code does. Moreover, with the cut and paste and auto-completion features provided by the editor,
it doesn't take much longer to enter the code.

## 3- Avoid using existing names in third party libraries to declare elements of the GeoView code. ##

The OpenLayers library has a base class named Layer. If we use the identifier Layer to define a class in our code and at the same
time we use the Layer class of OpenLayers (`import { Layer as OLLayer } from 'ol/layer';`), it will be difficult to know at first
sight the type of a variable named `layer`. On the other hand, if we define our class as `GVlayer` and we use the OpenLayers `Layer` class
at the same time by associating the `layer` variable with the `Layer` type and `gvLayer` with the `GVlayer` type, the confusion is thus
cleared up.

## 4- Use inheritance whenever possible. ##

Inheritance eliminates the repetitive code needed to create disjoint classes that have basically the same characteristics. A base
class, whether abstract or not, can be used as a parent at the root of the inheritance tree to provide a starting template for child
classes. Inheritance also allows to exploit polymorphism. To do this, you just need to define a variable with a base class as type,
whether it is abstract or not. This variable can then be assigned any object of a derived class without having to negotiate the type.
Polymorphism allows to expose the common characteristics of the different classes of the inheritance tree. When we want to use child
specific fields, typescript allows us to code type guard functions that allow us to do a type ascension in a safer way than a blind
cast. The type guard functions have as parameter a polymorphic variable whose type is a parent class and use the known attributes of
this class to determine unambiguously that the type of the object passed as parameter corresponds to a child class of the inheritance
tree. They return a boolean as output and perform a type ascension to the type of the child if the value of this boolean is true.
Type guard functions are used in if clauses and when the boolean returned is true, the type of the parameter passed to the function
will have ascended to the child type for the duration of the block associated with the `then` section. This concept is a bit abstract
and difficult to explain, but the following code is a better way to understand what is going on.

```ts
class BaseClass {
  type: 'child_a' | 'chil_b';
  constructor(type: 'child_a' | 'chil_b') {
    this.type = type;
  }
}

class Child_A extends BaseClass {
  constructor() {
    super('child_a');
  }
}

// type guard function for Child_A
const childTypeIs_A = (verifyIfChildType: BaseClass): verifyIfChildType is Child_A => {
  return verifyIfChildType?.type === 'child_a';
};

// Here, we could do something similar to define a class and a type guard for child_b
const typeGuardExample = () {
  const instance: BaseClass = getTheInstanceByAnyMeans(); // Here, instance type is BaseClass

  if (childTypeIs_A(instance)) {
    // Inside this block, instance type is Child_A since the condition is true
  }
  // And here, instance type has returned to BaseClass
}
```

If you want to see how classes and type guards are used in the viewer, have a look at the
[payloads folder](../../../packages/geoview-core/src/api/events/payloads) and search where we use these payloads through the code.


## 5- Use the spreading operator only when necessary ##

When you spread two objects in the same object, sooner or later you run the risk of a collision. It is better to assign each
object to an attribute in order to partition their contents rather than cramming everything in the same level.

```ts
const object1 = { a: 'a', collision: 1 };
const object2 = { b: 'b', collision: 2 };

// Here, we have a collision and loose value of object1.collision
const spredingCollision = { ...object1, ...object2 };

// Here, value of attribute collision is preserved for both object
const noCollision = { object1, object2 };
```

## 6- Do not leave dead code in the source code ##

It is useless to comment old code segments in order to remember how the viewer used to work. This unduly pollutes the code and affects its readability. The code is kept in a github repository and it is possible to go back in time to see how the viewer was coded at a given date.

## 7- How we order the import statements

We do the import statement in the following order
* react
* react-dom
* react-i18n
* material-ui
* OpenLayers
* other project dependecies

We add an empty line between each group of import from different category
```
import { useRef, useEffect } from 'react';
import { render } from 'react-dom';

import { useTranslation } from 'react-i18next';

import { makeStyles, createStyles } from '@material-ui/core/styles';
import { Card, CardHeader, CardContent, Divider, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

import View, { ViewOptions } from 'ol/View';
```