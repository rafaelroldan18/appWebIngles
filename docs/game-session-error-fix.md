# Game Session Error Fix - Documentation

## Problem Summary
The application was throwing a console error when trying to end a game session:
```
Failed to end session. Server response: {}
at GameSessionManager.endSession (src/lib/games/GameSessionManager.ts:163:25)
```

## Root Cause Analysis

### Database Schema Type Mismatch
The `game_sessions` table has the `score` column defined as `integer`:
```sql
score integer NOT NULL DEFAULT 0 CHECK (score >= 0)
```

However, the application was calculating scores as decimal values (e.g., `6.4`) using the formula:
```typescript
// In MissionEvaluator.generateStandardizedDetails
const scoreFinal = totalItems > 0
    ? Math.round((correctCount / totalItems) * 10 * 10) / 10  // Produces decimals like 6.4
    : 0;
```

This created a **type mismatch** - PostgreSQL's `integer` type cannot accept decimal values, resulting in the error:
```
invalid input syntax for type integer: "6.4"
```

### Additional Constraint
The database also has a CHECK constraint requiring scores to be non-negative:
```sql
CHECK (score >= 0)
```

### Error Handling Issues
1. **Server-side**: The API endpoint wasn't providing detailed error messages when database constraints were violated
2. **Client-side**: The error response parsing was failing silently, resulting in an empty object `{}`
3. **Logging**: Insufficient logging made it difficult to debug what payload was being sent

## Solutions Implemented

### 1. Enhanced API Error Handling (`app/api/games/sessions/[sessionId]/route.ts`)

**Added pre-validation:**
```typescript
// Validate score constraint before updating
if (body.score !== undefined && body.score < 0) {
    console.error('Score validation failed:', { sessionId, score: body.score });
    return NextResponse.json({ 
        error: 'Score must be greater than or equal to 0',
        details: { score: body.score }
    }, { status: 400 });
}
```

**Enhanced error logging:**
```typescript
if (sessionError) {
    console.error('Database error updating session:', { 
        sessionId, 
        error: sessionError.message,
        code: sessionError.code,
        details: sessionError.details,
        hint: sessionError.hint
    });
    return NextResponse.json({ 
        error: sessionError.message,
        code: sessionError.code,
        details: sessionError.details,
        hint: sessionError.hint
    }, { status: 400 });
}
```

### 2. Improved Client Error Handling (`src/lib/games/GameSessionManager.ts`)

**CRITICAL FIX - Round score to integer:**
```typescript
// Ensure score is non-negative and round to integer (database expects integer type)
const finalScore = Math.max(0, Math.round(details.summary.score_final));
```

This ensures the score sent to the database is always an integer, matching the database column type.

**Added request logging:**
```typescript
// Log the payload for debugging
console.log('Ending session with payload:', {
    sessionId: this.sessionId,
    score: payload.score,
    duration: payload.duration_seconds,
    correct: payload.correct_count,
    wrong: payload.wrong_count
});
```

**Better error response parsing:**
```typescript
if (!response.ok) {
    let errorData: any = {};
    const contentType = response.headers.get('content-type');
    
    // Try to parse error response
    if (contentType && contentType.includes('application/json')) {
        try {
            errorData = await response.json();
        } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
            errorData = { error: 'Failed to parse server response' };
        }
    } else {
        // If not JSON, get text response
        const textResponse = await response.text();
        errorData = { error: textResponse || response.statusText };
    }

    console.error('Failed to end session:', {
        sessionId: this.sessionId,
        status: response.status,
        statusText: response.statusText,
        errorData,
        sentPayload: payload
    });
}
```

### 3. Score Validation Safeguard (`src/lib/gamification/MissionEvaluator.ts`)

**Added Math.max to ensure non-negative scores:**
```typescript
const scoreFinal = totalItems > 0
    ? Math.max(0, Math.round((correctCount / totalItems) * 10 * 10) / 10)
    : 0;
```

## How to Debug Similar Issues

### 1. Check Browser Console
Look for the detailed error logs that now include:
- Session ID
- HTTP status code
- Error message from server
- Full payload that was sent
- Server response details

### 2. Check Server Logs
The server now logs:
- Score validation failures
- Database error details including error codes and hints
- Session ID for tracking

### 3. Verify Data Integrity
Before ending a session, check:
```typescript
console.log('Session data:', {
    score: sessionData.score,
    correctCount: sessionData.correctCount,
    wrongCount: sessionData.wrongCount,
    items: sessionData.items.length
});
```

### 4. Database Constraints
Always verify database constraints when encountering update errors:
```sql
-- Check constraints on game_sessions table
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_schema = 'public' 
AND constraint_name LIKE 'game_sessions%';
```

## Testing Recommendations

### Test Case 1: Normal Session
- Play a game normally
- Complete with positive score
- Verify session ends successfully

### Test Case 2: Zero Score
- Complete a game with 0 correct answers
- Verify score is 0 (not negative)
- Verify session ends successfully

### Test Case 3: Edge Cases
- Test with very high scores
- Test with decimal scores
- Test with missing data

## Prevention Strategies

1. **Always validate data before API calls**
   - Use `Math.max(0, score)` for scores
   - Validate required fields exist
   - Check data types match schema

2. **Implement comprehensive error handling**
   - Log request payloads
   - Parse error responses properly
   - Provide meaningful error messages

3. **Add database constraints validation**
   - Check constraints before sending to API
   - Handle constraint violations gracefully
   - Provide user-friendly error messages

## Files Modified

1. `app/api/games/sessions/[sessionId]/route.ts` - Enhanced API error handling
2. `src/lib/games/GameSessionManager.ts` - Improved client error handling
3. `src/lib/gamification/MissionEvaluator.ts` - Added score validation safeguard

## Next Steps

If the error persists:
1. Check the browser console for the detailed error logs
2. Verify the payload being sent (now logged)
3. Check if there are other database constraints being violated
4. Review the server logs for database error details
