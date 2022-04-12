# Best Practices #
In the VS Code development environment, many of the coding rules are imposed by the prettier and eslint code checkers. However, the
configuration of some rules is not easily done for these checkers. We must therefore, for these particular cases, rely on the
goodwill of our programmers. Here are some additional rules that you must follow.

## 1- Clearly identify the types of data you are using. ##

The decision to use typescript to code the GeoView application implies that we define the type of everything we declare in our
code. Otherwise, we would not have imposed this constraint on ourselves. Declaring types allows us to detect inconsistencies
in the code at the time of writing, which saves us from difficult debugging sessions when switching to runtime mode.

Never use `any` if you can define the type of the data used. The use of type `any` is only permitted if it is impossible
to do otherwise. If you are forced to use it, insert a comment on the previous line to explain why.

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
`elementOfTheListe`. This way, we know that the variable contains an element that comes from a list and if we know the type of the
list, we can even deduce the type of the `elementOfTheListe` variable. The use of long variable names contributes to the
self-documentation of our code. This rule may seem to require more time to write our code, but the gain in clarity makes it much
faster to understand what the code does. Moreover, with the cut and paste and auto-completion features provided by the editor,
it doesn't take much longer to enter the code.

## 3- Avoid using existing names in third party libraries to declare elements of the GeoView code. ##

The leaflet library has a base class named Layer. If we use the identifier Layer to define a class in our code and at the same
time we use the Layer class of leaflet (`import { Layer as leafletLayer } from 'leaflet';`), it will be difficult to know at first
sight the type of a variable named `layer`. On the other hand, if we define our class as `GVlayer` and we use the leaflet `Layer` class
at the same time by associating the `layer` variable with the `Layer` type and `gvLayer` with the `GVlayer` type, the confusion is thus
cleared up.

## 4- Use inheritance whenever possible. ##

Inheritance eliminates the repetitive code required to create disjoint classes that have basically the same characteristics.
One can use an abstract class as a parent at the root of the inheritance tree to provide a template for child classes.
Inheritance also allows to exploit polymorphism. To do so, you just have to define a variable having as type a base class,
whether it is abstract or not. You can then assign any object of a derived class to this variable without having to negotiate
the type with the Cast function or the as operator. To see examples of inheritance, go to the geoview-core/src/core/abstract
folder.

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

