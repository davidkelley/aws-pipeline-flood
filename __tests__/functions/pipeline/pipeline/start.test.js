/* eslint-disable import/no-unresolved */

import Start from '@functions/pipeline/pipeline/start';
import Artifact from '@functions/pipeline/pipeline/artifact';

import faker from 'faker';
import AWS from 'aws-sdk-mock';
import Zip from 'node-zip';

describe('Start', () => {
  const executionArn = faker.random.uuid();

  const artifactName = faker.random.word();

  const key = faker.random.word();

  const val = faker.internet.url();

  const jsonFile = JSON.stringify({ [key]: val });

  const jsonFileName = faker.system.fileName();

  const jmxFile = faker.random.words();

  const jmxFileName = faker.system.fileName();

  beforeEach(() => {
    const zipFile = new Zip();
    zipFile.file(jsonFileName, jsonFile);
    zipFile.file(jmxFileName, jmxFile);
    AWS.mock('S3', 'getObject', (params, cb) => {
      process.nextTick(() => {
        const zipped = zipFile.generate({ base64: false, compression: 'DEFLATE' });
        cb(null, { Body: new Buffer(zipped, 'binary') });
      });
    });
  });

  beforeEach(() => {
    AWS.mock('S3', 'putObject', (params, cb) => {
      process.nextTick(() => { cb(null, {}); });
    });
  });

  beforeEach(() => {
    AWS.mock('S3', 'getSignedUrl', (op, params, cb) => {
      process.nextTick(() => { cb(null, faker.internet.url()); });
    });
  });

  beforeEach(() => {
    AWS.mock('StepFunctions', 'startExecution', (params, cb) => {
      process.nextTick(() => { cb(null, { executionArn }); });
    });
  });

  afterEach(() => {
    AWS.restore('S3', 'getObject');
    AWS.restore('S3', 'putObject');
    AWS.restore('S3', 'getSignedUrl');
    AWS.restore('StepFunctions', 'startExecution');
  });

  const job = {
    data: {
      actionConfiguration: {
        configuration: {
          UserParameters: JSON.stringify({
            Flood: {
              tool: 'jmeter',
            },
            Parameters: {
              url: {
                'Fn::GetParam': [artifactName, jsonFileName, key],
              },
            },
            Files: [
              `${artifactName}::${jmxFileName}`,
            ],
            Grids: [{
              uuid: faker.random.uuid(),
            }],
          }),
        },
      },
      inputArtifacts: [
        {
          location: {
            s3Location: {
              bucketName: faker.random.word(),
              objectKey: faker.random.uuid(),
            },
          },
          name: artifactName,
        },
      ],
      artifactCredentials: {
        secretAccessKey: faker.random.uuid(),
        sessionToken: faker.random.uuid(),
        accessKeyId: faker.random.uuid(),
      },
    },
  };

  describe('#new', () => {
    describe('when the job is valid', () => {
      it('correctly assigns properties', () => {
        const start = new Start(job);
        expect(start.data).toEqual(job.data);
        expect(start.parameters).toEqual(expect.any(Object));
        expect(start.artifacts).toEqual(expect.objectContaining({
          [artifactName]: expect.any(Artifact),
        }));
      });
    });

    describe('when there are no input artifacts', () => {
      const invalidJob = {
        data: {
          actionConfiguration: {
            configuration: {
              UserParameters: JSON.stringify({}),
            },
          },
          inputArtifacts: [],
        },
      };

      it('throws an error', () => expect(() => new Start(invalidJob)).toThrow(Error));
    });
  });

  describe('#userParameters', () => {
    describe('when data is valid', () => {
      it('returns the correct values', () => {
        const start = new Start(job);
        return expect(start.userParameters()).resolves.toEqual(expect.objectContaining({
          Files: expect.arrayContaining([expect.any(String)]),
          Flood: expect.any(Object),
          Grids: expect.arrayContaining([expect.any(Object)]),
          Parameters: expect.any(Object),
        }));
      });
    });

    describe('when data is not present', () => {
      it('rejects with an error', () => {
        const start = new Start(job);
        start.parameters = {};
        return expect(start.userParameters()).rejects.toEqual(expect.any(Error));
      });
    });

    describe('when data is not valid', () => {
      const invalidUserParameters = {
        Flood: {
          tool: 'jmeter',
        },
        Grids: [{
          uuid: faker.random.uuid(),
        }],
      };

      it('rejects with an error', () => {
        const start = new Start(job);
        start.parameters = invalidUserParameters;
        return expect(start.userParameters()).rejects.toEqual(expect.any(Error));
      });
    });
  });

  describe('#input', () => {
    describe('when a file artifact exists', () => {
      describe('when a file is uploaded', () => {
        describe('when a parameter artifact exists', () => {
          it('returns a valid state machine input object', () => {
            const start = new Start(job);
            return expect(start.input()).resolves.toEqual(expect.objectContaining({
              files: expect.arrayContaining([
                expect.stringMatching(/^https?:\/\//),
              ]),
              flood: expect.objectContaining({
                override_parameters: expect.stringMatching(new RegExp(`-Durl="${val}"`)),
                grids: expect.arrayContaining([
                  expect.any(Object),
                ]),
              }),
            }));
          });
        });
      });
    });
  });

  describe('#perform', () => {
    describe('when #input resolves', () => {
      it('executes step functions with the correct parameters', async () => {
        const start = new Start(job);
        const obj = { [faker.random.uuid()]: faker.random.number() };
        jest.spyOn(start, 'input').mockImplementation(async () => obj);
        const perform = await start.perform();
        return expect(perform).toEqual(executionArn);
      });
    });
  });

  describe('#start', () => {
    describe('when parameters are valid', async () => {
      it('returns the correct execution arn', async () => {
        const start = new Start(job);
        const input = await start.input();
        return expect(Start.start(JSON.stringify(input))).resolves.toEqual(executionArn);
      });
    });
  });
});
