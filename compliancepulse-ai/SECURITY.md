# 🔒 Security Configuration Notice

## ⚠️ IMPORTANT: Change Default Values in Production

This repository contains **example configuration files** with placeholder values for development purposes only.

### Before Deploying to Production:

1. **Generate Strong Secrets**
   ```bash
   # Generate a strong JWT secret
   openssl rand -base64 32
   ```

2. **Update Database Credentials**
   - Change `DATABASE_URL` username and password
   - Use strong, randomly generated passwords
   - Store credentials in a secure secret manager (GCP Secret Manager, AWS Secrets Manager, etc.)

3. **Configure Redis Authentication**
   - Set a strong `REDIS_PASSWORD` if using Redis with authentication
   - Use Redis ACL for fine-grained access control

4. **Environment Variables**
   - Never commit `.env` files to version control
   - Use environment-specific configurations
   - Leverage cloud-native secret management

### Files to Review Before Production:

- ✅ `.env.example` → Create `.env` with real values
- ✅ `docker-compose.yml` → Update passwords via environment variables
- ✅ `backend/src/config/index.ts` → Ensure no hardcoded secrets

### Recommended Secret Management:

**GCP (Recommended for Cloud Run/GKE)**
```bash
# Store secrets in Secret Manager
gcloud secrets create jwt-secret --data-file=- <<< "your-strong-secret"
gcloud secrets create db-password --data-file=- <<< "your-db-password"
```

**Kubernetes Secrets**
```bash
kubectl create secret generic compliancepulse-secrets \
  --from-literal=jwt-secret=your-strong-secret \
  --from-literal=db-password=your-db-password
```

**Docker Compose with .env**
```bash
# Create .env file (not committed to git)
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> .env
```

## GitGuardian Configuration

This repository includes a `.gitguardian.yaml` file that:
- Excludes example files from secret scanning
- Documents known placeholder values
- Prevents false positives in CI/CD

If you add new configuration files, ensure they:
1. Use clearly labeled placeholder values (e.g., `CHANGE_ME`, `your-value-here`)
2. Include security warnings in comments
3. Are listed in `.gitguardian.yaml` if they contain examples

## Security Best Practices

- ✅ Use environment variables for all secrets
- ✅ Rotate secrets regularly
- ✅ Use short-lived credentials (SPIFFE SVIDs are auto-rotated)
- ✅ Enable audit logging in production
- ✅ Review OPA policies before deployment
- ✅ Use TLS/HTTPS for all network communication
- ✅ Implement network segmentation
- ✅ Regular security audits and penetration testing

For more information, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
