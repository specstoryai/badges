import rough from 'roughjs/bundled/rough.cjs';
import { JSDOM } from 'jsdom';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { owner: string; name: string } }
) {
  try {
    const res = await fetch(
      `https://stats.specstory.com/analyze?repo=${params.owner}/${params.name}`
    );
    
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

    const dailyData = data.data.promptsPerDay.dailyDetails;
    const maxValue = Math.max(...dailyData.map((d: any) => d.promptCount));
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
      svg.appendChild(rc.circle(point[0], point[1], 8, {
        fill: '#10b981',
        fillStyle: 'solid',
        stroke: '#10b981',
        strokeWidth: 2,
        roughness: 1.5
      }) as any);

      const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      valueText.setAttribute('x', String(point[0]));
      valueText.setAttribute('y', String(point[1] - 10));
      valueText.setAttribute('text-anchor', 'middle');
      valueText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      valueText.setAttribute('font-size', '9');
      valueText.setAttribute('fill', '#059669');
      valueText.setAttribute('font-weight', 'bold');
      valueText.textContent = String(dailyData[i].promptCount);
      svg.appendChild(valueText);
    });

    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', '300');
    title.setAttribute('y', '25');
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    title.setAttribute('font-size', '16');
    title.setAttribute('font-weight', 'bold');
    title.setAttribute('fill', '#18181b');
    title.textContent = `Prompt Trend - ${params.owner}/${params.name}`;
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
          Failed to load trend for ${params.owner}/${params.name}
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