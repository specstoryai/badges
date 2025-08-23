'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [repoInput, setRepoInput] = useState('specstoryai/tnyOffice');
  const [repo, setRepo] = useState('specstoryai/tnyOffice');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getDemoUrl = (type: string) => {
    if (!mounted || typeof window === 'undefined') return '';
    return `${window.location.origin}/api/badge/${repo}/${type}.svg`;
  };

  const updateBadges = () => {
    setRepo(repoInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      updateBadges();
    }
  };

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
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Main Stats Display */}
        <div className="space-y-8 mb-16">
          {/* Calendar at the top - full width */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📅 Monthly Activity</h2>
            <div className="bg-white rounded-xl shadow-xl p-8">
              {mounted && (
                <img
                  src={getDemoUrl('calendar')}
                  alt="Activity Calendar"
                  className="w-full"
                  key={`calendar-${repo}`}
                />
              )}
            </div>
          </div>

          {/* Charts Grid */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Activity Trends</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-xl p-6">
                <h3 className="text-lg font-semibold mb-3">Daily Prompts</h3>
                {mounted && (
                  <img
                    src={getDemoUrl('daily')}
                    alt="Daily Activity"
                    className="w-full"
                    key={`daily-${repo}`}
                  />
                )}
              </div>

              <div className="bg-white rounded-xl shadow-xl p-6">
                <h3 className="text-lg font-semibold mb-3">Trend Analysis</h3>
                {mounted && (
                  <img
                    src={getDemoUrl('trend')}
                    alt="Trend"
                    className="w-full"
                    key={`trend-${repo}`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Summary Badge */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📈 Quick Summary</h2>
            <div className="bg-white rounded-xl shadow-xl p-6">
              {mounted && (
                <img
                  src={getDemoUrl('summary')}
                  alt="Summary"
                  className="max-w-md mx-auto"
                  key={`summary-${repo}`}
                />
              )}
            </div>
          </div>

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
