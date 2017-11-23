import { StepFunctions } from 'aws-sdk';
import typedError from 'error/typed';
import wrappedError from 'error/wrapped';

// import Logger from '../../logger';
import { AWS_REGION } from '../../globals';
import { STATE_MACHINE } from './constants';

import Uploader from './uploader';
import Artifact from './artifact';
import Parameters from './parameters';
import validate from './validate';

/**
 * A validation error was encountered
 *
 * @type {Error}
 */
const inputArtifactsError = typedError({
  message: 'No InputArtifacts defined.',
  type: 'pipeline.start',
});

/**
 * A validation error was encountered
 *
 * @type {Error}
 */
const executionError = wrappedError({
  message: 'State machine could not be executed. ({arn})',
  type: 'pipeline.start.execution',
});

/**
 * Handles initiating the execution of a Step Functions state machine, which handles
 * starting a Flood.IO load test.
 *
 * This class uses the object received from CodePipeline to resolve UserParameter
 * remote references and forms the input payload.
 */
export default class Start {
  /**
   * Starts a new execution of a Step Functions state machine by validating any
   * configuration and resolving remote artifact references for flood files as well
   * as any artifact parameters.
   *
   * @example
   * ```
   *  {
   *     "CodePipeline.job": {
   *         "id": "11111111-abcd-1111-abcd-111111abcdef",
   *         "accountId": "111111111111",
   *         "data": {
   *             "actionConfiguration": {
   *                 "configuration": {
   *                     "FunctionName": "MyLambdaFunctionForAWSCodePipeline",
   *                     "UserParameters": "some-input-such-as-a-URL"
   *                 }
   *             },
   *             "inputArtifacts": [
   *                 {
   *                     "location": {
   *                         "s3Location": {
   *                             "bucketName": "codepipeline-us-east-2-1234567890",
   *                             "objectKey": "frj9q0j09aj09j.zip"
   *                         },
   *                         "type": "S3"
   *                     },
   *                     "revision": null,
   *                     "name": "ArtifactName"
   *                 }
   *             ],
   *             "outputArtifacts": [],
   *             "artifactCredentials": {
   *                 "secretAccessKey": "....",
   *                 "sessionToken": "....",
   *                 "accessKeyId": "...."
   *             },
   *             "continuationToken": "A continuation token if continuing job"
   *         }
   *     }
   *  }
   * ```
   *
   * @param {Object} data - A CodePipeline data event object.
   */
  constructor({ data }) {
    /**
     * The data object as received from AWS CodePipeline.
     *
     * @type {Object}
     */
    this.data = data;
    /**
     * The parsed contents of the `UserParameters` string as defined inside the
     * action in the CodePipeline resource.
     *
     * @type {Object}
     */
    this.parameters = JSON.parse(this.data.actionConfiguration.configuration.UserParameters);
    const inputs = data.inputArtifacts;
    if (!inputs || inputs.length === 0) {
      throw inputArtifactsError({});
    }
    const mapper = a => Artifact.toArtifactMapEntry(a, data.artifactCredentials);
    /**
     * An array of {@link Artifact} objects which have been made available to
     * the CodePipeline action definition.
     *
     * These artifacts may be referenced by Parameters (Fn::GetParam keys)
     * as well as Files to be uploaded to Flood.IO.
     *
     * @type {String}
     */
    this.artifacts = inputs.map(mapper).reduce((memo, [key, val]) => {
      const obj = memo;
      obj[key] = val;
      return obj;
    }, {});
  }

  /**
   * Retrieve validated (and defaulted) parameters which have been defined inside
   * the action in the CodePipeline resource.
   *
   * @return {Object} valid parameters to be used to construct the state machine input.
   */
  async userParameters() {
    return await validate(this.parameters);
  }

  /**
   * Construct the input object that will be used to execute the state machine.
   *
   * This function will first validate the parameters defined inside the action,
   * resolve all remote artifact files (providing Signed URLs in their place)
   * as well as resolve all values which have been defined as parameter overrides.
   *
   * @return {Object} a validated, resolved input object, used to execute the
   *   state machine.
   */
  async input() {
    const { Files, Flood, Grids: grids, Parameters: params } = await this.userParameters();
    const files = await new Uploader(Files, this.artifacts).urls();
    const overrides = await new Parameters(params, this.artifacts).toOverrides();
    const flood = Object.assign(Flood, { grids }, { override_parameters: overrides });
    return { files, flood };
  }

  /**
   * This function handles starting the execution of the state machine after
   * resolving the input it requires.
   *
   * Resolving the input involves transforming artifact-references files, as well
   * as parameter overrides that have been defined, in addition to validating
   * the parameters which have been designed for the flood & grid test.
   *
   * @return {String} the Execution AWS Arn of the state machine.
   */
  async perform() {
    const input = await this.input();
    return await Start.start(JSON.stringify(input));
  }

  /**
   * Start a state machine execution using valid input and return the ARN of the
   * execution.
   *
   * @return {String} the AWS ARN of the Step Functions state machine execution.
   */
  static async start(input) {
    try {
      const stepfunctions = new StepFunctions({ region: AWS_REGION });
      const params = { stateMachineArn: STATE_MACHINE, input };
      const { executionArn } = await stepfunctions.startExecution(params).promise();
      return executionArn;
    } catch (err) {
      throw executionError(err, { arn: STATE_MACHINE });
    }
  }
}
