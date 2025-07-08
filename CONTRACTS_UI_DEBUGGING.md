# Contracts UI Debugging Guide

## 🎯 **Issue**: Contracts not showing in the UI

The backend is working correctly and has 3 contracts created between TDC and TDP users. Here's how to test and debug the frontend.

## ✅ **Backend Status (Confirmed Working)**

- ✅ 3 contracts created successfully
- ✅ TDC User: tdcuser@example.com (ID: 2) - 3 contracts
- ✅ TDP User: tdpuser@example.com (ID: 3) - 3 contracts
- ✅ API endpoints working correctly
- ✅ Authentication working

## 🔧 **Frontend Testing Steps**

### Step 1: Access the Frontend
1. Open your browser and go to: `http://localhost:3000`
2. You should see the login page

### Step 2: Login as TDC User
1. Use these credentials:
   - **Email:** `tdcuser@example.com`
   - **Password:** `T8g#d4&Y@n$y`
2. Click "Login"
3. You should be redirected to the Dashboard

### Step 3: Navigate to Contracts
1. Click on "Contracts" in the left sidebar
2. You should see the contracts page

### Step 4: Check for Contracts
You should see 3 contracts listed:
1. **CONTRACT-1751998618776-3** - IMDB Movie Reviews Sentiment ($360.00)
2. **CONTRACT-1751998618770-2** - CIFAR-10 Image Classification ($500.00)
3. **CONTRACT-1751998618753-1** - MNIST Handwritten Digits ($150.00)

## 🐛 **If Contracts Still Don't Show**

### Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for any error messages
4. Common issues:
   - Network errors (CORS, 401, 403)
   - JavaScript errors
   - React Query errors

### Check Network Tab
1. In Developer Tools, go to Network tab
2. Refresh the contracts page
3. Look for API calls to `/api/contracts/user/{userId}`
4. Check if they return 200 status with contract data

### Check Authentication
1. In Developer Tools, go to Application tab
2. Check Local Storage for `authToken`
3. If no token, you need to login again

## 🔍 **Debugging Commands**

### Test Backend API Directly
```bash
# Login and get token
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tdcuser@example.com","password":"T8g#d4&Y@n$y"}'

# Use the token to get contracts
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:5001/api/contracts/user/2
```

### Test Frontend-Backend Communication
```bash
# Test CORS
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS http://localhost:5001/api/contracts/user/2
```

## 🛠 **Recent Changes Made**

1. **Updated Contracts.js** to use current user ID instead of hardcoded ID 1
2. **Added loading and error states** for better UX
3. **Fixed authentication integration** with UserContext
4. **Added proper error handling** for API calls

## 📋 **Expected Behavior**

### When Logged In as TDC User:
- Should see 3 contracts in the table
- Each contract shows: Contract ID, Dataset, Parties, Price, Duration, Status
- Status should be "PENDING_TDP_APPROVAL" for all contracts
- Should be able to view contract details by clicking the eye icon

### When Logged In as TDP User:
- Should see the same 3 contracts
- Can view contract details
- May have different actions available based on role

## 🚨 **Common Issues & Solutions**

### Issue: "No contracts found" message
**Solution:** Check if you're logged in with the correct user account

### Issue: Loading spinner never stops
**Solution:** Check browser console for API errors

### Issue: "Error loading contracts" message
**Solution:** Check if backend is running on port 5001

### Issue: Empty table with no error
**Solution:** Check if the user ID in the API call matches the logged-in user

## 📞 **Next Steps**

If you're still not seeing contracts after following these steps:

1. **Check the browser console** for any error messages
2. **Verify you're logged in** with the correct user account
3. **Try logging out and back in** to refresh the authentication
4. **Check if both frontend and backend are running** on the correct ports

The backend is confirmed working, so the issue is likely in the frontend authentication or API integration. 