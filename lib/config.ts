// Get the stats API URL from environment variable or use production default
export function getStatsApiUrl(): string {
  return process.env.NEXT_PUBLIC_STATS_API_URL || 'https://stats.specstory.com';
}