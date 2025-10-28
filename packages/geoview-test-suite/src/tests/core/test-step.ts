export class TestStep {
  /**
   * Constructs a TestStep.
   * @param {string} message - The step message
   */
  constructor(
    public message: string,
    public level: TestStepLevel = 'regular',
    public color: string = 'black'
  ) {}
}

/**
 * The level of the Test Step.
 */
export type TestStepLevel = 'regular' | 'major';
