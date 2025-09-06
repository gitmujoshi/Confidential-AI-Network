# SCITT CCF Comprehensive Test Plan
**Objective**: Isolate and resolve the remaining `contractId` null issue  
**Status**: Ready for execution  
**Priority**: High  

## 🎯 **Test Objectives**

1. **Verify Data Flow Integrity**: Ensure `contractId` is preserved through the entire pipeline
2. **Isolate Transformation Point**: Identify where `contractId` becomes `null`
3. **Validate Database Operations**: Confirm model and database interactions
4. **Test Edge Cases**: Validate with different data types and scenarios

## 🔍 **Test Environment Setup**

### **Prerequisites**
- ✅ Backend running on port 5001
- ✅ SCITT CCF node running on port 8000
- ✅ PostgreSQL database accessible
- ✅ Test user authenticated and available
- ✅ Debug logging enabled in all services

### **Test Data**
- **Valid Contract ID**: `1` (exists in contracts table)
- **Invalid Contract ID**: `999` (doesn't exist)
- **String Contract ID**: `"1"` (string format)
- **Null Contract ID**: `null` (edge case)

## 📋 **Test Suite 1: Data Flow Validation**

### **Test 1.1: Route Level Data Preservation**
**Objective**: Verify data integrity at the route level

```bash
# Test with minimal payload
curl -X POST http://localhost:5001/api/scitt-ccf/contracts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"contractId": 1}'
```

**Expected Result**: Debug output showing `contractData.contractId: 1`
**Success Criteria**: Route receives and logs correct `contractId`

### **Test 1.2: ContractRouterService Data Flow**
**Objective**: Verify data integrity through ContractRouterService

**Expected Result**: Debug output showing:
```
🔍 ContractRouter Debug - contractData: {"contractId": 1}
🔍 ContractRouter Debug - contractData.contractId: 1
```

**Success Criteria**: ContractRouterService receives correct data

### **Test 1.3: ScittCcfService Data Flow**
**Objective**: Verify data integrity through ScittCcfService

**Expected Result**: Debug output showing:
```
🔍 Debug createContract - contractData.contractId: 1
🔍 Debug createContract - typeof contractData.contractId: number
```

**Success Criteria**: ScittCcfService receives correct data and type

## 📋 **Test Suite 2: Data Transformation Analysis**

### **Test 2.1: ProvenanceService Data Handling**
**Objective**: Verify data integrity through provenance processing

**Expected Result**: Debug output showing:
```
🔍 Debug createContract - provenanceData: {...}
🔍 Debug createContract - provenanceTree: {...}
```

**Success Criteria**: ProvenanceService processes data without corruption

### **Test 2.2: Claim Building Process**
**Objective**: Verify claim data integrity

**Expected Result**: Debug output showing:
```
🔍 Debug createContract - claim: {
  "type": "contract_creation",
  "data": {
    "contractId": 1,
    ...
  }
}
```

**Success Criteria**: Claim object contains correct `contractId`

### **Test 2.3: SCITT CCF Submission**
**Objective**: Verify blockchain submission data integrity

**Expected Result**: Debug output showing:
```
🔍 Debug createContract - response: {
  "claimId": "...",
  "receipt": "...",
  "status": "PENDING"
}
```

**Success Criteria**: Blockchain submission successful with correct data

## 📋 **Test Suite 3: Database Operation Validation**

### **Test 3.1: Model Field Mapping**
**Objective**: Verify Sequelize model field mappings

**Test Steps**:
1. Check if `ScittClaim` model is properly loaded
2. Verify field mappings (`contractId` → `contract_id`)
3. Test model instantiation with sample data

**Expected Result**: Model accepts data without field mapping errors

### **Test 3.2: Database Insert Operation**
**Objective**: Verify database insert operation

**Test Steps**:
1. Test direct model creation with valid data
2. Verify foreign key constraint validation
3. Check for any database-level transformations

**Expected Result**: Successful database insert with correct data

### **Test 3.3: Association Validation**
**Objective**: Verify model associations work correctly

**Test Steps**:
1. Test `ScittClaim.belongsTo(models.Contract)` association
2. Verify foreign key relationship
3. Test query operations with associations

**Expected Result**: Associations work without data corruption

## 📋 **Test Suite 4: Edge Case Testing**

### **Test 4.1: String vs Integer Contract ID**
**Objective**: Test data type handling

```bash
# Test with string contract ID
curl -X POST http://localhost:5001/api/scitt-ccf/contracts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"contractId": "1"}'
```

**Expected Result**: String converted to integer successfully
**Success Criteria**: No type conversion errors

### **Test 4.2: Invalid Contract ID**
**Objective**: Test foreign key constraint handling

```bash
# Test with non-existent contract ID
curl -X POST http://localhost:5001/api/scitt-ccf/contracts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"contractId": 999}'
```

**Expected Result**: Foreign key constraint error (not null violation)
**Success Criteria**: Proper error handling for invalid references

### **Test 4.3: Missing Contract ID**
**Objective**: Test null handling

```bash
# Test without contract ID
curl -X POST http://localhost:5001/api/scitt-ccf/contracts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{}'
```

**Expected Result**: Validation error for missing required field
**Success Criteria**: Proper validation before database operation

## 📋 **Test Suite 5: Debug Output Analysis**

### **Test 5.1: Console Log Verification**
**Objective**: Verify all debug statements are working

**Expected Output**:
```
🔍 Route Debug - contractData: {"contractId": 1}
🔍 Route Debug - contractData.contractId: 1
🔍 ContractRouter Debug - contractData: {"contractId": 1}
🔍 ContractRouter Debug - contractData.contractId: 1
🔍 Debug createContract - contractData.contractId: 1
🔍 Debug createContract - typeof contractData.contractId: number
🔍 Debug storeClaimLocally - contractData.contractId: 1
```

**Success Criteria**: All debug statements execute and show correct data

### **Test 5.2: Error Log Analysis**
**Objective**: Analyze error logs for additional context

**Expected Result**: Detailed error logs showing exact failure point
**Success Criteria**: Error logs provide actionable debugging information

## 🚀 **Test Execution Strategy**

### **Phase 1: Basic Data Flow (Tests 1.1-1.3)**
- Execute route-level tests
- Verify data preservation through service layers
- Identify first point of data corruption

### **Phase 2: Transformation Analysis (Tests 2.1-2.3)**
- Execute data transformation tests
- Verify each processing step
- Identify transformation point causing data loss

### **Phase 3: Database Validation (Tests 3.1-3.3)**
- Execute database operation tests
- Verify model and database interactions
- Identify database-level issues

### **Phase 4: Edge Case Testing (Tests 4.1-4.3)**
- Execute edge case tests
- Verify error handling
- Identify boundary condition issues

### **Phase 5: Debug Analysis (Tests 5.1-5.2)**
- Analyze all debug output
- Correlate with error logs
- Identify root cause

## 📊 **Success Metrics**

### **Primary Success Criteria**
- ✅ All debug statements execute successfully
- ✅ Data flows correctly through all service layers
- ✅ Database operations complete without errors
- ✅ SCITT CCF contract creation works end-to-end

### **Secondary Success Criteria**
- ✅ Error handling works correctly for edge cases
- ✅ Performance remains within acceptable limits
- ✅ No regressions in existing functionality

## 🔧 **Debugging Tools Available**

1. **Console Logging**: Comprehensive debug output in all services
2. **Database Logs**: PostgreSQL query logging enabled
3. **Error Stack Traces**: Detailed error information
4. **Health Monitoring**: Real-time system status
5. **API Response Logging**: Request/response logging

## 📝 **Test Results Documentation**

After each test execution:
1. **Record Results**: Success/failure status
2. **Document Output**: Debug statements and error messages
3. **Identify Issues**: Any data corruption or errors
4. **Plan Next Steps**: Based on test results

---

**Next Action**: Execute Phase 1 tests to begin systematic debugging
**Estimated Time**: 15-30 minutes for complete test execution
**Expected Outcome**: Identification of exact point where `contractId` becomes `null`
