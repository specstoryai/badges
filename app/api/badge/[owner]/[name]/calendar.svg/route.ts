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
  const month = searchParams.get('month'); // Format: YYYY-MM
  
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
    svg.setAttribute('width', '700');
    svg.setAttribute('height', '520');
    svg.setAttribute('viewBox', '0 0 700 520');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    svg.style.backgroundColor = '#fffef8';

    const rc = rough.svg(svg as any);

    // Process daily data into a map
    const dailyData = data.data.promptsPerDay.dailyDetails;
    const promptsByDate = new Map(dailyData.map((d: any) => [d.date, d.promptCount]));

    // Determine which month to show
    let targetMonth: Date;
    if (month) {
      targetMonth = new Date(month + '-01');
    } else if (dailyData.length > 0) {
      // Use the most recent month with data
      targetMonth = new Date(dailyData[dailyData.length - 1].date);
    } else {
      targetMonth = new Date();
    }

    const year = targetMonth.getFullYear();
    const monthNum = targetMonth.getMonth();
    const monthName = targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, monthNum, 1);
    const lastDay = new Date(year, monthNum + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    // Title
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    title.setAttribute('x', '350');
    title.setAttribute('y', '35');
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    title.setAttribute('font-size', '20');
    title.setAttribute('font-weight', 'bold');
    title.setAttribute('fill', '#18181b');
    title.textContent = `${monthName} - ${owner}/${name}`;
    svg.appendChild(title);

    // Day headers
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach((day, i) => {
      const dayHeader = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      dayHeader.setAttribute('x', String(80 + i * 85));
      dayHeader.setAttribute('y', '75');
      dayHeader.setAttribute('text-anchor', 'middle');
      dayHeader.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      dayHeader.setAttribute('font-size', '12');
      dayHeader.setAttribute('font-weight', 'bold');
      dayHeader.setAttribute('fill', '#525252');
      dayHeader.textContent = day;
      svg.appendChild(dayHeader);
    });

    // Calendar grid
    const cellWidth = 75;
    const cellHeight = 60;
    const startX = 40;
    const startY = 90;

    // Draw calendar cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = (startWeekday + day - 1) % 7;
      const week = Math.floor((startWeekday + day - 1) / 7);
      
      const x = startX + dayOfWeek * 85;
      const y = startY + week * 70;
      
      const dateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const promptCount = promptsByDate.get(dateStr) || 0;
      const hasActivity = promptCount > 0;

      // Draw cell background
      if (hasActivity) {
        // Green background for active days
        svg.appendChild(rc.rectangle(x, y, cellWidth, cellHeight, {
          fill: 'rgba(34, 197, 94, 0.2)',
          fillStyle: 'solid',
          stroke: '#22c55e',
          strokeWidth: 2,
          roughness: 1.5,
          bowing: 0.5
        }) as any);
      } else {
        // Light gray background for inactive days
        svg.appendChild(rc.rectangle(x, y, cellWidth, cellHeight, {
          fill: 'rgba(156, 163, 175, 0.1)',
          fillStyle: 'solid',
          stroke: '#e5e7eb',
          strokeWidth: 1,
          roughness: 1.5,
          bowing: 0.5
        }) as any);
      }

      // Day number
      const dayNum = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      dayNum.setAttribute('x', String(x + 10));
      dayNum.setAttribute('y', String(y + 20));
      dayNum.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      dayNum.setAttribute('font-size', '14');
      dayNum.setAttribute('font-weight', 'bold');
      dayNum.setAttribute('fill', hasActivity ? '#15803d' : '#9ca3af');
      dayNum.textContent = String(day);
      svg.appendChild(dayNum);

      if (hasActivity) {
        // Green checkmark for active days
        const checkPath = rc.path(`M ${x + 25} ${y + 35} L ${x + 35} ${y + 45} L ${x + 55} ${y + 25}`, {
          stroke: '#22c55e',
          strokeWidth: 3,
          roughness: 1.5
        });
        svg.appendChild(checkPath as any);

        // Prompt count
        const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        countText.setAttribute('x', String(x + cellWidth - 10));
        countText.setAttribute('y', String(y + cellHeight - 8));
        countText.setAttribute('text-anchor', 'end');
        countText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
        countText.setAttribute('font-size', '16');
        countText.setAttribute('font-weight', 'bold');
        countText.setAttribute('fill', '#15803d');
        countText.textContent = String(promptCount);
        svg.appendChild(countText);
      } else {
        // Red X for inactive days
        const xPath1 = rc.line(x + 30, y + 25, x + 50, y + 45, {
          stroke: '#ef4444',
          strokeWidth: 2,
          roughness: 1.5
        });
        svg.appendChild(xPath1 as any);
        
        const xPath2 = rc.line(x + 50, y + 25, x + 30, y + 45, {
          stroke: '#ef4444',
          strokeWidth: 2,
          roughness: 1.5
        });
        svg.appendChild(xPath2 as any);
      }
    }

    // Legend
    const legendY = startY + Math.ceil((startWeekday + daysInMonth) / 7) * 70 + 20;
    
    // Active day legend
    svg.appendChild(rc.rectangle(200, legendY, 20, 20, {
      fill: 'rgba(34, 197, 94, 0.2)',
      fillStyle: 'solid',
      stroke: '#22c55e',
      strokeWidth: 1.5,
      roughness: 1
    }) as any);
    
    const activeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    activeLabel.setAttribute('x', '230');
    activeLabel.setAttribute('y', String(legendY + 15));
    activeLabel.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    activeLabel.setAttribute('font-size', '12');
    activeLabel.setAttribute('fill', '#525252');
    activeLabel.textContent = 'Days with prompts';
    svg.appendChild(activeLabel);

    // Inactive day legend
    svg.appendChild(rc.rectangle(380, legendY, 20, 20, {
      fill: 'rgba(156, 163, 175, 0.1)',
      fillStyle: 'solid',
      stroke: '#e5e7eb',
      strokeWidth: 1,
      roughness: 1
    }) as any);
    
    const inactiveLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    inactiveLabel.setAttribute('x', '410');
    inactiveLabel.setAttribute('y', String(legendY + 15));
    inactiveLabel.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    inactiveLabel.setAttribute('font-size', '12');
    inactiveLabel.setAttribute('fill', '#525252');
    inactiveLabel.textContent = 'No activity';
    svg.appendChild(inactiveLabel);

    // Stats summary - count only for the displayed month
    let monthActiveDays = 0;
    let monthTotalPrompts = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const promptCount = promptsByDate.get(dateStr) || 0;
      if (promptCount > 0) {
        monthActiveDays++;
        monthTotalPrompts += promptCount;
      }
    }
    
    const statsText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    statsText.setAttribute('x', '350');
    statsText.setAttribute('y', String(legendY + 45));
    statsText.setAttribute('text-anchor', 'middle');
    statsText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    statsText.setAttribute('font-size', '13');
    statsText.setAttribute('fill', '#6366f1');
    statsText.setAttribute('font-weight', 'bold');
    statsText.textContent = `${monthActiveDays} active days • ${monthTotalPrompts} total prompts`;
    svg.appendChild(statsText);

    return new Response(svg.outerHTML, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    const errorSvg = `
      <svg width="700" height="520" xmlns="http://www.w3.org/2000/svg">
        <rect width="700" height="520" fill="#fffef8"/>
        <text x="350" y="260" text-anchor="middle" font-family="system-ui" font-size="14" fill="#dc2626">
          Failed to load calendar for ${owner}/${name}
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