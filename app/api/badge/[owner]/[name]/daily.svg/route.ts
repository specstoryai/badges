import rough from 'roughjs/bundled/rough.cjs';
import { JSDOM } from 'jsdom';
import { getStatsApiUrl } from '@/lib/config';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  const { owner, name } = await params;
  const { searchParams } = new URL(request.url);
  const branch = searchParams.get('branch');
  const showZeroDays = searchParams.get('showZeroDays') === 'true';
  
  console.log('[daily.svg] Request for:', { owner, name, showZeroDays, branch });
  
  try {
    const url = `${getStatsApiUrl()}/analyze?repo=${owner}/${name}${branch ? `&branch=${branch}` : ''}`;
    console.log('[daily.svg] Fetching from:', url);
    
    const res = await fetch(url);
    console.log('[daily.svg] Response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[daily.svg] API error response:', errorText);
      throw new Error(`API returned ${res.status}: ${errorText}`);
    }
    
    const data = await res.json();
    console.log('[daily.svg] API response structure:', {
      success: data.success,
      hasData: !!data.data,
      hasDailyStats: !!data.data?.dailyStats,
      hasDailyDetails: !!data.data?.dailyStats?.dailyDetails,
      dailyDetailsCount: data.data?.dailyStats?.dailyDetails?.length || 0,
      // Also log if old structure exists
      hasOldPromptsPerDay: !!data.data?.promptsPerDay
    });
    
    if (!data.success) {
      console.error('[daily.svg] API returned success: false', data.error);
      throw new Error(`API error: ${data.error || 'Unknown error'}`);
    }
    
    if (!data.data?.dailyStats?.dailyDetails) {
      console.error('[daily.svg] Invalid data structure. Full response:', JSON.stringify(data, null, 2));
      throw new Error('Invalid data structure - missing dailyStats.dailyDetails');
    }

    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.document = dom.window.document as any;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '600');
    svg.setAttribute('height', '320');
    svg.setAttribute('viewBox', '0 0 600 320');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    svg.style.backgroundColor = '#fafaf9';

    const rc = rough.svg(svg as any);

    svg.appendChild(rc.line(60, 250, 540, 250, {
      roughness: 1.2,
      strokeWidth: 2,
      stroke: '#525252'
    }) as any);
    
    svg.appendChild(rc.line(60, 50, 60, 250, {
      roughness: 1.2,
      strokeWidth: 2,
      stroke: '#525252'
    }) as any);

    const rawDailyData = data.data.dailyStats.dailyDetails;
    console.log('[daily.svg] Processing daily data:', {
      rawDataCount: rawDailyData.length,
      firstDay: rawDailyData[0],
      lastDay: rawDailyData[rawDailyData.length - 1]
    });
    
    // Fill in missing days with 0 prompts only if showZeroDays is true
    const fillMissingDays = (data: any[]) => {
      if (data.length === 0) return data;
      
      const result = [];
      const startDate = new Date(data[0].date);
      const endDate = new Date(data[data.length - 1].date);
      
      const dateMap = new Map(data.map(d => [d.date, d]));
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (dateMap.has(dateStr)) {
          result.push(dateMap.get(dateStr));
        } else {
          result.push({
            date: dateStr,
            promptCount: 0,
            sessionCount: 0,
            commitCount: 0
          });
        }
      }
      
      return result;
    };
    
    const dailyData = showZeroDays ? fillMissingDays(rawDailyData) : rawDailyData;
    const maxPrompts = Math.max(...dailyData.map((d: any) => d.promptCount || 0)) || 1;
    const maxCommits = Math.max(...dailyData.map((d: any) => d.commitCount || 0)) || 1;
    const chartWidth = 480;
    const chartHeight = 180;
    const chartX = 70;
    const chartY = 70;
    const barGroupWidth = chartWidth / dailyData.length;
    const barWidth = barGroupWidth * 0.35; // Each bar takes 35% of group width
    const promptScale = chartHeight / maxPrompts;
    const commitScale = chartHeight / maxCommits;

    // Determine which dates to show based on number of bars
    const showDateLabels = (index: number, total: number): boolean => {
      if (total <= 7) return true; // Show all if 7 or fewer
      if (total <= 14) return index % 2 === 0; // Show every other if 14 or fewer
      if (total <= 30) return index % 7 === 0 || index === total - 1; // Weekly for up to a month
      if (total <= 90) {
        // For 1-3 months, show first, last, and roughly monthly intervals
        return index === 0 || index === total - 1 || index % 30 === 15;
      }
      // For 3+ months (up to ~400 days), show first, last, and a few key points
      const interval = Math.floor(total / 5); // Show about 5-6 labels total
      return index === 0 || index === total - 1 || (index % interval === Math.floor(interval / 2));
    };

    // Draw bars
    dailyData.forEach((day: any, i: number) => {
      const promptHeight = Math.max((day.promptCount || 0) * promptScale, day.promptCount > 0 ? 2 : 0);
      const commitHeight = Math.max((day.commitCount || 0) * commitScale, day.commitCount > 0 ? 2 : 0);
      const groupX = chartX + i * barGroupWidth;
      
      // Draw prompt bar (left, teal)
      if (day.promptCount > 0 || showZeroDays) {
        const promptX = groupX + barGroupWidth * 0.1;
        const promptY = chartY + chartHeight - promptHeight;
        
        svg.appendChild(rc.rectangle(promptX, promptY, barWidth, promptHeight || 2, {
          fill: day.promptCount === 0 ? 'rgba(156, 163, 175, 0.2)' : 'rgba(0, 151, 167, 0.6)',
          fillStyle: day.promptCount === 0 ? 'solid' : 'hachure',
          strokeWidth: 1.5,
          stroke: day.promptCount === 0 ? '#d1d5db' : '#0097a7',
          roughness: 1.5,
          hachureGap: 4,
          hachureAngle: 60
        }) as any);
        
        // Add prompt count label for non-zero values
        if (day.promptCount > 0 && dailyData.length <= 20) {
          const promptLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          promptLabel.setAttribute('x', String(promptX + barWidth/2));
          promptLabel.setAttribute('y', String(promptY - 3));
          promptLabel.setAttribute('text-anchor', 'middle');
          promptLabel.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
          promptLabel.setAttribute('font-size', '9');
          promptLabel.setAttribute('fill', '#0097a7');
          promptLabel.textContent = String(day.promptCount);
          svg.appendChild(promptLabel);
        }
      }
      
      // Draw commit bar (right, orange)
      if (day.commitCount > 0 || showZeroDays) {
        const commitX = groupX + barGroupWidth * 0.55;
        const commitY = chartY + chartHeight - commitHeight;
        
        svg.appendChild(rc.rectangle(commitX, commitY, barWidth, commitHeight || 2, {
          fill: day.commitCount === 0 ? 'rgba(156, 163, 175, 0.2)' : 'rgba(245, 124, 0, 0.6)',
          fillStyle: day.commitCount === 0 ? 'solid' : 'hachure',
          strokeWidth: 1.5,
          stroke: day.commitCount === 0 ? '#d1d5db' : '#f57c00',
          roughness: 1.5,
          hachureGap: 4,
          hachureAngle: -60
        }) as any);
        
        // Add commit count label for non-zero values
        if (day.commitCount > 0 && dailyData.length <= 20) {
          const commitLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          commitLabel.setAttribute('x', String(commitX + barWidth/2));
          commitLabel.setAttribute('y', String(commitY - 3));
          commitLabel.setAttribute('text-anchor', 'middle');
          commitLabel.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
          commitLabel.setAttribute('font-size', '9');
          commitLabel.setAttribute('fill', '#f57c00');
          commitLabel.textContent = String(day.commitCount);
          svg.appendChild(commitLabel);
        }
      }

      // Only show selected date labels to avoid crowding
      if (showDateLabels(i, dailyData.length)) {
        const dateText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        dateText.setAttribute('x', String(groupX + barGroupWidth / 2));
        dateText.setAttribute('y', '270');
        dateText.setAttribute('text-anchor', 'middle');
        dateText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        dateText.setAttribute('font-size', '10');
        dateText.setAttribute('fill', '#525252');
        dateText.textContent = day.date.slice(5);
        svg.appendChild(dateText);
      }
    });

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', '45');
    title.setAttribute('y', '30');
    title.setAttribute('text-anchor', 'start');
    title.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    title.setAttribute('font-size', '18');
    title.setAttribute('font-weight', 'bold');
    title.setAttribute('fill', '#18181b');
    title.textContent = `Daily Activity - ${owner}/${name}`;
    svg.appendChild(title);

    // Legend for bar types - bottom left, side by side
    const legendY = 290;
    
    // Prompts legend
    const promptRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    promptRect.setAttribute('x', '75');
    promptRect.setAttribute('y', String(legendY - 4));
    promptRect.setAttribute('width', '12');
    promptRect.setAttribute('height', '8');
    promptRect.setAttribute('fill', '#0097a7');
    svg.appendChild(promptRect);
    
    const promptText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    promptText.setAttribute('x', '90');
    promptText.setAttribute('y', String(legendY + 2));
    promptText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    promptText.setAttribute('font-size', '11');
    promptText.setAttribute('fill', '#0097a7');
    promptText.setAttribute('dominant-baseline', 'middle');
    promptText.textContent = `# Prompts (${data.data.dailyStats.promptsAverage.toFixed(1)}/day)`;
    svg.appendChild(promptText);
    
    // Commits legend - positioned after prompts legend
    const commitRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    commitRect.setAttribute('x', '210');
    commitRect.setAttribute('y', String(legendY - 4));
    commitRect.setAttribute('width', '12');
    commitRect.setAttribute('height', '8');
    commitRect.setAttribute('fill', '#f57c00');
    svg.appendChild(commitRect);
    
    const commitText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    commitText.setAttribute('x', '225');
    commitText.setAttribute('y', String(legendY + 2));
    commitText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    commitText.setAttribute('font-size', '11');
    commitText.setAttribute('fill', '#f57c00');
    commitText.setAttribute('dominant-baseline', 'middle');
    const commitAvg = dailyData.reduce((sum: number, d: any) => sum + (d.commitCount || 0), 0) / dailyData.length;
    commitText.textContent = `# Commits (${commitAvg.toFixed(1)}/day)`;
    svg.appendChild(commitText);

    // Add SpecStory logo and text in bottom right on same line
    const logoGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    logoGroup.setAttribute('transform', 'translate(420, 280) scale(0.04)');
    
    const logoPaths = [
      { fill: '#52B7D6', d: 'm115.443 549.557.068-397.944L380 80.57l-.069 397.944' },
      { fill: '#EB7139', d: 'M86.582 151.263v397.082c-8.943.006-62.986 2.104-86.582-61.529V85.38c17.228 63.791 86.582 65.883 86.582 65.883Z' },
      { fill: '#F6C768', d: 'M311.618 1.88V37.9L40.615 110.515c-8.409-7.978-15.35-18.062-20.643-30.504L311.619 1.88Z' },
      { fill: '#fff', d: 'M96.804 129.873s-36.678-1.202-56.52-19.841L311.457 37.88l36.677 26.455-251.33 65.538Z' }
    ];
    
    logoPaths.forEach(pathData => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', pathData.fill);
      path.setAttribute('d', pathData.d);
      logoGroup.appendChild(path);
    });
    
    svg.appendChild(logoGroup);
    
    // "by SpecStory.com" text - positioned to the right of the logo and vertically centered
    const byText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    byText.setAttribute('x', '445');
    byText.setAttribute('y', '292');
    byText.setAttribute('text-anchor', 'start');
    byText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    byText.setAttribute('font-size', '11');
    byText.setAttribute('fill', '#6b7280');
    byText.setAttribute('dominant-baseline', 'middle');
    byText.textContent = 'by SpecStory.com';
    svg.appendChild(byText);

    // Left Y-axis labels (prompts)
    for (let i = 0; i <= 4; i++) {
      const yValue = Math.round((maxPrompts / 4) * i);
      const yPos = chartY + chartHeight - (i * chartHeight / 4);
      
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', '50');
      label.setAttribute('y', String(yPos + 4));
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      label.setAttribute('font-size', '10');
      label.setAttribute('fill', '#0097a7');
      label.textContent = String(yValue);
      svg.appendChild(label);
    }
    
    // Right Y-axis labels (commits)
    svg.appendChild(rc.line(550, 70, 550, 250, {
      roughness: 1.2,
      strokeWidth: 2,
      stroke: '#525252'
    }) as any);
    
    for (let i = 0; i <= 4; i++) {
      const yValue = Math.round((maxCommits / 4) * i);
      const yPos = chartY + chartHeight - (i * chartHeight / 4);
      
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', '560');
      label.setAttribute('y', String(yPos + 4));
      label.setAttribute('text-anchor', 'start');
      label.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      label.setAttribute('font-size', '10');
      label.setAttribute('fill', '#f57c00');
      label.textContent = String(yValue);
      svg.appendChild(label);
    }

    return new Response(svg.outerHTML, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    const errorSvg = `
      <svg width="600" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="600" height="300" fill="#fafaf9"/>
        <text x="300" y="150" text-anchor="middle" font-family="system-ui" font-size="14" fill="#dc2626">
          Failed to load data for ${owner}/${name}
        </text>
      </svg>
    `;
    return new Response(errorSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }
}