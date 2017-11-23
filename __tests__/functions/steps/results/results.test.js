/* eslint-disable import/no-unresolved */

import request from 'request-promise-native';
import { handler } from '@functions/steps/results/results';
import nock from 'nock';
import { FLOOD_API_URI, FLOODS_PATH } from '@functions/globals';

const mockResponse = {
  summary: 'mock',
};
const mockUUID = '123123';

let requestSpy;
let callbackSpy;

beforeAll(() => {
  nock.disableNetConnect();
  requestSpy = jest.spyOn(request, 'get');
});

afterAll(() => {
  nock.enableNetConnect();
});

describe('Result of flood suite', () => {
  describe('Handles successful query', () => {
    beforeEach((done) => {
      nock(`${FLOOD_API_URI}${FLOODS_PATH}/${mockUUID}`)
        .get('/report')
        .reply(200, mockResponse, { 'Content-Type': 'application/json' });

      callbackSpy = jest.fn().mockImplementation(() => {
        done();
      });

      handler({
        flood: {
          uuid: mockUUID,
        },
      }, null, callbackSpy);
    });

    describe('Calling handler', () => {
      it('Requested the flood results', () => {
        expect(requestSpy.mock.calls).toMatchSnapshot();
      });

      it('Returned the summary to the callback', () => {
        expect(callbackSpy.mock.calls).toMatchSnapshot();
      });
    });
  });

  describe('Handles unsuccesful response ', () => {
    beforeEach((done) => {
      nock(`${FLOOD_API_URI}${FLOODS_PATH}/${mockUUID}`)
        .get('/report')
        .reply(404);

      callbackSpy = jest.fn().mockImplementation(() => {
        done();
      });

      handler({
        flood: {
          uuid: mockUUID,
        },
      }, null, callbackSpy);
    });

    describe('Calling handler', () => {
      it('Returned the error to the callback', () => {
        expect(callbackSpy.mock.calls).toMatchSnapshot();
      });
    });
  });
});
