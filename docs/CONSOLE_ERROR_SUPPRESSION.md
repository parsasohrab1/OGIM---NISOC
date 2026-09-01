# Console Error Suppression Guide

## Overview

The OGIM dashboard implements comprehensive console error suppression for network-related errors when backend services are not running. However, some errors may still appear in the browser's DevTools Network tab, which cannot be suppressed from JavaScript code.

## Network Errors

### Expected Behavior

When backend services are not running, you may see network errors in the browser console:
- `ERR_EMPTY_RESPONSE` - Service is not available
- `ERR_NETWORK` - Network connection failed
- `net::ERR_EMPTY_RESPONSE` - Browser-level network error

### Automatic Suppression

The application automatically suppresses these errors in the console:
- ✅ Console.error override filters network errors
- ✅ Console.warn override filters network warnings
- ✅ Console.log override filters network logs
- ✅ Unhandled promise rejection handler prevents network error logging

### Patterns Suppressed

The following error patterns are automatically suppressed:
- `services.ts:382` - getWellData function
- `services.ts:396` - getWells function
- `Well3D.tsx:831`, `Well3D.tsx:850`, `Well3D.tsx:861` - Query functions
- Any error containing `ERR_EMPTY_RESPONSE` or `ERR_NETWORK`
- Any error containing `localhost:8000/api/digital-twin`
- Any error containing `dispatchXhrRequest` or `xhr`

## DevTools Network Tab

### Important Note

Errors appearing in the **DevTools Network tab** cannot be suppressed from JavaScript code. These are logged directly by the browser's network layer and are part of the normal DevTools functionality.

### Filtering in DevTools

To hide network errors in DevTools:

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Click the filter icon** (funnel icon)
4. **Add negative filters**:
   - `-status-code:0` (hides failed requests)
   - `-method:GET` (if you want to hide GET requests)
   - Or use the search box: `-ERR_EMPTY_RESPONSE`

### Console Filtering

To filter console errors:

1. **Open DevTools** (F12)
2. **Go to Console tab**
3. **Click the filter icon** (funnel icon)
4. **Add negative filters**:
   - `-ERR_EMPTY_RESPONSE`
   - `-ERR_NETWORK`
   - `-services.ts:`
   - `-Well3D.tsx:`

## Application Behavior

### Graceful Degradation

The application handles network errors gracefully:
- ✅ Returns mock data when services are unavailable
- ✅ Displays fallback UI when API calls fail
- ✅ Continues to function without backend services
- ✅ Suppresses console errors automatically

### Error Handling

All API calls include error handling:
```typescript
try {
  const response = await apiClient.get('/api/endpoint')
  return response.data
} catch (error: any) {
  // Network errors are handled gracefully
  if (error.code === 'ERR_NETWORK' || error.code === 'ERR_EMPTY_RESPONSE') {
    return null // Use mock data
  }
  return null
}
```

## Troubleshooting

### Errors Still Appearing

If you still see errors in the console:

1. **Hard refresh the page** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Clear browser cache**
3. **Check if errors are from DevTools Network tab** (these cannot be suppressed)
4. **Verify the error suppression code is loaded** (check `frontend/web/src/api/client.ts`)

### Disabling Error Suppression

To disable error suppression for debugging:

1. Open `frontend/web/src/api/client.ts`
2. Comment out the console override section
3. Restart the development server

## Best Practices

1. **Development**: Use console filters to hide network errors
2. **Production**: Errors are automatically suppressed
3. **Debugging**: Temporarily disable suppression to see all errors
4. **Monitoring**: Use proper error monitoring tools instead of console logs

## Related Files

- `frontend/web/src/api/client.ts` - Console error suppression implementation
- `frontend/web/src/api/services.ts` - API error handling
- `frontend/web/src/pages/Well3D.tsx` - Well 3D data fetching with error handling

