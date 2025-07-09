/**
 * DID Signing Modal Component
 * 
 * This component provides a user-friendly interface for DID-based contract signing.
 * It allows users to sign contracts using their Decentralized Identifiers (DIDs)
 * with cryptographic signature verification.
 * 
 * Features:
 * - DID document display and validation
 * - Automatic signing message construction
 * - Test signature generation for development
 * - Copy-to-clipboard functionality
 * - Real-time error handling and feedback
 * 
 * @author Contract Management System
 * @version 2.0.0
 * @since 2024-01-08
 */

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, Card } from 'react-bootstrap';
import { ethers } from 'ethers';

/**
 * DID Signing Modal Component
 * 
 * Provides a comprehensive interface for DID-based contract signing with
 * cryptographic verification and user-friendly features.
 * 
 * @param {boolean} show - Whether the modal is visible
 * @param {function} onHide - Function to close the modal
 * @param {Object} contract - The contract to be signed
 * @param {Object} user - The current user attempting to sign
 * @param {function} onSignSuccess - Callback when signing succeeds
 * @param {function} onSignError - Callback when signing fails
 */
const DIDSigningModal = ({ 
  show, 
  onHide, 
  contract, 
  user, 
  onSignSuccess, 
  onSignError 
}) => {
  const [signingMessage, setSigningMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState('');
  const [didDocument, setDidDocument] = useState(null);
  const [isLoadingDID, setIsLoadingDID] = useState(false);

  useEffect(() => {
    if (show && user?.did) {
      generateSigningMessage();
      loadDIDDocument();
    }
  }, [show, user, contract]);

  /**
   * Generate a signing message for the contract
   * 
   * Creates a timestamp-based message that includes the contract ID and user role.
   * This message will be cryptographically signed by the user's DID.
   * 
   * Message format: "Sign contract {contractId} as {role} at {timestamp}"
   * 
   * @example
   * // Generates: "Sign contract CONTRACT-123 as TDP at 2024-01-01T00:00:00.000Z"
   */
  const generateSigningMessage = () => {
    if (!contract || !user) return;

    const timestamp = new Date().toISOString();
    const role = user.partyType;
    const message = `Sign contract ${contract.contractId} as ${role} at ${timestamp}`;
    setSigningMessage(message);
  };

  const loadDIDDocument = async () => {
    if (!user?.did) return;

    setIsLoadingDID(true);
    setError('');

    try {
      // Resolve DID document
      const response = await fetch(`/api/did/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ did: user.did })
      });

      if (response.ok) {
        const data = await response.json();
        setDidDocument(data.didDocument);
      } else {
        console.warn('Failed to load DID document, proceeding with basic signing');
      }
    } catch (error) {
      console.warn('Error loading DID document:', error);
    } finally {
      setIsLoadingDID(false);
    }
  };

  /**
   * Handle DID-based contract signing
   * 
   * Sends the signature and message to the backend for verification and contract signing.
   * The backend will verify the cryptographic signature against the user's DID document
   * and update the contract status if verification succeeds.
   * 
   * @async
   * @throws {Error} If signing fails due to network or verification errors
   */
  const handleSignWithDID = async () => {
    if (!signingMessage || !signature.trim()) {
      setError('Please provide a signature');
      return;
    }

    setIsSigning(true);
    setError('');

    try {
      // Send signing request to backend with DID signature
      const response = await fetch(`/api/contracts/${contract.contractId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          signatureType: 'DID',
          did: user.did,
          signature: signature.trim(),
          message: signingMessage
        })
      });

      const data = await response.json();

      if (response.ok) {
        onSignSuccess(data);
      } else {
        setError(data.error || 'Failed to sign contract');
        onSignError(data.error);
      }
    } catch (error) {
      const errorMessage = 'Network error while signing contract';
      setError(errorMessage);
      onSignError(errorMessage);
    } finally {
      setIsSigning(false);
    }
  };

  const generateTestSignature = () => {
    // Generate a test signature for development
    const testSignature = `TEST_SIGNATURE_${user.did}_${Date.now()}`;
    setSignature(testSignature);
  };

  const copyMessageToClipboard = () => {
    navigator.clipboard.writeText(signingMessage);
  };

  if (!user?.did) {
    return (
      <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton>
          <Modal.Title>DID Signing Not Available</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>No DID Found</strong>
            <br />
            This user does not have a DID configured. Please use wallet-based signing instead.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Sign Contract with DID</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <h6>Contract Details</h6>
          <Card className="mb-3">
            <Card.Body>
              <div className="row">
                <div className="col-md-6">
                  <strong>Contract ID:</strong> {contract?.contractId}
                </div>
                <div className="col-md-6">
                  <strong>Your Role:</strong> {user?.partyType}
                </div>
              </div>
              <div className="row mt-2">
                <div className="col-md-6">
                  <strong>Your DID:</strong> 
                  <code className="ms-2">{user?.did}</code>
                </div>
                <div className="col-md-6">
                  <strong>Status:</strong> {contract?.status}
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        {isLoadingDID && (
          <div className="text-center mb-3">
            <Spinner animation="border" size="sm" />
            <span className="ms-2">Loading DID document...</span>
          </div>
        )}

        {didDocument && (
          <div className="mb-4">
            <h6>DID Document</h6>
            <Card>
              <Card.Body>
                <div className="row">
                  <div className="col-md-6">
                    <strong>DID:</strong> {didDocument.id}
                  </div>
                  <div className="col-md-6">
                    <strong>Verification Methods:</strong> {didDocument.verificationMethod?.length || 0}
                  </div>
                </div>
                {didDocument.verificationMethod?.map((vm, index) => (
                  <div key={index} className="mt-2">
                    <small className="text-muted">
                      <strong>Method {index + 1}:</strong> {vm.type}
                    </small>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </div>
        )}

        <div className="mb-4">
          <h6>Signing Message</h6>
          <div className="d-flex align-items-start gap-2">
            <Form.Control
              as="textarea"
              rows={3}
              value={signingMessage}
              onChange={(e) => setSigningMessage(e.target.value)}
              placeholder="Message to sign..."
              className="font-monospace"
            />
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={copyMessageToClipboard}
              title="Copy to clipboard"
            >
              📋
            </Button>
          </div>
          <small className="text-muted">
            This message will be cryptographically signed with your DID
          </small>
        </div>

        <div className="mb-4">
          <h6>Signature</h6>
          <div className="d-flex gap-2 mb-2">
            <Button 
              variant="outline-info" 
              size="sm"
              onClick={generateTestSignature}
              disabled={isSigning}
            >
              Generate Test Signature
            </Button>
          </div>
          <Form.Control
            as="textarea"
            rows={3}
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Enter your signature here..."
            className="font-monospace"
          />
          <small className="text-muted">
            Paste your cryptographic signature here. For testing, you can use the "Generate Test Signature" button.
          </small>
        </div>

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <div className="alert alert-info">
          <h6>ℹ️ DID Signing Instructions</h6>
          <ol className="mb-0">
            <li>Copy the signing message above</li>
            <li>Sign the message using your DID's private key</li>
            <li>Paste the signature in the signature field</li>
            <li>Click "Sign Contract" to submit</li>
          </ol>
          <hr />
          <small>
            <strong>Note:</strong> For development/testing, you can use the "Generate Test Signature" button.
            In production, you would use proper cryptographic signing tools.
          </small>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSigning}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSignWithDID}
          disabled={isSigning || !signature.trim()}
        >
          {isSigning ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Signing...
            </>
          ) : (
            'Sign Contract'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DIDSigningModal; 