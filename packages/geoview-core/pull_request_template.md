## Checklist
<!-- Quick checklist for items that are easy to miss -->

* [ ] Commit message follow the guidelines
* [ ] PR targets the correct release version
* [ ] Deploy has been done
* [ ] Check styling
* [ ] _Help files and documentation have been updated_
* [ ] ~Release notes have been updated~

## What's to look for styling
* Use camelCase for identifier names (variables and functions)
* Use PascalCase for type names
* Do not use "I" as a prefix for interface names
* Do not export types/functions unless you need to share it across multiple components
* All names start with a letter
* Always put spaces around operators ( = + - * / ), and after colon:
* Remove all trailing white spaces
* Look for bad indentation
* Carriage return are mandatory
  * Before comments
  * Before if condition
  * After if condition
  * Before properties
  * Before classes
  * Before functions

The use of Prettier Visual Studio Code extension let's you format automatically your code to remove most of the styling issues like white space and indentation.
