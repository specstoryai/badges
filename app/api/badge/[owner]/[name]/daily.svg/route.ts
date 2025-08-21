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

    const dailyData = data.data.promptsPerDay.dailyDetails;
    const maxValue = Math.max(...dailyData.map((d: any) => d.promptCount));
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
      const height = (day.promptCount / maxValue) * chartHeight;
      const x = 70 + (i * barWidth);
      const y = 250 - height;

      svg.appendChild(rc.rectangle(x, y, barWidth - 10, height, {
        fill: 'rgba(99, 102, 241, 0.6)',
        fillStyle: 'hachure',
        strokeWidth: 1.5,
        stroke: '#6366f1',
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
    title.setAttribute('x', '60');
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