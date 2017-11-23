import { StepFunctions } from 'aws-sdk';
import wrappedError from 'error/wrapped';

import { AWS_REGION } from '../../globals';
import { RUNNING, SUCCEEDED } from './constants';

/**
 * An error occurred whilst attempting to fetch execution status, or determining
 * the state of execution.
 *
 * @type {Error}
 */
const resumeError = wrappedError({
  message: 'Failure whilst attempting to resume pipeline execution.',
  type: 'pipeline',
});

/**
 * Handle retrieving the current execution status of the state machine, handling
 * the Flood.IO flood.
 *
 * If a terminal status is retrieved, the {@link Resume#perform} function will
 * resolve to be false, indicating that the action has completed (either successfully
 * or otherwise).
 */
export default class Resume {
  /**
   * Determines if a CodePipeline action step needs to continue resuming, or if
   * execution has completed.
   *
   * @param {String} executionArn - the AWS ARN of a Step Functions state machine.
   */
  constructor(executionArn) {
    /**
     * The ARN representing the step functions execution Arn.
     *
     * @type {String}
     */
    this.executionArn = executionArn;
  }

  /**
   * Determine the current status of the Step Functions Flood.IO execution.
   *
   * If a terminal status is retrieved, then the function will either return false
   * as well as a summary execution message, or throw an error if the state machine
   * exited on an error.
   *
   * If the status indicates the state machine is still executing, then this
   * function will resolve to true.
   *
   * @return {Array[Boolean, String]} false and a summary message if execution
   *   has finished successfully, true if execution is ongoing.
   */
  async perform() {
    try {
      const { status, message = '' } = await this.status();
      if (status !== RUNNING) {
        if (status !== SUCCEEDED) {
          throw new Error(`State machine executed with status of: "${status}"`);
        } else {
          return { resume: false, message };
        }
      } else {
        return { resume: true, message };
      }
    } catch (err) {
      throw resumeError(err);
    }
  }

  /**
   * Retrieve the status of a step functions execution.
   *
   * @return {Object} an object containing the status and a summary of the execution.
   */
  async status() {
    const { executionArn } = this;
    const stepfunctions = new StepFunctions({ region: AWS_REGION });
    const describe = stepfunctions.describeExecution({ executionArn }).promise();
    const { status, output: message } = await describe;
    return { status, message };
  }
}
