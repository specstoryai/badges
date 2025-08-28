'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_REPO = 'specstoryai/badges';

export default function Home() {
  const [repoInput, setRepoInput] = useState(DEFAULT_REPO);
  const [repo, setRepo] = useState(DEFAULT_REPO);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Redirect to the default repo page
    router.replace(`/${DEFAULT_REPO}`);
  }, [router]);

  const getDemoUrl = (type: string) => {
    if (!mounted || typeof window === 'undefined') return '';
    return `${window.location.origin}/api/badge/${repo}/${type}.svg`;
  };

  const updateBadges = () => {
    const [owner, name] = repoInput.split('/');
    if (owner && name) {
      router.push(`/${owner}/${name}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      updateBadges();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center">
      <div className="text-gray-600">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <div>Redirecting to default repository...</div>
        </div>
      </div>
    </div>
  );
}
