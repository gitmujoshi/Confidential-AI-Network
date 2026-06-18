# Integrations

Optional upstream and downstream systems that complement CAN (Confidential AI Network) contracts, policy, and provenance.

| Integration | Status | Doc |
|-------------|--------|-----|
| Hugging Face Hub | Dev-only (catalog + trainer refs) | [HUGGINGFACE.md](HUGGINGFACE.md) |
| Samyog / DEPA comparison | Analysis | [SAMYOG_CAN_COMPARISON.md](SAMYOG_CAN_COMPARISON.md) |
| SIEM | Framework + providers | [../production/SIEM_INTEGRATION_FRAMEWORK.md](../production/SIEM_INTEGRATION_FRAMEWORK.md) |

CAN remains the system of record for contracts, TDP data policy, and confidential execution paths. Integrations supply catalog references, observability, or deployment targets — they do not replace TEE/OCI/Azure confidential storage for sensitive data.

### Testing integrations

| Integration | Unit | Integration | E2E API |
|-------------|------|-------------|---------|
| Hugging Face | `backend/tests/unit/huggingface-*.test.js`, `local-docker-training-runner.test.js` | `huggingface.integration.test.js` | `frontend/tests/e2e/huggingface-api.spec.js` |
| SIEM | `siem-integration.test.js` | — | — |

See [development/TESTING_GUIDE.md](../development/TESTING_GUIDE.md) and [HUGGINGFACE.md](HUGGINGFACE.md#testing).
