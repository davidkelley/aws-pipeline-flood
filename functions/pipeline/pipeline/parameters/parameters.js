import wrappedError from 'error/wrapped';
import typedError from 'error/typed';

/**
 * An unsupported parameter value object was encountered.
 *
 * @type {Error}
 */
const artifactParameterError = typedError({
  message: 'Unsupported object in "{key}"',
  type: 'pipeline.parameters',
});

/**
 * The remote artifact could not be retrieved.
 *
 * @type {Error}
 */
const remoteArtifactError = wrappedError({
  message: 'Failed to retrieve remote artifact "{path}"',
  type: 'pipeline.artifact.remote',
});

/**
 * The remote artifact file did not contain a truthy key value.
 *
 * @type {Error}
 */
const remoteArtifactValueError = wrappedError({
  message: 'Value was null or undefined for "{path}"',
  type: 'pipeline.artifact.value',
});

/**
 * The defined remote artifact does not exist or access has not been granted.
 *
 * @type {Error}
 */
const artifactNotFound = typedError({
  message: 'Artifact "{artifactName}" not a valid InputArtifact',
  type: 'pipeline.artifact.not_found',
});

/**
 * Enables the defining of parameters which are passed as overrides to the
 * flood files which are sent to Flood.IO.
 *
 * Parameters can be defined as a static string or as an object containing
 * the "Fn::GetParam" key, which behaves in a similar fashion to the
 * CloudFormation parameter overrides function.
 */
export default class Parameters {
  /**
   * Constructs a new Parameter instance.
   *
   * @param {Object[String, String, Object]} parameters - an object denoting all
   *  parameters which are to be sent to all Flood files. The values inside
   *  this object can either be static strings, or objects containing keys
   *  to retrieve values from artifact files.
   * @param {Array[Artifact]} artifacts - an array of {@link Artifact} instances.
   */
  constructor(parameters, artifacts) {
    /**
     * An array of parameter overrides as either a static string or an object
     * containing a Fn::GetParam key.
     *
     * @type {Array[String, Object]}
     */
    this.parameters = parameters;
    /**
     * An object containing {@link Artifact} instances, with the keys denoting
     * the logical name of the artifact inside CodePipeline.
     *
     * @type {Object}
     */
    this.artifacts = artifacts;
  }

  /**
   * Convert all parameters to their resolves keys and values.
   *
   * @return {Object}
   */
  async toObject() {
    const entries = await Promise.all(this.toEntries());
    return entries.reduce((memo, [key, val]) => {
      const obj = memo;
      obj[key] = val;
      return memo;
    }, {});
  }

  /**
   * @private
   *
   * Map all parameter keys to their respective resolved values and return an
   * array of keys & value tuples.
   *
   * Note that this method returns an array of promises.
   *
   * @return {Array[Array[String, String]]} an array of iterable entries.
   */
  toEntries() {
    return Object.keys(this.parameters).map(async (key) => {
      const obj = this.parameters[key];
      if (typeof obj === 'string') {
        return [key, obj];
      }
      const properties = obj['Fn::GetParam'];
      if (!properties) {
        throw artifactParameterError({ key });
      } else {
        try {
          const val = await this.fetch(...properties);
          return [key, val];
        } catch (err) {
          throw remoteArtifactError(err, {
            path: properties.join('::'),
          });
        }
      }
    });
  }

  /**
   * Fetch the value of a specific parameter using the key found inside a json file
   * inside the specific artifact.
   *
   * @param {String} artifactName - the name of the artifact the file resides in.
   * @param {String} filename - The name of the JSON file inside the artifact
   * @param {String} key - The property key inside the JSON file
   *
   * @return {String} the value of the key inside the JSON file, inside the artifact.
   */
  async fetch(artifactName, filename, key) {
    const artifact = this.artifacts[artifactName];
    if (!artifact) {
      throw artifactNotFound({ artifactName });
    } else {
      await artifact.ready();
      const value = artifact.attribute(filename, key);
      if (!value) {
        throw remoteArtifactValueError({
          path: `${artifactName}::${filename}::${key}`,
        });
      } else {
        return value;
      }
    }
  }

  /**
   * Transforms all parameters to a Flood.IO compatible parameter overrides
   * string.
   *
   * This function will first resolve all functions with a call to {@link Parameters#toObject}.
   *
   * @return {String} a Java parameter overrides string in the form `-Dkey="val"`.
   */
  async toOverrides() {
    const obj = await this.toObject();
    return Object.keys(obj).map(key => `-D${key}="${obj[key]}"`).join(' ');
  }
}
