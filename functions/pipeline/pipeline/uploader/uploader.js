import typedError from 'error/typed';

import File from './file';

/**
 * The defined remote artifact does not exist or access has not been granted.
 *
 * @type {Error}
 */
const artifactNotFound = typedError({
  message: 'Artifact "{artifactName}" was referenced, but is not a valid InputArtifact.',
  type: 'pipeline.artifact.not_found',
});

/**
 * This class handles resolving references to flood files defined inside
 * the user parameters for the action.
 *
 * The State Machine does not contain the logic necessary to extract CodePipeline
 * artifacts and fetch their contents. Therefore, it is the responsibility of this
 * class to retrieve artifacts, decompress them and upload any referenced files
 * to a secure remote, providing a signed URL that the state machine function can use
 * to securely retrieve the Flood files.
 */
export default class Uploader {
  /**
   * @param {Array[String]} references - an array of remote file references defined.
   * @param {Array[Artifact]} artifacts - an array of artifacts available to this function.
   */
  constructor(references, artifacts) {
    /**
     * An array of strings defining references to files located
     * inside CodePipeline artifacts.
     *
     * @type {Array[String]}
     */
    this.references = references;
    /**
     * An array of artifacts to retrieve references from.
     *
     * @type {Array[Artifact]}
     */
    this.artifacts = artifacts;
  }

  /**
   * An array of initialized {@link File} objects for each reference.
   *
   * Each element contains a defined reference along with the relevant artifact
   * that the file can be found within.
   *
   * @return {Array[File]} an array of File instances.
   */
  files() {
    return this.references.map((file) => {
      const [artifactName, filename] = file.split('::');
      const artifact = this.artifacts[artifactName];
      if (!artifact) {
        throw artifactNotFound({ artifactName });
      }
      return new File(artifact, filename);
    });
  }

  /**
   * Retrieves an array of signed URLs, of resolved references which have been
   * retrieved from the remote CodePipeline artifact, uploaded to a remote bucket
   * and then a signed URL has been generated.
   *
   * @return {Array[String]} an array of signed S3 URLs.
   */
  async urls() {
    const files = this.files();
    await Promise.all(files.map(f => f.upload()));
    return await Promise.all(files.map(f => f.signedUrl()));
  }
}
