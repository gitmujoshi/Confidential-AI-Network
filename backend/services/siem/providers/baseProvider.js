/**
 * Base class for SIEM export providers.
 */
class BaseSiemProvider {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.enabled = config.enabled !== false;
  }

  /**
   * @param {object} canonicalEvent
   * @returns {Promise<{ ok: boolean, provider: string, error?: string }>}
   */
  async send(_canonicalEvent) {
    throw new Error(`${this.name}: send() not implemented`);
  }

  isConfigured() {
    return this.enabled;
  }
}

module.exports = BaseSiemProvider;
