# Database Naming Conventions

## 🎯 **Table Naming**
- **Plural, snake_case**
- **Examples:** `users`, `contracts`, `datasets`, `contract_templates`

## 🗂️ **Column Naming**
- **snake_case**
- **Primary Key:** `id` (auto-increment integer)
- **Foreign Keys:** `{table_name}_id` (e.g., `user_id`, `contract_id`)
- **Timestamps:** `created_at`, `updated_at`
- **Boolean:** `is_active`, `has_permission`
- **Arrays:** `{field_name}s` (e.g., `tdp_ids`, `ai_model_ids`)

## 🔗 **Relationship Naming**
- **Junction Tables:** `{table1}_{table2}` (e.g., `contract_datasets`)
- **Foreign Key Constraints:** `{table_name}_{column_name}_fkey`
- **Unique Constraints:** `{table_name}_{column_name}_key`

## 📊 **Index Naming**
- **Primary Key:** `{table_name}_pkey`
- **Foreign Keys:** `idx_{table_name}_{column_name}`
- **Unique:** `{table_name}_{column_name}_key`
- **Composite:** `idx_{table_name}_{column1}_{column2}`

## 🚫 **Avoid**
- **CamelCase** in database (use snake_case)
- **Abbreviations** (use full descriptive names)
- **Reserved words** as table/column names

## ✅ **Examples**

### **Good:**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contracts (
  id SERIAL PRIMARY KEY,
  contract_id VARCHAR(255) UNIQUE NOT NULL,
  tdc_id INTEGER NOT NULL REFERENCES users(id),
  ccrp_id INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'DRAFT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contract_datasets (
  id SERIAL PRIMARY KEY,
  contract_id VARCHAR(255) NOT NULL REFERENCES contracts(contract_id),
  dataset_id VARCHAR(255) NOT NULL REFERENCES datasets(dataset_id),
  tdp_id INTEGER NOT NULL REFERENCES users(id),
  individual_price DECIMAL(10,2),
  payment_status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Bad:**
```sql
-- Avoid camelCase
CREATE TABLE Users (
  userId SERIAL PRIMARY KEY,
  userName VARCHAR(255),
  createdAt TIMESTAMP
);

-- Avoid abbreviations
CREATE TABLE usrs (
  usr_id SERIAL PRIMARY KEY,
  usr_nm VARCHAR(255)
);
```
