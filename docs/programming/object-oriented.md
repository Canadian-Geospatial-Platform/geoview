# Object Oriented in Typescript #
Best practices in object-oriented programming (OOP) are crucial for writing clean, maintainable, and efficient code. Here are some key best practices to follow:

## 1. Encapsulation ##

Definition: Encapsulation is the practice of keeping the internal state and behavior of an object hidden from the outside world and only exposing a public interface.

Implementation: Use private and protected access modifiers to restrict access to internal state. Provide public getter and setter methods if necessary.

### Implementation restrictions ###

* Private variables are declared by preceding the property name with #.
* Getter set setters are declared using functions. The syntax used in JavaScript to declare getter and setter is not used. The reason is that it's easier to differentiate between public and private properties.

   **Example of a getter implemented using a function to get the value of a private variable**

```
   /**
    * The getter method that returns the serviceMetadata private property.
    *
    * @returns {TypeJsonObject} The GeoView service metadata.
    */
   getServiceMetadata(): TypeJsonObject {
     return this.#serviceMetadata;
   }
```

* It is forbidden to create class variables of type Promise. It's preferable to have a method that returns a Promise and centralizes the management of resolution and rejection.
* When you use the *definite assignment assertion* (! after a property declaration), include comments explaining why and indicating which code sections will affect the property.

   **Example of a *definite assignment assertion***

```
   // GV NOTE START ****************************************************************************************************
   // The following attributes use the 'definite assignment assertion' (! after the property name) to indicate that
   // it will not be null or undefined when used. It is not initialized by the constructor. We declare it here
   // to make it clear that this AbstractGeoviewLayerConfig class owns (and expects) these attributes.

   // The initialSettings property is initialized by the applyDefaultValues and the metadata processing methods.

   /** Initial settings to apply to the GeoView layer at creation time. */
   initialSettings!: TypeLayerInitialSettings;

   // The geoviewLayerType property is initialized by the children classes. Each child class knows the value to
   // assign to this property.

   /** Type of GeoView layer. */
   geoviewLayerType!: TypeGeoviewLayerType;

   // GV NOTE END *****************************************************************************************************
```

## 2. Abstraction ##

Definition: Abstraction involves creating simple interfaces for complex systems. It allows you to hide the implementation details and show only the necessary features of an object.

Implementation: Use abstract classes and interfaces to define common methods and properties. Implement these interfaces in concrete classes.

## 3. Inheritance ##

Definition: Inheritance is a mechanism for creating a new class from an existing class. The new class inherits the properties and methods of the existing class.

Implementation: Use inheritance to promote code reuse. Ensure that the inheritance hierarchy is logical and represents an "is-a" relationship.

## 4. Polymorphism ##

Definition: Polymorphism allows objects to be treated as instances of their parent class rather than their actual class. It enables one interface to be used for a general class of actions.

Implementation: Use method overriding and interface implementation to achieve polymorphism. This allows for dynamic method binding and reduces coupling.

## 5. Composition over Inheritance ##

Definition: Favor composition over inheritance to achieve greater flexibility. Composition involves building complex objects from simpler ones by combining them.

Implementation: Use member variables to hold references to other objects. This allows you to reuse functionality without creating a rigid class hierarchy.

## 6. Single Responsibility Principle (SRP) ##

Definition: A class should have only one reason to change, meaning it should have only one job or responsibility.

Implementation: Ensure that each class is focused on a single task or responsibility. Split large classes into smaller, more focused ones if necessary.

## 7. Open/Closed Principle (OCP) ##

Definition: Software entities should be open for extension but closed for modification.

Implementation: Use abstract classes and interfaces to allow new functionality to be added without modifying existing code. Rely on polymorphism to extend behaviors.

## 8. Liskov Substitution Principle (LSP) ##

Definition: Subtypes must be substitutable for their base types without affecting the correctness of the program.

Implementation: Ensure that subclasses override methods in a way that does not break the expected behavior of the base class. Avoid violating the expected behavior of methods.

## 9. Interface Segregation Principle (ISP) ##

Definition: No client should be forced to depend on methods it does not use. Interface should be small and specific rather than large and general.

Implementation: Split large interfaces into smaller, more specific ones. This prevents implementing classes from having to provide unnecessary methods.

## 10. Dependency Inversion Principle (DIP) ##

Definition: High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details; details should depend on abstractions.

Implementation: Use dependency injection to provide dependencies to classes. Rely on interfaces and abstract classes to define dependencies.

## 11. DRY (Don't Repeat Yourself) ##

Definition: Avoid code duplication by abstracting common functionality into methods or classes.

Implementation: Refactor common code into reusable methods or classes. Use inheritance and composition to share functionality.

## 12. KISS (Keep It Simple, Stupid) ##

Definition: Keep your code simple and avoid unnecessary complexity.

Implementation: Write clear, straightforward code. Avoid over-engineering solutions and focus on simplicity and readability.

## 13. YAGNI (You Aren't Gonna Need It) ##

Definition: Don't add functionality until it is necessary.

Implementation: Implement features as they are needed rather than anticipating future requirements. This prevents unnecessary complexity.

## 14. Code Reviews and Pair Programming ##

Definition: Regularly review code with peers to identify issues and improve code quality.

Implementation: Conduct code reviews and engage in pair programming sessions to share knowledge and ensure adherence to best practices.

## 15. Unit Testing and Test-Driven Development (TDD) ##

Definition: Write tests to verify that your code works as expected. Use TDD to write tests before writing the actual code.

Implementation: Write unit tests for your classes and methods. Use testing frameworks and practice TDD to ensure your code is reliable and maintainable.

Following these best practices in object-oriented programming will help you write code that is clean, maintainable, and scalable.
