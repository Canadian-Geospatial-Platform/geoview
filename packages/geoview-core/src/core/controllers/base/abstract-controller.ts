export class AbstractController {
  //#region PUBLIC METHODS

  hook(): void {
    this.onHook();
  }

  unhook(): void {
    this.onUnhook();
  }

  //#endregion

  //#region PROTECTED METHODS

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected onHook(): void {
    // To be implemented by subclasses
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected onUnhook(): void {
    // To be implemented by subclasses
  }

  //#endregion
}
