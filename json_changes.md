# Stats API JSON Response Format Changes

## Overview
The Stats API response structure has been updated to better reflect the comprehensive statistics being provided, including both prompt/documentation metrics and git commit activity.

## Key Changes

### 1. Top-Level Field Changes
- `filesProcessed` → `sessionsProcessed` (renamed to better represent chat/coding sessions)
- `promptsPerDay` → `dailyStats` (renamed as it now includes both prompt and commit statistics)
- Added `totalCommits` field at top level for total repository commits

### 2. Daily Statistics Structure Changes

#### Old Structure (`promptsPerDay`):
```json
"promptsPerDay": {
  "averagePerDay": 90.33,
  "medianPerDay": 37,
  "maxPerDay": 202,
  "minPerDay": 32,
  "totalDays": 3,
  "dateRange": {...},
  "dailyDetails": [...]
}
```

#### New Structure (`dailyStats`):
```json
"dailyStats": {
  "promptsAverage": 90.33,    // was: averagePerDay
  "promptsMedian": 37,         // was: medianPerDay
  "promptsMax": 202,           // was: maxPerDay
  "promptsMin": 32,            // was: minPerDay
  "commitsAverage": 13.83,     // NEW
  "commitsMedian": 8,          // NEW
  "commitsMax": 47,            // NEW
  "commitsMin": 1,             // NEW
  "totalDays": 6,              // unchanged
  "dateRange": {...},          // unchanged
  "dailyDetails": [...]        // structure changed, see below
}
```

### 3. Daily Details Array Changes

#### Old Structure:
```json
{
  "date": "2025-07-19",
  "promptCount": 37,
  "fileCount": 1,         // renamed
  "commitCount": 5        // already existed
}
```

#### New Structure:
```json
{
  "date": "2025-07-19",
  "promptCount": 37,
  "sessionCount": 1,      // was: fileCount
  "commitCount": 23       // unchanged
}
```

## Complete Response Comparison

### Previous Format:
```json
{
  "success": true,
  "data": {
    "repo": "specstoryai/tnyOffice",
    "branch": "main",
    "promptCount": 271,
    "filesProcessed": 15,
    "processingTimeMs": 234,
    "totalCommits": 83,
    "promptsPerDay": {
      "averagePerDay": 90.33,
      "medianPerDay": 37,
      "maxPerDay": 202,
      "minPerDay": 32,
      "totalDays": 3,
      "dateRange": {
        "start": "2025-07-19",
        "end": "2025-07-21"
      },
      "dailyDetails": [
        {
          "date": "2025-07-19",
          "promptCount": 37,
          "fileCount": 1,
          "commitCount": 5
        }
      ]
    }
  }
}
```

### Current Format:
```json
{
  "success": true,
  "data": {
    "repo": "specstoryai/tnyOffice",
    "branch": "main",
    "promptCount": 271,
    "sessionsProcessed": 15,
    "processingTimeMs": 234,
    "totalCommits": 83,
    "dailyStats": {
      "promptsAverage": 90.33,
      "promptsMedian": 37,
      "promptsMax": 202,
      "promptsMin": 32,
      "commitsAverage": 13.83,
      "commitsMedian": 8,
      "commitsMax": 47,
      "commitsMin": 1,
      "totalDays": 6,
      "dateRange": {
        "start": "2025-07-19",
        "end": "2025-08-20"
      },
      "dailyDetails": [
        {
          "date": "2025-07-19",
          "promptCount": 37,
          "sessionCount": 1,
          "commitCount": 23
        },
        {
          "date": "2025-08-20",
          "promptCount": 0,
          "sessionCount": 0,
          "commitCount": 1
        }
      ]
    }
  }
}
```

## Migration Guide

### For Frontend Code:

1. **Update field references:**
   ```javascript
   // Old
   response.data.filesProcessed
   response.data.promptsPerDay.averagePerDay
   response.data.promptsPerDay.dailyDetails[0].fileCount
   
   // New
   response.data.sessionsProcessed
   response.data.dailyStats.promptsAverage
   response.data.dailyStats.dailyDetails[0].sessionCount
   ```

2. **Handle new commit statistics:**
   ```javascript
   // Now available
   const commitStats = {
     average: response.data.dailyStats.commitsAverage,
     median: response.data.dailyStats.commitsMedian,
     max: response.data.dailyStats.commitsMax,
     min: response.data.dailyStats.commitsMin
   };
   ```

3. **Note on null safety:**
   - `dailyStats` can be null if no activity is found
   - Days with commits but no prompts will now be included in `dailyDetails`
   - `promptCount` and `sessionCount` can be 0 for commit-only days

## New Capabilities

1. **Works with any GitHub repository** - Not just those with `.specstory/history`
2. **Comprehensive commit statistics** - Separate averages, medians, max, and min for both prompts and commits
3. **Complete activity picture** - Includes days with commits but no documentation activity
4. **Better terminology** - "Sessions" better represents chat/coding sessions than "files"

## TypeScript Interface (Updated)

```typescript
interface AnalyzeResponse {
  success: boolean;
  data?: {
    repo: string;
    branch: string;
    promptCount: number;
    sessionsProcessed: number;  // was: filesProcessed
    processingTimeMs: number;
    totalCommits: number;
    dailyStats?: {  // was: promptsPerDay
      promptsAverage: number;   // was: averagePerDay
      promptsMedian: number;    // was: medianPerDay
      promptsMax: number;       // was: maxPerDay
      promptsMin: number;       // was: minPerDay
      commitsAverage: number;   // NEW
      commitsMedian: number;    // NEW
      commitsMax: number;       // NEW
      commitsMin: number;       // NEW
      totalDays: number;
      dateRange?: {
        start: string;
        end: string;
      };
      dailyDetails: Array<{
        date: string;
        promptCount: number;
        sessionCount: number;    // was: fileCount
        commitCount: number;
      }>;
    };
  };
  error?: string;
}
```

## Questions or Issues?
If you encounter any issues during migration or need clarification on any of the changes, please reach out to the backend team.