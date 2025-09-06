-- SCITT CCF Database Initialization Script
-- This script creates the initial database schema for SCITT CCF services

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create SCITT claims table
CREATE TABLE IF NOT EXISTS scitt_claims (
    id SERIAL PRIMARY KEY,
    claim_id VARCHAR(255) NOT NULL UNIQUE,
    contract_id VARCHAR(255) NOT NULL,
    claim_type VARCHAR(100) NOT NULL,
    data_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for scitt_claims
CREATE INDEX IF NOT EXISTS idx_claim_id ON scitt_claims (claim_id);
CREATE INDEX IF NOT EXISTS idx_contract_id ON scitt_claims (contract_id);
CREATE INDEX IF NOT EXISTS idx_claim_type ON scitt_claims (claim_type);
CREATE INDEX IF NOT EXISTS idx_status ON scitt_claims (status);

-- Create merkle trees table
CREATE TABLE IF NOT EXISTS merkle_trees (
    id SERIAL PRIMARY KEY,
    tree_id VARCHAR(255) NOT NULL UNIQUE,
    contract_id VARCHAR(255) NOT NULL,
    tree_type VARCHAR(50) DEFAULT 'BINARY_MERKLE_TREE',
    hash_algorithm VARCHAR(20) DEFAULT 'SHA256',
    max_depth INTEGER DEFAULT 32,
    root_hash VARCHAR(255) NOT NULL,
    node_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for merkle_trees
CREATE INDEX IF NOT EXISTS idx_tree_id ON merkle_trees (tree_id);
CREATE INDEX IF NOT EXISTS idx_contract_id ON merkle_trees (contract_id);

-- Create provenance nodes table
CREATE TABLE IF NOT EXISTS provenance_nodes (
    id SERIAL PRIMARY KEY,
    node_id VARCHAR(255) NOT NULL UNIQUE,
    tree_id VARCHAR(255) NOT NULL REFERENCES merkle_trees (tree_id) ON DELETE CASCADE,
    node_type VARCHAR(100) NOT NULL,
    data_hash VARCHAR(255) NOT NULL,
    parent_hash VARCHAR(255),
    left_child_hash VARCHAR(255),
    right_child_hash VARCHAR(255),
    level INTEGER NOT NULL,
    position INTEGER NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT false
);

-- Create indexes for provenance_nodes
CREATE INDEX IF NOT EXISTS idx_node_id ON provenance_nodes (node_id);
CREATE INDEX IF NOT EXISTS idx_tree_id_nodes ON provenance_nodes (tree_id);
CREATE INDEX IF NOT EXISTS idx_level_position ON provenance_nodes (level, position);

-- Create provenance captures table
CREATE TABLE IF NOT EXISTS provenance_captures (
    id SERIAL PRIMARY KEY,
    capture_id VARCHAR(255) NOT NULL UNIQUE,
    contract_id VARCHAR(255) NOT NULL,
    capture_type VARCHAR(100) NOT NULL,
    data_source VARCHAR(255) NOT NULL,
    node_id VARCHAR(255) NOT NULL REFERENCES provenance_nodes (node_id) ON DELETE CASCADE,
    merkle_proof JSONB,
    verification_status VARCHAR(50) DEFAULT 'PENDING',
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for provenance_captures
CREATE INDEX IF NOT EXISTS idx_capture_id ON provenance_captures (capture_id);
CREATE INDEX IF NOT EXISTS idx_contract_id_captures ON provenance_captures (contract_id);
CREATE INDEX IF NOT EXISTS idx_verification_status ON provenance_captures (verification_status);

-- Create provenance verifications table
CREATE TABLE IF NOT EXISTS provenance_verifications (
    id SERIAL PRIMARY KEY,
    verification_id VARCHAR(255) NOT NULL UNIQUE,
    capture_id VARCHAR(255) NOT NULL REFERENCES provenance_captures (capture_id) ON DELETE CASCADE,
    verification_method VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    details JSONB,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for provenance_verifications
CREATE INDEX IF NOT EXISTS idx_verification_id ON provenance_verifications (verification_id);
CREATE INDEX IF NOT EXISTS idx_capture_id_verifications ON provenance_verifications (capture_id);

-- Create system health log table
CREATE TABLE IF NOT EXISTS system_health_log (
    id SERIAL PRIMARY KEY,
    system_name VARCHAR(50) NOT NULL,
    health_status BOOLEAN NOT NULL,
    response_time INTEGER,
    error_message TEXT,
    metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for system_health_log
CREATE INDEX IF NOT EXISTS idx_system_name ON system_health_log (system_name);
CREATE INDEX IF NOT EXISTS idx_health_status ON system_health_log (health_status);
CREATE INDEX IF NOT EXISTS idx_created_at ON system_health_log (created_at);

-- Insert initial data
INSERT INTO system_health_log (system_name, health_status, response_time, metrics) VALUES
('database', true, 15, '{"version": "15", "connections": 1}'),
('redis', true, 2, '{"version": "7", "memory_used": "2MB"}'),
('merkle_tree_generation', true, 45, '{"algorithm": "SHA256", "max_depth": 32}');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_scitt_claims_updated_at BEFORE UPDATE ON scitt_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_merkle_trees_updated_at BEFORE UPDATE ON merkle_trees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO scitt_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO scitt_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO scitt_user;

-- Create a view for claim summary
CREATE OR REPLACE VIEW claim_summary AS
SELECT 
    c.claim_id,
    c.contract_id,
    c.claim_type,
    c.status,
    c.created_at,
    m.root_hash,
    m.node_count,
    COUNT(pc.id) as capture_count,
    COUNT(pv.id) as verification_count
FROM scitt_claims c
LEFT JOIN merkle_trees m ON c.contract_id = m.contract_id
LEFT JOIN provenance_captures pc ON c.contract_id = pc.contract_id
LEFT JOIN provenance_verifications pv ON pc.capture_id = pv.capture_id
GROUP BY c.claim_id, c.contract_id, c.claim_type, c.status, c.created_at, m.root_hash, m.node_count;

-- Grant permissions on view
GRANT SELECT ON claim_summary TO scitt_user;
