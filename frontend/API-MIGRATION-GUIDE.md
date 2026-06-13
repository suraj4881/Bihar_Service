# 🔄 API URL Migration Guide

This guide helps you update all hardcoded API URLs to use the centralized API utility.

## ✅ Already Updated Files

- ✅ `src/services/authService.ts`
- ✅ `src/services/serviceService.ts`
- ✅ `src/services/analyticsService.ts`
- ✅ `src/utils/api.ts` (new utility)

## 📝 How to Update Remaining Files

### Pattern to Replace

**Before:**
```typescript
const response = await fetch('http://localhost:8080/api/endpoint');
```

**After:**
```typescript
import { getApiUrl } from '../utils/api';

const response = await fetch(getApiUrl('endpoint'));
```

### For File URLs

**Before:**
```typescript
src={`http://localhost:8080/api/files/serve?filePath=${encodeURIComponent(path)}`}
```

**After:**
```typescript
import { getFileServeUrl } from '../utils/api';

src={getFileServeUrl(path)}
```

## 📋 Files That Need Updates

### High Priority (Most Used)

1. **`src/pages/HomePage.tsx`**
   - Line 60: `http://localhost:8080/api/stats/dashboard`

2. **`src/pages/LoginPage.tsx`**
   - Line 105: `http://localhost:8080/api/auth/login`

3. **`src/pages/RegisterPage.tsx`**
   - Line 144: `http://localhost:8080/api/auth/register`

4. **`src/pages/ProviderDashboard.tsx`**
   - Multiple API calls (lines 242, 274, 306, etc.)

5. **`src/pages/CustomerDashboard.tsx`**
   - Multiple API calls

6. **`src/pages/ProfilePage.tsx`**
   - Multiple API calls

### Medium Priority

7. **`src/pages/ProviderDetailPage.tsx`**
8. **`src/pages/ServiceSearchPage.tsx`**
9. **`src/pages/KYCVerificationPage.tsx`**
10. **`src/pages/EmailOTPPage.tsx`**
11. **`src/pages/EmailVerificationPage.tsx`**
12. **`src/pages/SupportDashboard.tsx`**
13. **`src/pages/SupportRequestPage.tsx`**

### Low Priority

14. **`src/pages/ProviderServiceUpload.tsx`**
15. **`src/pages/ProviderProfileSetup.tsx`**
16. **`src/pages/CustomerProfileSetup.tsx`**

## 🔧 Quick Update Script

You can use find-and-replace in your IDE:

### Find:
```
http://localhost:8080/api/
```

### Replace with:
```
getApiUrl('
```

Then manually adjust the endpoint paths.

## 📖 Example Updates

### Example 1: Simple API Call

**Before:**
```typescript
const response = await fetch('http://localhost:8080/api/stats/dashboard');
```

**After:**
```typescript
import { getApiUrl } from '../utils/api';

const response = await fetch(getApiUrl('stats/dashboard'));
```

### Example 2: API Call with Query Params

**Before:**
```typescript
const response = await fetch(`http://localhost:8080/api/users/${userId}`);
```

**After:**
```typescript
import { getApiUrl } from '../utils/api';

const response = await fetch(getApiUrl(`users/${userId}`));
```

### Example 3: POST Request

**Before:**
```typescript
const response = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

**After:**
```typescript
import { getApiUrl } from '../utils/api';

const response = await fetch(getApiUrl('auth/login'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### Example 4: File URL in Image

**Before:**
```typescript
<img src={`http://localhost:8080/api/files/serve?filePath=${encodeURIComponent(image)}`} />
```

**After:**
```typescript
import { getFileServeUrl } from '../utils/api';

<img src={getFileServeUrl(image)} />
```

## ⚠️ Important Notes

1. **Don't include `/api` in the endpoint** - it's already added by `getApiUrl()`
2. **Don't include leading slash** - `getApiUrl()` handles it
3. **For file paths**, use `getFileServeUrl()` instead of `getApiUrl()`
4. **Test each change** to ensure it works correctly

## 🧪 Testing

After updating each file:

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Test the functionality** that uses the updated API call

3. **Check browser console** for any errors

4. **Verify network requests** in DevTools → Network tab

## ✅ Verification Checklist

- [ ] All `http://localhost:8080/api/` replaced
- [ ] All imports added: `import { getApiUrl, getFileServeUrl } from '../utils/api';`
- [ ] No hardcoded localhost URLs remain
- [ ] Application runs without errors
- [ ] All API calls work correctly
- [ ] File serving works correctly
- [ ] Environment variable `REACT_APP_API_URL` can be set

## 🚀 After Migration

Once all files are updated:

1. **Set environment variable in Vercel:**
   - `REACT_APP_API_URL` = Your Railway backend URL

2. **Test production build:**
   ```bash
   npm run build
   ```

3. **Deploy to Vercel**

4. **Verify production deployment** works correctly

---

**Note:** The centralized API utility automatically uses `REACT_APP_API_URL` environment variable when available, making deployment seamless!
