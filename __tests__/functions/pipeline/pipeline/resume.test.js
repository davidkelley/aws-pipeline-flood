/* eslint-disable import/no-unresolved */

import Resume from '@functions/pipeline/pipeline/resume';

import faker from 'faker';
import AWS from 'aws-sdk-mock';

describe('Resume', () => {
  const executionArn = faker.random.uuid();

  describe('#new', () => {
    const resume = new Resume(executionArn);

    it('returns the correct values', () => {
      expect(resume.executionArn).toEqual(executionArn);
    });
  });

  describe('#perform', () => {
    describe('when the status can be retrieved', () => {
      describe('when the state machine is running', () => {
        const status = 'RUNNING';

        beforeEach(() => {
          AWS.mock('StepFunctions', 'describeExecution', (params, cb) => {
            process.nextTick(() => { cb(null, { status }); });
          });
        });

        afterEach(() => {
          AWS.restore('StepFunctions', 'describeExecution');
        });

        it('returns true', () => {
          const resume = new Resume(executionArn);
          return expect(resume.perform()).resolves.toEqual({ resume: true, message: '' });
        });
      });

      describe('when the state machine is not running', () => {
        describe('when the state machine has succeeded', () => {
          const status = 'SUCCEEDED';

          const output = JSON.stringify({ [faker.random.uuid()]: faker.random.words() });

          beforeEach(() => {
            AWS.mock('StepFunctions', 'describeExecution', (params, cb) => {
              process.nextTick(() => { cb(null, { status, output }); });
            });
          });

          afterEach(() => {
            AWS.restore('StepFunctions', 'describeExecution');
          });

          it('returns false', () => {
            const resume = new Resume(executionArn);
            return expect(resume.perform()).resolves.toEqual({ resume: false, message: output });
          });
        });

        describe('when the state machine has failed', () => {
          const status = 'FAILED';

          const output = JSON.stringify({ [faker.random.uuid()]: faker.random.words() });

          beforeEach(() => {
            AWS.mock('StepFunctions', 'describeExecution', (params, cb) => {
              process.nextTick(() => { cb(null, { status, output }); });
            });
          });

          afterEach(() => {
            AWS.restore('StepFunctions', 'describeExecution');
          });

          it('rejects with an error', () => {
            const resume = new Resume(executionArn);
            return expect(resume.perform()).rejects.toEqual(expect.any(Error));
          });
        });
      });
    });

    describe('when the status cannot be retrieved', () => {
      test('TODO: not implemented');
    });
  });

  describe('#status', () => {
    const status = faker.random.arrayElement(['SUCCEEDED', 'RUNNING', 'TIMED_OUT']);

    beforeEach(() => {
      AWS.mock('StepFunctions', 'describeExecution', (params, cb) => {
        process.nextTick(() => { cb(null, { status, output: '' }); });
      });
    });

    afterEach(() => {
      AWS.restore('StepFunctions', 'describeExecution');
    });

    it('returns the correct status', () => {
      const resume = new Resume(executionArn);
      return expect(resume.status()).resolves.toEqual({ status, message: '' });
    });
  });
});
