import fs from 'fs';
import request from 'request-promise-native';

import { FLOOD_API_KEY, FLOOD_API_URI, FLOODS_PATH } from '../../globals';
import { parseFloodResponse, transformObjectProps } from '../helper';
import { parse } from 'url';
import Path from 'path';

const tempStorage = '/tmp';

/**
 * Creates a download and write to filesystem job for each url in the files argument.
 *
 * @param {Array} files - list of files to be downloaded
 * @return {Promise|Array} - promise that will resolve to an array of local file references
 */
const getFloodFiles = (files) => {
  if (!files || files.length < 1) {
    return Promise.reject(new Error('No flood files provided'));
  }

  const downloadJobs = files.map(fileToRequest =>
    new Promise((resolve, reject) => {
      const fileName = parse(fileToRequest).pathname;
      const fullPath = Path.join(tempStorage, Path.parse(fileName).base);

      request.get(fileToRequest)
        .then(res => {
          fs.writeFile(fullPath, res, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(fullPath);
            }
          });
        });
    })
  );

  return Promise.all(downloadJobs);
};

/**
 * Function that builds the form payload and posts to flood.io
 *
 * @param {Array} files - list of local files to read
 * @param {Object} event - the object containing flood io options
 * @return {Promise} - returns a promise that will resolve/reject if the request is successful
 */
const postToFlood = (files, floodOptions) => {
  const mappedProps = transformObjectProps(floodOptions);

  const fileStreams = files.map(file => fs.createReadStream(file));
  mappedProps['flood_files[]'] = fileStreams;

  const options = {
    uri: `${FLOOD_API_URI}${FLOODS_PATH}`,
    formData: mappedProps,
    auth: {
      user: FLOOD_API_KEY,
    },
  };

  return request.post(options)
    .then(res => JSON.parse(res));
};

/**
 * This handler will parse an event object, download files specified
 * and then upload them (POST) to flood.io.
 *
 * Flood.io specific options will also be parsed from the event and passed along.
 * Required parameters are:
 *  - tool, string, e.g. 'jmeter'
 *  - grids, object
 *    - region, string, e.g. 'eu-west-1
 *    - instance_type, string, e.g. 'm4.xlarge'
 *    - stop_after, string, e.g. '60'
 *    - infrastructure, string, e.g. 'demand
 *  - files, array
 *
 * See: https://github.com/flood-io/api-docs/blob/master/endpoints/floods/POST-floods.md
 *
 * Callback function will be called with an object describing the flood session on success
 * ```
 * {
 *  flood: {
 *    uuid, string
 *  },
 *  grid: {
 *    uuid, string
 *  },
 *  status, string, e.g. 'queued'/'finished'
 * }
 * ```
 *
 * @param {Object} event - object containing list of test files to be executed and flood io options
 * @param {Object} context - Lambda runtime information
 * @param {Function} callback - callback function that will receive either (err) or (null, response)
 *
 */
export function handler(
  event = {},
  context,
  callback = () => {}
) {
  const { files } = event;
  const floodOptions = {
    flood: event.flood,
  };

  getFloodFiles(files)
    .then(downloadedFiles => postToFlood(downloadedFiles, floodOptions))
    .then(res => {
      callback(null, parseFloodResponse(res));
    })
    .catch((err) => {
      callback(err);
    });
}
