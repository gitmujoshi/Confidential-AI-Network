import { config } from '../config';
import { logger } from '../config/logger';
import * as crypto from 'crypto';

/**
 * SPIFFE Verifiable Identity Document (SVID)
 * Short-lived X.509 certificate for workload identity
 */
export interface SVID {
  spiffeId: string;
  certificate: string;
  privateKey: string;
  trustBundle: string;
  expiresAt: Date;
  issuedAt: Date;
}

/**
 * Workload attestation data
 */
export interface WorkloadAttestation {
  workloadId: string;
  containerId?: string;
  podName?: string;
  namespace?: string;
  serviceAccount?: string;
  labels?: Record<string, string>;
}

/**
 * SPIFFE Identity Service
 * Manages cryptographic workload identities using SPIFFE/SPIRE
 */
export class SPIFFEService {
  private readonly trustDomain: string;
  private readonly serverAddress: string;
  private svidCache: Map<string, SVID> = new Map();

  constructor() {
    this.trustDomain = config.spiffe.trustDomain;
    this.serverAddress = config.spiffe.serverAddress;
    logger.info('SPIFFE Service initialized', {
      trustDomain: this.trustDomain,
      serverAddress: this.serverAddress,
    });
  }

  /**
   * Issue a new SVID for a workload
   */
  async issueSVID(attestation: WorkloadAttestation): Promise<SVID> {
    try {
      logger.info('Issuing SVID', { workloadId: attestation.workloadId });

      // Generate SPIFFE ID
      const spiffeId = this.generateSpiffeId(attestation);

      // Check cache first
      const cached = this.svidCache.get(spiffeId);
      if (cached && cached.expiresAt > new Date()) {
        logger.debug('Returning cached SVID', { spiffeId });
        return cached;
      }

      // In production, this would call SPIRE Agent API
      // For now, we generate a self-signed certificate for demo
      const svid = await this.generateSVID(spiffeId, attestation);

      // Cache the SVID
      this.svidCache.set(spiffeId, svid);

      // Schedule rotation
      this.scheduleRotation(spiffeId, svid.expiresAt);

      logger.info('SVID issued successfully', {
        spiffeId,
        expiresAt: svid.expiresAt,
      });

      return svid;
    } catch (error) {
      logger.error('Failed to issue SVID', {
        error,
        workloadId: attestation.workloadId,
      });
      throw new Error(`SVID issuance failed: ${error}`);
    }
  }

  /**
   * Verify an SVID
   */
  async verifySVID(certificate: string): Promise<boolean> {
    try {
      // In production, verify against SPIRE server trust bundle
      // For now, basic validation
      const cert = crypto.createPublicKey(certificate);
      return cert !== null;
    } catch (error) {
      logger.error('SVID verification failed', { error });
      return false;
    }
  }

  /**
   * Revoke an SVID
   */
  async revokeSVID(spiffeId: string): Promise<void> {
    logger.info('Revoking SVID', { spiffeId });
    this.svidCache.delete(spiffeId);
    // In production, call SPIRE server to add to CRL
  }

  /**
   * Get SVID by SPIFFE ID
   */
  async getSVID(spiffeId: string): Promise<SVID | null> {
    const cached = this.svidCache.get(spiffeId);
    if (cached && cached.expiresAt > new Date()) {
      return cached;
    }
    return null;
  }

  /**
   * Rotate SVID before expiration
   */
  async rotateSVID(spiffeId: string): Promise<SVID> {
    logger.info('Rotating SVID', { spiffeId });

    // Extract attestation from SPIFFE ID
    const workloadId = spiffeId.split('/').pop() || '';
    const attestation: WorkloadAttestation = { workloadId };

    return this.issueSVID(attestation);
  }

  /**
   * Generate SPIFFE ID from attestation
   */
  private generateSpiffeId(attestation: WorkloadAttestation): string {
    const parts = [`spiffe://${this.trustDomain}/workload`];

    if (attestation.namespace) {
      parts.push(`ns/${attestation.namespace}`);
    }
    if (attestation.serviceAccount) {
      parts.push(`sa/${attestation.serviceAccount}`);
    }
    parts.push(attestation.workloadId);

    return parts.join('/');
  }

  /**
   * Generate SVID certificate and private key
   * In production, this calls SPIRE Agent/Server
   */
  private async generateSVID(
    spiffeId: string,
    attestation: WorkloadAttestation
  ): Promise<SVID> {
    // Generate key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + config.spiffe.svidTTL * 1000);

    // In production, this would be a proper X.509 cert from SPIRE
    const certificate = publicKey;
    const trustBundle = 'TRUST_BUNDLE'; // Would be from SPIRE

    return {
      spiffeId,
      certificate,
      privateKey,
      trustBundle,
      issuedAt,
      expiresAt,
    };
  }

  /**
   * Schedule automatic SVID rotation
   */
  private scheduleRotation(spiffeId: string, expiresAt: Date): void {
    const now = Date.now();
    const expiry = expiresAt.getTime();
    const rotationTime = expiry - (expiry - now) * 0.3; // Rotate at 70% lifetime

    const delay = rotationTime - now;
    if (delay > 0) {
      setTimeout(async () => {
        try {
          await this.rotateSVID(spiffeId);
        } catch (error) {
          logger.error('Automatic SVID rotation failed', { spiffeId, error });
        }
      }, delay);
    }
  }

  /**
   * Get service health status
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    return {
      status: 'healthy',
      details: {
        trustDomain: this.trustDomain,
        activeSVIDs: this.svidCache.size,
        serverAddress: this.serverAddress,
      },
    };
  }
}

// Singleton instance
export const spiffeService = new SPIFFEService();
