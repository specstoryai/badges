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
    svg.setAttribute('height', '200');
    svg.setAttribute('viewBox', '0 0 600 200');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    svg.style.backgroundColor = '#fefef8';

    const rc = rough.svg(svg as any);

    svg.appendChild(rc.line(50, 160, 550, 160, {
      roughness: 1.5,
      strokeWidth: 2,
      stroke: '#525252',
      bowing: 0.5
    }) as any);
    
    svg.appendChild(rc.line(50, 40, 50, 160, {
      roughness: 1.5,
      strokeWidth: 2,
      stroke: '#525252',
      bowing: 0.5
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
    const chartWidth = 500;
    const chartHeight = 120;
    const stepX = chartWidth / (dailyData.length - 1 || 1);

    const points: [number, number][] = dailyData.map((day: any, i: number) => {
      const x = 50 + (i * stepX);
      const y = 160 - ((day.promptCount / maxValue) * chartHeight);
      return [x, y];
    });

    let pathData = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      const prevX = points[i - 1][0];
      const prevY = points[i - 1][1];
      const currX = points[i][0];
      const currY = points[i][1];
      const cp1x = prevX + (currX - prevX) * 0.5;
      const cp1y = prevY;
      const cp2x = prevX + (currX - prevX) * 0.5;
      const cp2y = currY;
      pathData += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${currX},${currY}`;
    }

    svg.appendChild(rc.path(pathData, {
      stroke: '#10b981',
      strokeWidth: 3,
      roughness: 1.2,
      bowing: 1
    }) as any);

    points.forEach((point, i) => {
      const isZero = dailyData[i].promptCount === 0;
      
      svg.appendChild(rc.circle(point[0], point[1], isZero ? 6 : 8, {
        fill: isZero ? '#9ca3af' : '#10b981',
        fillStyle: 'solid',
        stroke: isZero ? '#9ca3af' : '#10b981',
        strokeWidth: isZero ? 1 : 2,
        roughness: 1.5
      }) as any);

      // Only show value labels for non-zero points or if there are few points
      if (!isZero || dailyData.length <= 7) {
        const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valueText.setAttribute('x', String(point[0]));
        valueText.setAttribute('y', String(point[1] - 10));
        valueText.setAttribute('text-anchor', 'middle');
        valueText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        valueText.setAttribute('font-size', '9');
        valueText.setAttribute('fill', isZero ? '#9ca3af' : '#059669');
        valueText.setAttribute('font-weight', 'bold');
        valueText.textContent = String(dailyData[i].promptCount);
        svg.appendChild(valueText);
      }
    });

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', '300');
    title.setAttribute('y', '25');
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    title.setAttribute('font-size', '16');
    title.setAttribute('font-weight', 'bold');
    title.setAttribute('fill', '#18181b');
    title.textContent = `Prompt Trend - ${owner}/${name}`;
    svg.appendChild(title);

    const trendArrow = data.data.promptsPerDay.dailyDetails.length > 1 && 
      dailyData[dailyData.length - 1].promptCount > dailyData[0].promptCount ? '↗' : '↘';
    const trendColor = trendArrow === '↗' ? '#10b981' : '#ef4444';
    
    const trendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    trendText.setAttribute('x', '550');
    trendText.setAttribute('y', '25');
    trendText.setAttribute('text-anchor', 'end');
    trendText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    trendText.setAttribute('font-size', '20');
    trendText.setAttribute('fill', trendColor);
    trendText.textContent = trendArrow;
    svg.appendChild(trendText);

    return new Response(svg.outerHTML, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    const errorSvg = `
      <svg width="600" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="600" height="200" fill="#fefef8"/>
        <text x="300" y="100" text-anchor="middle" font-family="system-ui" font-size="14" fill="#dc2626">
          Failed to load trend for ${owner}/${name}
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