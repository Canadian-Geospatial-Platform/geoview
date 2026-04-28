// V8-specific Error.captureStackTrace used by geochart dependency
interface ErrorConstructor {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  captureStackTrace?(targetObject: object, constructorOpt?: Function): void;
}
