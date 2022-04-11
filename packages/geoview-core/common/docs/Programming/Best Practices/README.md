# Best Practices #
In the VS Code development environment, many of the coding rules are imposed by the prettier and eslint code checkers. However, the
configuration of some rules is not easily done for these checkers. We must therefore, for these particular cases, rely on the
goodwill of our programmers. Here are some additional rules that you must follow.

1- Avoid using variable names that are too short.

It is difficult to know what a variable with the name `e` refers to. Is it an `element`, an `event` or anything else whose name starts
with 'e'. In some cases, the name of the referred element does not even begin with 'e'. Don't hesitate to use long names like
`elementOfTheListe`. This way, we know that the variable contains an element that comes from a list and if we know the type of the
list, we can even deduce the type of the `elementOfTheListe` variable. The use of long variable names contributes to the
self-documentation of our code. This rule may seem to require more time to write our code, but the gain in clarity makes it much
faster to understand what the code does. Moreover, with the cut and paste and auto-completion features provided by the editor,
it doesn't take much longer to enter the code.

2- Avoid using existing names in third party libraries to declare elements of the GeoView code.

The leaflet library has a base class named Layer. If we use the identifier Layer to define a class in our code and at the same
time we use the Layer class of leaflet (`import { Layer as leafletLayer } from 'leaflet';`), it will be difficult to know at first
sight the type of a variable named `layer`. On the other hand, if we define our class as `GVlayer` and we use the leaflet `Layer` class
at the same time by associating the `layer` variable with the `Layer` type and `gvLayer` with the `GVlayer` type, the confusion is thus
cleared up.

3- Use inheritance whenever possible.

Inheritance eliminates the repetitive code required to create disjoint classes that have basically the same characteristics.
One can use an abstract class as a parent at the root of the inheritance tree to provide a template for child classes.
Inheritance also allows to exploit polymorphism. To do so, you just have to define a variable having as type a base class,
whether it is abstract or not. You can then assign any object of a derived class to this variable without having to negotiate
the type with the Cast function or the as operator. To see examples of inheritance, go to the geoview-core/src/core/abstract
folder.