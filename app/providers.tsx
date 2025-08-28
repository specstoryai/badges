'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

if (typeof window !== 'undefined') {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST
  
  if (posthogKey && posthogHost) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true
    })
  }
}

export function PHProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    posthog.capture('$pageview')
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}