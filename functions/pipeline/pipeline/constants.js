/**
 * Configures the S3 Bucket name of where Flood.IO flood files (ie. .jmx) files
 * will be stored.
 *
 * @type {String}
 */
export const FILE_BUCKET = process.env.FILE_BUCKET;

/**
 * Configures the AWS ARN of an AWS Step Functions state machine.
 *
 * Note this value is typically configured inside the Lambda function.
 *
 * @type {String}
 */
export const STATE_MACHINE = process.env.STATE_MACHINE;

/**
 * Indicates that the State Machine execution has completed successfully.
 *
 * @type {String}
 */
export const SUCCEEDED = 'SUCCEEDED';

/**
 * Indicates that the State Machine execution status is currently running.
 *
 * @type {String}
 */
export const RUNNING = 'RUNNING';
