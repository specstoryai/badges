import rough from 'roughjs/bundled/rough.cjs';
import { JSDOM } from 'jsdom';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  const { owner, name } = await params;
  const { searchParams } = new URL(request.url);
  const branch = searchParams.get('branch');
  const showZeroDays = searchParams.get('showZeroDays') === 'true';
  
  try {
    const url = `https://stats.specstory.com/analyze?repo=${owner}/${name}${branch ? `&branch=${branch}` : ''}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }
    
    const data = await res.json();
    
    if (!data.success || !data.data?.promptsPerDay?.dailyDetails) {
      throw new Error('Invalid data structure');
    }

    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.document = dom.window.document as any;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '600');
    svg.setAttribute('height', '300');
    svg.setAttribute('viewBox', '0 0 600 300');
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

    const rawDailyData = data.data.promptsPerDay.dailyDetails;
    
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
            fileCount: 0
          });
        }
      }
      
      return result;
    };
    
    const dailyData = showZeroDays ? fillMissingDays(rawDailyData) : rawDailyData;
    const maxValue = Math.max(...dailyData.map((d: any) => d.promptCount)) || 1;
    const chartWidth = 480;
    const chartHeight = 180;
    const barWidth = chartWidth / dailyData.length;

    // Determine which dates to show based on number of bars
    const showDateLabels = (index: number, total: number): boolean => {
      if (total <= 7) return true; // Show all if 7 or fewer
      if (total <= 14) return index % 2 === 0; // Show every other if 14 or fewer
      if (total <= 21) return index % 3 === 0; // Show every 3rd if 21 or fewer
      if (total <= 30) return index % 4 === 0; // Show every 4th if 30 or fewer
      // For more than 30, show first, last, and every 5th
      return index === 0 || index === total - 1 || index % 5 === 0;
    };

    dailyData.forEach((day: any, i: number) => {
      const height = Math.max((day.promptCount / maxValue) * chartHeight, 2); // Min height of 2 for visibility
      const x = 70 + (i * barWidth);
      const y = 250 - height;

      // Use different styling for zero/minimal values
      const fillColor = day.promptCount === 0 ? 'rgba(156, 163, 175, 0.3)' : 'rgba(99, 102, 241, 0.6)';
      const strokeColor = day.promptCount === 0 ? '#9ca3af' : '#6366f1';
      
      svg.appendChild(rc.rectangle(x, y, barWidth - 10, height, {
        fill: fillColor,
        fillStyle: day.promptCount === 0 ? 'solid' : 'hachure',
        strokeWidth: 1.5,
        stroke: strokeColor,
        roughness: 1.5,
        hachureGap: 4,
        hachureAngle: 60
      }) as any);

      // Only show selected date labels to avoid crowding
      if (showDateLabels(i, dailyData.length)) {
        const dateText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        dateText.setAttribute('x', String(x + (barWidth - 10) / 2));
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
    title.textContent = `Daily Prompts - ${owner}/${name}`;
    svg.appendChild(title);

    const avgText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    avgText.setAttribute('x', '540');
    avgText.setAttribute('y', '30');
    avgText.setAttribute('text-anchor', 'end');
    avgText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    avgText.setAttribute('font-size', '13');
    avgText.setAttribute('fill', '#6366f1');
    avgText.setAttribute('font-weight', 'bold');
    avgText.textContent = `${data.data.promptsPerDay.averagePerDay.toFixed(1)}/day`;
    svg.appendChild(avgText);

    // Add SpecStory logo to top-left corner
    const logoGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    logoGroup.setAttribute('transform', 'translate(10, 10) scale(0.05)');
    
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

    for (let i = 0; i <= 4; i++) {
      const yValue = Math.round((maxValue / 4) * i);
      const yPos = 250 - (i * 45);
      
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', '50');
      label.setAttribute('y', String(yPos + 4));
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      label.setAttribute('font-size', '10');
      label.setAttribute('fill', '#525252');
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