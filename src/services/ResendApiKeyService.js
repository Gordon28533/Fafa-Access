/**
 * Resend API Key Service
 * Manages Resend API keys using the official Resend SDK.
 * https://resend.com/docs/api-reference/api-keys
 */

import process from 'process';
import { Resend } from 'resend';

class ResendApiKeyService {
  constructor(apiKey) {
    const key = apiKey || process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('A Resend API key is required. Provide it as a constructor argument or set RESEND_API_KEY in the environment.');
    }
    this._client = new Resend(key);
  }

  /**
   * Create a new Resend API key.
   * @param {Object} params
   * @param {string} params.name - Name for the new API key
   * @returns {Promise<Object>} Created API key data
   */
  async create({ name }) {
    const { data, error } = await this._client.apiKeys.create({ name });
    if (error) {
      throw new Error(`Failed to create API key: ${error.message || JSON.stringify(error)}`);
    }
    return data;
  }

  /**
   * Delete a Resend API key by its ID.
   * @param {string} apiKeyId - The ID of the API key to delete
   * @returns {Promise<Object>} Deletion result data
   */
  async remove(apiKeyId) {
    const { data, error } = await this._client.apiKeys.remove(apiKeyId);
    if (error) {
      throw new Error(`Failed to remove API key: ${error.message || JSON.stringify(error)}`);
    }
    return data;
  }

  /**
   * List all Resend API keys.
   * @returns {Promise<Object[]>} Array of API key objects
   */
  async list() {
    const { data, error } = await this._client.apiKeys.list();
    if (error) {
      throw new Error(`Failed to list API keys: ${error.message || JSON.stringify(error)}`);
    }
    return data;
  }
}

export default ResendApiKeyService;
export { ResendApiKeyService };
