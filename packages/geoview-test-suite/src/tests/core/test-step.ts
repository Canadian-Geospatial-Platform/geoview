export class TestStep {
  /** The step message. */
  message: string;

  /** The step level. */
  level: TestStepLevel;

  /** The step color for display purposes. */
  color?: string;

  /**
   * Constructs a TestStep.
   *
   * @param message - The step message
   * @param level - The step level
   * @param color - Optional, the step color for display purposes
   */
  constructor(message: string, level: TestStepLevel = 'regular', color: string | undefined) {
    this.message = message;
    this.level = level;
    this.color = color;
  }
}

/** The level of the Test Step. */
export type TestStepLevel = 'regular' | 'major';
