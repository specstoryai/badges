'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RepoPage({ 
  params 
}: { 
  params: Promise<{ owner: string; repo: string }> 
}) {
  const [repoParams, setRepoParams] = useState<{ owner: string; repo: string } | null>(null);
  const [repoInput, setRepoInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get query parameters
  const primary = searchParams.get('primary') || 'calendar'; // calendar, daily, trend, summary
  const showZeroDays = searchParams.get('showZeroDays') === 'true';
  const month = searchParams.get('month'); // YYYY-MM format
  const branch = searchParams.get('branch');
  const hideSecondary = searchParams.get('hideSecondary') === 'true';

  useEffect(() => {
    params.then(p => {
      setRepoParams(p);
      setRepoInput(`${p.owner}/${p.repo}`);
    });
    setMounted(true);
  }, [params]);

  const repo = repoParams ? `${repoParams.owner}/${repoParams.repo}` : '';

  const getDemoUrl = (type: string) => {
    if (!repoParams) return '';
    
    // Build URL without using window.location to avoid SSR issues
    const baseUrl = mounted && typeof window !== 'undefined' 
      ? window.location.origin 
      : '';
      
    if (!baseUrl) return '';
    
    let url = `${baseUrl}/api/badge/${repoParams.owner}/${repoParams.repo}/${type}.svg`;
    
    const params = new URLSearchParams();
    
    // Add branch if specified
    if (branch) params.append('branch', branch);
    
    // Add type-specific parameters
    if (type === 'calendar' && month) {
      params.append('month', month);
    }
    if ((type === 'daily' || type === 'trend') && showZeroDays) {
      params.append('showZeroDays', 'true');
    }
    
    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  };

  const updateBadges = () => {
    const [owner, name] = repoInput.split('/');
    if (owner && name) {
      // Preserve current query params when navigating
      const params = new URLSearchParams();
      if (branch) params.append('branch', branch);
      if (showZeroDays) params.append('showZeroDays', 'true');
      if (month) params.append('month', month);
      if (primary !== 'calendar') params.append('primary', primary);
      if (hideSecondary) params.append('hideSecondary', 'true');
      
      const queryString = params.toString();
      const url = `/${owner}/${name}${queryString ? `?${queryString}` : ''}`;
      router.push(url);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      updateBadges();
    }
  };

  const renderBadge = (type: string, isPrimary: boolean = false) => {
    const configs = {
      calendar: {
        title: '📅 Monthly Activity',
        alt: 'Activity Calendar',
        fullWidth: true
      },
      daily: {
        title: '📈 Daily Prompts',
        alt: 'Daily Activity',
        fullWidth: false
      },
      trend: {
        title: '📊 Trend Analysis',
        alt: 'Trend',
        fullWidth: false
      },
      summary: {
        title: '📋 Quick Summary',
        alt: 'Summary',
        fullWidth: false,
        centered: true
      }
    };

    const config = configs[type as keyof typeof configs];
    if (!config) return null;

    const containerClass = isPrimary 
      ? "bg-white rounded-xl shadow-2xl p-8 border-2 border-indigo-200"
      : "bg-white rounded-xl shadow-xl p-6";

    const imgClass = config.centered 
      ? "max-w-md mx-auto" 
      : "w-full";

    return (
      <div key={type}>
        {isPrimary && (
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{config.title}</h2>
        )}
        <div className={containerClass}>
          {!isPrimary && (
            <h3 className="text-lg font-semibold mb-3">{config.title}</h3>
          )}
          {mounted && (
            <img
              src={getDemoUrl(type)}
              alt={config.alt}
              className={imgClass}
              key={`${type}-${repo}-${branch}-${month}-${showZeroDays}`}
            />
          )}
        </div>
      </div>
    );
  };

  const renderBadges = () => {
    const badges = ['calendar', 'daily', 'trend', 'summary'];
    const otherBadges = badges.filter(b => b !== primary);
    
    return (
      <>
        {/* Primary badge - large and prominent */}
        {renderBadge(primary, true)}
        
        {/* Secondary badges - can be hidden */}
        {!hideSecondary && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Additional Metrics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {otherBadges.slice(0, 2).map(badge => renderBadge(badge))}
            </div>
            {otherBadges.length > 2 && (
              <div className="mt-6">
                {renderBadge(otherBadges[2])}
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  if (!repoParams) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
      {/* Hero Section with Repo Stats */}
      <div className="bg-white shadow-lg border-b-2 border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🤖 AI Coding Activity
              </h1>
              <p className="text-xl text-gray-600">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">{repo}</span>
                {branch && (
                  <span className="ml-2 text-sm font-mono bg-indigo-100 px-2 py-1 rounded">
                    {branch}
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-4 items-center">
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                onKeyPress={handleKeyPress}
                onBlur={updateBadges}
                placeholder="owner/repository"
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
              <button
                onClick={updateBadges}
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                View Stats
              </button>
            </div>
          </div>
          
          {/* Customization Controls */}
          {repoParams && (
          <div className="flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border">
              <span className="text-gray-600">Primary:</span>
              <select 
                value={primary}
                onChange={(e) => {
                  if (!repoParams) return;
                  const params = new URLSearchParams(searchParams.toString());
                  if (e.target.value === 'calendar') {
                    params.delete('primary');
                  } else {
                    params.set('primary', e.target.value);
                  }
                  router.push(`/${repoParams.owner}/${repoParams.repo}?${params.toString()}`);
                }}
                className="border-0 focus:outline-none bg-transparent"
              >
                <option value="calendar">Calendar</option>
                <option value="daily">Daily</option>
                <option value="trend">Trend</option>
                <option value="summary">Summary</option>
              </select>
            </label>
            
            {primary === 'calendar' && (
              <label className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border">
                <span className="text-gray-600">Month:</span>
                <input
                  type="month"
                  value={month || ''}
                  onChange={(e) => {
                    if (!repoParams) return;
                    const params = new URLSearchParams(searchParams.toString());
                    if (e.target.value) {
                      params.set('month', e.target.value);
                    } else {
                      params.delete('month');
                    }
                    router.push(`/${repoParams.owner}/${repoParams.repo}?${params.toString()}`);
                  }}
                  className="border-0 focus:outline-none bg-transparent"
                />
              </label>
            )}
            
            {(primary === 'daily' || primary === 'trend') && (
              <label className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border">
                <input
                  type="checkbox"
                  checked={showZeroDays}
                  onChange={(e) => {
                    if (!repoParams) return;
                    const params = new URLSearchParams(searchParams.toString());
                    if (e.target.checked) {
                      params.set('showZeroDays', 'true');
                    } else {
                      params.delete('showZeroDays');
                    }
                    router.push(`/${repoParams.owner}/${repoParams.repo}?${params.toString()}`);
                  }}
                />
                <span className="text-gray-600">Show zero days</span>
              </label>
            )}
            
            <label className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border">
              <span className="text-gray-600">Branch:</span>
              <input
                type="text"
                value={branch || ''}
                placeholder="main"
                onChange={(e) => {
                  if (!repoParams) return;
                  const params = new URLSearchParams(searchParams.toString());
                  if (e.target.value) {
                    params.set('branch', e.target.value);
                  } else {
                    params.delete('branch');
                  }
                  router.push(`/${repoParams.owner}/${repoParams.repo}?${params.toString()}`);
                }}
                className="border-0 focus:outline-none bg-transparent w-24"
              />
            </label>
            
            <label className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border">
              <input
                type="checkbox"
                checked={hideSecondary}
                onChange={(e) => {
                  if (!repoParams) return;
                  const params = new URLSearchParams(searchParams.toString());
                  if (e.target.checked) {
                    params.set('hideSecondary', 'true');
                  } else {
                    params.delete('hideSecondary');
                  }
                  router.push(`/${repoParams.owner}/${repoParams.repo}?${params.toString()}`);
                }}
              />
              <span className="text-gray-600">Hide secondary badges</span>
            </label>
          </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Main Stats Display */}
        <div className="space-y-8 mb-16">
          {renderBadges()}
        </div>

        {/* Documentation Section - More Subtle */}
        <div className="border-t-2 border-gray-200 pt-12 mt-16">
          <h2 className="text-xl font-semibold text-gray-700 mb-8">How to Use These Badges</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-600 mb-3">📝 Add to Your README</h3>
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-xs">
{`![Activity Calendar](${getDemoUrl('calendar')})
![Daily Activity](${getDemoUrl('daily')})
![Trend](${getDemoUrl('trend')})
![Summary](${getDemoUrl('summary')})`}
              </pre>
              <div className="mt-4 text-xs text-gray-500">
                <p className="font-semibold mb-1">Query Parameters:</p>
                <ul className="space-y-1">
                  <li>• <code className="bg-gray-100 px-1">branch</code>: Specify git branch</li>
                  <li>• <code className="bg-gray-100 px-1">month</code>: Calendar month (YYYY-MM)</li>
                  <li>• <code className="bg-gray-100 px-1">showZeroDays</code>: Include zero-activity days in charts</li>
                  <li>• <code className="bg-gray-100 px-1">primary</code>: Choose main badge (calendar/daily/trend/summary)</li>
                  <li>• <code className="bg-gray-100 px-1">hideSecondary</code>: Show only primary badge</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-600 mb-3">✨ About These Badges</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Hand-drawn style using Rough.js</li>
                <li>• Real-time stats from .specstory/history</li>
                <li>• Updates hourly with 1-hour cache</li>
                <li>• Works with any GitHub repository</li>
                <li>• Embeddable SVG format</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Powered by{' '}
              <a href="https://specstory.com" className="text-indigo-600 hover:underline">
                SpecStory
              </a>
              {' '}• Track AI-assisted development with hand-drawn badges
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}