import Path from 'path';
import { S3 } from 'aws-sdk';
import uuid from 'uuid/v4';
import wrappedError from 'error/wrapped';

import { AWS_REGION } from '../../../globals';
import { FILE_BUCKET } from '../constants';

/**
 * The S3 client failed to generate a pre-signed URL for the remote S3 object.
 *
 * @type {Error}
 */
const failedtoSignUrlError = wrappedError({
  message: 'Failed to sign url for S3 remote: "{Bucket}/{Key}"',
  type: 'pipeline.artifact.file.signed_url',
});

/**
 * The file defined inside the artifact could not be read.
 *
 * @type {Error}
 */
const fileReadError = wrappedError({
  message: 'Failed to read remote artifact file "{Bucket}/{Key}".',
  type: 'pipeline.artifact.file.read',
});

/**
 * An error occurred whilst attempting to upload an artifact file to S3.
 *
 * @type {Error}
 */
const fileUploadError = wrappedError({
  message: 'Failed to upload artifact file.',
  type: 'pipeline.artifact.file.upload',
});

/**
 * Represents a Flood testing file which is to be first retrieved from a remote
 * CodePipeline artifact and then uploaded to a separate S3 bucket ready for
 * upload to Flood.IO (inside step functions).
 */
export default class File {
  /**
   * @param {Artifact} artifact - the artifact the file resides in.
   * @param {String} filename - The name of the file inside the artifact.
   */
  constructor(artifact, filename) {
    /**
     * An initialised AWS S3 client object.
     *
     * @type {S3}
     */
    this.client = new S3({ region: AWS_REGION });
    /**
     * The file extension, extracted from the filename, prefixed with "."
     *
     * @type {String}
     */
    this.extname = Path.extname(filename);
    /**
     * The artifact object which the file resides in.
     *
     * @type {Artifact}
     */
    this.artifact = artifact;
    /**
     * The name of the file inside the artifact
     *
     * @type {String}
     */
    this.filename = filename;
    /**
     * A UUID V4 key which will represent the file inside the remote S3 bucket,
     * once uploaded.
     *
     * @type {String}
     */
    this.key = uuid();
    /**
     * A remote object containing the Bucket that the file will be uploaded to,
     * in addition to the Key which the file will be stored under.
     *
     * Note that in-order to avoid remote conflicts, the filename is randomized
     * with a UUID ({@link File#key}) and suffixed with the appropriate file
     * extension.
     *
     * @type {Object}
     */
    this.remote = {
      Bucket: FILE_BUCKET,
      Key: `${this.key}${this.extname}`,
    };
  }

  /**
   * Retrieve a signed url, using AWS environment credentials for the remote
   * file.
   *
   * @return {Promise[String]} a AWS SigV4 signed URL for retrieving the flood file without
   *   an appropriate IAM role in a remote resource.
   */
  signedUrl() {
    return new Promise((resolve, reject) => {
      this.client.getSignedUrl('getObject', this.remote, (err, url) => {
        if (err) {
          reject(failedtoSignUrlError(err, this.remote));
        } else {
          resolve(url);
        }
      });
    });
  }

  /**
   * @private
   *
   * Read the data of the remote file inside the artifact.
   *
   * @return {Buffer} the contents of the remote artifact file.
   */
  async read() {
    try {
      const { filename } = this;
      await this.artifact.ready();
      return this.artifact.get(filename);
    } catch (err) {
      throw fileReadError(err);
    }
  }

  /**
   * Upload the file from inside the remote artifact to a secure S3 bucket.
   *
   * This function will first download the remote CodePipeline artifact, unzip
   * the contents, read the contents of the intended file and then upload
   * the contents to another S3 bucket.
   *
   * @return {Object} the raw AWS S3 response of `putObject`.
   */
  async upload() {
    const { remote } = this;
    try {
      const Body = await this.read();
      const params = Object.assign({}, remote, { Body });
      return await this.client.putObject(params).promise();
    } catch (err) {
      throw fileUploadError(err, remote);
    }
  }
}
