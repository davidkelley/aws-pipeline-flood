import { CodePipeline } from 'aws-sdk';
import Logger from '../logger';

import { AWS_REGION } from '../globals';

import Start from './pipeline/start';
import Resume from './pipeline/resume';

const client = new CodePipeline({ region: AWS_REGION });

export async function handler(event, context, cb) {
  const pipeline = event['CodePipeline.job'];
  Logger.info(JSON.stringify(pipeline, null, '  '));
  const { id, data: { continuationToken } } = pipeline;
  try {
    const result = { jobId: id };
    if (continuationToken) {
      const resume = new Resume(continuationToken);
      const { resume: resuming, message: summary = '' } = await resume.perform();
      if (resuming) {
        result.continuationToken = continuationToken;
      } else {
        result.executionDetails = { summary };
      }
    } else {
      const start = new Start(pipeline);
      result.continuationToken = await start.perform();
    }
    await client.putJobSuccessResult(result).promise();
    cb(null, result);
  } catch (err) {
    await client.putJobFailureResult({
      jobId: id,
      failureDetails: {
        message: err.message,
        type: 'JobFailed',
      },
    }).promise();
    cb(err);
    Logger.error(err);
  }
}
