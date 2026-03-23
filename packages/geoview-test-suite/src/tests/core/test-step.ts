export class TestStep {
  /**
   * Constructs a TestStep.
   *
   * @param message - The step message
   * @param level - The step level
   * @param color - The step color for display purposes
   */
  constructor(
    public message: string,
    public level: TestStepLevel = 'regular',
    public color: string = 'black'
  ) {}
}

/** The level of the Test Step. */
export type TestStepLevel = 'regular' | 'major';
