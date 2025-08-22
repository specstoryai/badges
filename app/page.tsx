'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [repo, setRepo] = useState('specstoryai/tnyOffice');
  const [baseUrl, setBaseUrl] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getDemoUrl = (type: string) => {
    if (!mounted) return '';
    const base = baseUrl || window.location.origin;
    return `${base}/api/badge/${repo}/${type}.svg`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📊 Hand-Drawn GitHub Stats Badges
          </h1>
          <p className="text-gray-600">
            Beautiful, sketchy-style badges for your GitHub repository stats.
            Perfect for adding a personal touch to your README!
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-2 border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Try it with your repo:</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="owner/repository"
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
            />
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="Base URL (optional)"
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <p className="text-sm text-gray-500">
            Enter a GitHub repository that has a .specstory/history directory with markdown files
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
            <h3 className="text-lg font-semibold mb-3">📈 Daily Activity Chart</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              {mounted && (
                <img
                  src={getDemoUrl('daily')}
                  alt="Daily Activity"
                  className="w-full"
                  key={`daily-${repo}`}
                />
              )}
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                Show Markdown
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
{`![Daily Activity](${getDemoUrl('daily')})`}
              </pre>
            </details>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
            <h3 className="text-lg font-semibold mb-3">📊 Trend Line</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              {mounted && (
                <img
                  src={getDemoUrl('trend')}
                  alt="Trend"
                  className="w-full"
                  key={`trend-${repo}`}
                />
              )}
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                Show Markdown
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
{`![Trend](${getDemoUrl('trend')})`}
              </pre>
            </details>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
            <h3 className="text-lg font-semibold mb-3">📋 Summary Badge</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              {mounted && (
                <img
                  src={getDemoUrl('summary')}
                  alt="Summary"
                  className="w-full max-w-md"
                  key={`summary-${repo}`}
                />
              )}
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                Show Markdown
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
{`![Summary](${getDemoUrl('summary')})`}
              </pre>
            </details>
          </div>

          <div className="bg-amber-50 rounded-lg p-6 border-2 border-amber-200">
            <h3 className="text-lg font-semibold mb-3">🎨 Features</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">✏️</span>
                <span>Hand-drawn, sketchy style using Rough.js</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🎯</span>
                <span>Real-time data from your GitHub repository</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">⚡</span>
                <span>Cached for 1 hour for optimal performance</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📱</span>
                <span>Responsive SVG that looks great everywhere</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🌈</span>
                <span>Multiple styles: charts, trends, and summaries</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
            <h3 className="text-lg font-semibold mb-3">📝 Example README</h3>
            <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
{`# My Awesome Project

## 📊 Project Activity

<!-- Hand-drawn daily activity chart -->
![Daily Activity](${getDemoUrl('daily')})

<!-- Sketchy trend line -->
![Trend](${getDemoUrl('trend')})

<!-- Summary badge -->
![Summary](${getDemoUrl('summary')})

These beautiful badges show real-time stats from our development process!`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
