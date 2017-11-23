/* eslint-disable import/no-unresolved */

import { handler } from '@functions/steps/create/create';
import nock from 'nock';
import { FLOOD_API_URI, FLOODS_PATH } from '@functions/globals';
import * as helpers from '@functions/steps/helper';
import request from 'request-promise-native';
import fs from 'fs';

const mockDownloadPath = 'https://s3-eu-west-1.amazonaws.com/floodfiles/mockfilename.jmx';

const mockEvent = {
  files: [
    mockDownloadPath,
  ],
  flood: {
    tool: 'jmeter',
    grids: [
      {
        region: 'eu-west-1',
        instance_type: 'm4.xlarge',
        stop_after: '60',
        infrastructure: 'demand',
      },
    ],
  },
};

const mockResponse = {
  uuid: 'IIf79FZ7pP3y5yFRXgvqbw',
  status: 'queued',
  _embedded: {
    grids: [
      {
        uuid: 'rNYbrpY0jOzqnl3buVNoJA',
      },
    ],
  },
};

let requestSpy;
let postSpy;
let fsWriteSpy;
let fsReadSpy;
let callbackSpy;
let transformSpy;
let parseSpy;

beforeAll(() => {
  nock.disableNetConnect();
  requestSpy = jest.spyOn(request, 'get');
  postSpy = jest.spyOn(request, 'post');
  fsWriteSpy = jest.spyOn(fs, 'writeFile');
  fsReadSpy = jest.spyOn(fs, 'createReadStream');
  transformSpy = jest.spyOn(helpers, 'transformObjectProps');
  parseSpy = jest.spyOn(helpers, 'parseFloodResponse');
});

afterAll(() => {
  nock.enableNetConnect();
});

const cleanAll = () => {
  nock.cleanAll();
  requestSpy.mockReset();
  postSpy.mockReset();
  fsWriteSpy.mockReset();
  fsReadSpy.mockReset();
  transformSpy.mockReset();
  parseSpy.mockReset();
};

describe('Create Flood suite', () => {
  describe('Handles success', () => {
    beforeAll(done => {
      nock('https://s3-eu-west-1.amazonaws.com/floodfiles')
        .get('/mockfilename.jmx')
        .replyWithFile(200, './__tests__/functions/steps/create/mock/floodtest.jmx');

      nock(FLOOD_API_URI)
        .post(`/${FLOODS_PATH}`)
        .reply(200, mockResponse, { 'Content-Type': 'application/json' });

      callbackSpy = jest.fn().mockImplementation(() => {
        done();
      });

      handler(Object.assign({}, mockEvent), null, callbackSpy);
    });

    afterAll(() => {
      cleanAll();
    });

    describe('Calling handler', () => {
      it('Downloaded floodfiles', () => {
        expect(requestSpy.mock.calls).toMatchSnapshot();
      });

      it('Wrote floodfiles to tmp', () => {
        expect(fsWriteSpy.mock.calls).toMatchSnapshot();
        expect(fs.readdirSync('/tmp')).toEqual(expect.stringContaining('mockfilename.jmx'));
      });

      it('Transformed object properties to match form', () => {
        expect(transformSpy).lastCalledWith(
          expect.objectContaining({
            flood: mockEvent.flood,
          })
        );
      });

      it('Read the files from local storage', () => {
        expect(fsReadSpy).lastCalledWith(expect.stringContaining('mockfilename.jmx'));
      });

      it('Posted files to flood.io', () => {
        expect(postSpy).lastCalledWith(expect.objectContaining({
          auth: expect.objectContaining({
            user: expect.any(String),
          }),
          formData: expect.objectContaining({
            'flood[grids][][infrastructure]': 'demand',
            'flood[grids][][instance_type]': 'm4.xlarge',
            'flood[grids][][region]': 'eu-west-1',
            'flood[grids][][stop_after]': '60',
            'flood[tool]': 'jmeter',
          }),
          uri: 'https://api.flood.io/floods',
        }));
      });

      it('Parsed the response', () => {
        expect(parseSpy.mock.calls).toMatchSnapshot();
      });
    });
  });

  describe('Handles failure when downloading', () => {
    beforeAll((done) => {
      nock('https://s3-eu-west-1.amazonaws.com/floodfiles')
        .get('/mockfilename.jmx')
        .reply(404);

      callbackSpy = jest.fn().mockImplementation(() => {
        done();
      });

      handler(mockEvent, null, callbackSpy);
    });

    afterAll(() => {
      cleanAll();
    });

    describe('Calling handler', () => {
      it('Tried to download floodfiles', () => {
        expect(requestSpy.mock.calls).toMatchSnapshot();
      });

      it('Did not write files', () => {
        expect(fsWriteSpy).not.toHaveBeenCalled();
      });

      it('Did not transform props', () => {
        expect(transformSpy).not.toHaveBeenCalled();
      });

      it('Did not read files', () => {
        expect(fsReadSpy).not.toHaveBeenCalled();
      });

      it('Did not post to flood.io', () => {
        expect(postSpy).not.toHaveBeenCalled();
      });

      it('Did not attempt to parse', () => {
        expect(parseSpy).not.toHaveBeenCalled();
      });
    });
  });
});
