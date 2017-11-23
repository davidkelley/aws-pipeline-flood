/* eslint-disable import/no-unresolved */

import request from 'request-promise-native';
import { handler } from '@functions/steps/status/status';
import nock from 'nock';
import { FLOOD_API_URI, FLOODS_PATH } from '@functions/globals';

const mockUUID = 'IIf79FZ7pP3y5yFRXgvqbw';
const mockResponse = JSON.stringify({
  uuid: mockUUID,
  status: 'queued',
  _embedded: {
    grids: [
      {
        uuid: 'rNYbrpY0jOzqnl3buVNoJA',
      },
    ],
  },
});


beforeEach(() => {
  nock.disableNetConnect();
});

afterEach(() => {
  nock.enableNetConnect();
});

describe('Status of flood suite', () => {
  const requestSpy = jest.spyOn(request, 'get');
  let callbackSpy;


  describe('Handles successful query', () => {
    beforeEach((done) => {
      nock(`${FLOOD_API_URI}${FLOODS_PATH}`)
        .get(`/${mockUUID}`)
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
      it('Retrieved flood status', () => {
        expect(requestSpy.mock.calls).toMatchSnapshot();
      });

      it('Returned the status to the callback', () => {
        expect(callbackSpy.mock.calls).toMatchSnapshot();
      });
    });
  });

  describe('Handles unsuccesful response ', () => {
    beforeEach((done) => {
      nock(`${FLOOD_API_URI}${FLOODS_PATH}`)
        .get(`/${mockUUID}`)
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
      it('Returned the status to the callback', () => {
        expect(callbackSpy.mock.calls).toMatchSnapshot();
      });
    });
  });
});
