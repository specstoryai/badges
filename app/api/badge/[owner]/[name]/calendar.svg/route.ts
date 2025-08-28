import rough from 'roughjs/bundled/rough.cjs';
import { JSDOM } from 'jsdom';
import { NextResponse } from 'next/server';
import { getStatsApiUrl } from '@/lib/config';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  const { owner, name } = await params;
  const { searchParams } = new URL(request.url);
  const branch = searchParams.get('branch');
  const month = searchParams.get('month'); // Format: YYYY-MM
  
  try {
    const url = `${getStatsApiUrl()}/analyze?repo=${owner}/${name}${branch ? `&branch=${branch}` : ''}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }
    
    const data = await res.json();
    
    if (!data.success || !data.data?.dailyStats?.dailyDetails) {
      throw new Error('Invalid data structure');
    }

    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.document = dom.window.document as any;

    // Process daily data into maps
    const dailyData = data.data.dailyStats.dailyDetails;
    const promptsByDate = new Map<string, number>();
    const commitsByDate = new Map<string, number>();
    
    dailyData.forEach((d: any) => {
      promptsByDate.set(d.date, d.promptCount || 0);
      commitsByDate.set(d.date, d.commitCount || 0);
    });

    // Determine which month to show
    let targetMonth: Date;
    if (month) {
      // Parse month correctly - split YYYY-MM and create date with UTC to avoid timezone issues
      const [yearStr, monthStr] = month.split('-');
      targetMonth = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
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
    
    // Calculate number of weeks needed
    const weeksNeeded = Math.ceil((startWeekday + daysInMonth) / 7);
    
    // Calculate SVG height based on number of weeks
    const baseHeight = 90; // Top area for title and day headers
    const weekHeight = 70;
    const legendHeight = 60;
    const svgHeight = baseHeight + (weeksNeeded * weekHeight) + legendHeight;
    
    // Create SVG with dynamic height
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '700');
    svg.setAttribute('height', String(svgHeight));
    svg.setAttribute('viewBox', `0 0 700 ${svgHeight}`);
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    svg.style.backgroundColor = '#fffef8';

    const rc = rough.svg(svg as any);

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

    // We'll add the logo at the bottom right later

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
      const commitCount = commitsByDate.get(dateStr) || 0;
      const hasActivity = promptCount > 0 || commitCount > 0;

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

      // Day number - make it subtle
      const dayNum = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      dayNum.setAttribute('x', String(x + 10));
      dayNum.setAttribute('y', String(y + 20));
      dayNum.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      dayNum.setAttribute('font-size', '12');
      dayNum.setAttribute('font-weight', 'normal');
      dayNum.setAttribute('fill', '#d2d6db');
      dayNum.setAttribute('opacity', '0.8');
      dayNum.textContent = String(day);
      svg.appendChild(dayNum);

      if (hasActivity) {
        // Position checkmark with longer right upward stroke
        const checkPath = rc.path(`M ${x + 15} ${y + 25} L ${x + 25} ${y + 35} L ${x + 45} ${y + 15}`, {
          stroke: '#22c55e',
          strokeWidth: 3,
          roughness: 1.5
        });
        svg.appendChild(checkPath as any);

        // Prompt count - top right
        if (promptCount > 0) {
          const promptText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          promptText.setAttribute('x', String(x + cellWidth - 5));
          promptText.setAttribute('y', String(y + 35));
          promptText.setAttribute('text-anchor', 'end');
          promptText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
          promptText.setAttribute('font-size', '16');
          promptText.setAttribute('font-weight', 'bold');
          promptText.setAttribute('fill', '#0097a7');
          promptText.textContent = String(promptCount);
          svg.appendChild(promptText);
        }

        // Commit count - bottom right
        if (commitCount > 0) {
          const commitText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          commitText.setAttribute('x', String(x + cellWidth - 5));
          commitText.setAttribute('y', String(y + cellHeight - 5));
          commitText.setAttribute('text-anchor', 'end');
          commitText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
          commitText.setAttribute('font-size', '14');
          commitText.setAttribute('font-weight', 'bold');
          commitText.setAttribute('fill', '#f57c00');
          commitText.textContent = String(commitCount);
          svg.appendChild(commitText);
        }
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

    // Legend - positioned on the left
    const legendY = startY + (weeksNeeded * 70) + 20;
    
    // Active day legend
    svg.appendChild(rc.rectangle(40, legendY, 20, 20, {
      fill: 'rgba(34, 197, 94, 0.2)',
      fillStyle: 'solid',
      stroke: '#22c55e',
      strokeWidth: 1.5,
      roughness: 1
    }) as any);
    
    const activeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    activeLabel.setAttribute('x', '70');
    activeLabel.setAttribute('y', String(legendY + 15));
    activeLabel.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    activeLabel.setAttribute('font-size', '12');
    activeLabel.setAttribute('fill', '#525252');
    activeLabel.textContent = 'Days with activity';
    svg.appendChild(activeLabel);

    // Inactive day legend
    svg.appendChild(rc.rectangle(200, legendY, 20, 20, {
      fill: 'rgba(156, 163, 175, 0.1)',
      fillStyle: 'solid',
      stroke: '#e5e7eb',
      strokeWidth: 1,
      roughness: 1
    }) as any);
    
    const inactiveLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    inactiveLabel.setAttribute('x', '230');
    inactiveLabel.setAttribute('y', String(legendY + 15));
    inactiveLabel.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    inactiveLabel.setAttribute('font-size', '12');
    inactiveLabel.setAttribute('fill', '#525252');
    inactiveLabel.textContent = 'No activity';
    svg.appendChild(inactiveLabel);
    
    // Color key for numbers - positioned side by side
    const promptKeyText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    promptKeyText.setAttribute('x', '350');
    promptKeyText.setAttribute('y', String(legendY + 15));
    promptKeyText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    promptKeyText.setAttribute('font-size', '11');
    promptKeyText.setAttribute('fill', '#0097a7');
    promptKeyText.setAttribute('font-weight', 'bold');
    promptKeyText.setAttribute('dominant-baseline', 'middle');
    promptKeyText.textContent = '# Prompts';
    svg.appendChild(promptKeyText);
    
    const commitKeyText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    commitKeyText.setAttribute('x', '420');
    commitKeyText.setAttribute('y', String(legendY + 15));
    commitKeyText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    commitKeyText.setAttribute('font-size', '11');
    commitKeyText.setAttribute('fill', '#f57c00');
    commitKeyText.setAttribute('font-weight', 'bold');
    commitKeyText.setAttribute('dominant-baseline', 'middle');
    commitKeyText.textContent = '# Commits';
    svg.appendChild(commitKeyText);

    // Add SpecStory logo and text in bottom right on same line
    const logoGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    logoGroup.setAttribute('transform', `translate(540, ${legendY + 3}) scale(0.04)`);
    
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
    byText.setAttribute('x', '565');
    byText.setAttribute('y', String(legendY + 15));  // Aligned with legend text
    byText.setAttribute('text-anchor', 'start');
    byText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    byText.setAttribute('font-size', '11');
    byText.setAttribute('fill', '#6b7280');
    byText.setAttribute('dominant-baseline', 'middle');  // Center text vertically
    byText.textContent = 'by SpecStory.com';
    svg.appendChild(byText);

    return new Response(svg.outerHTML, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    const errorSvg = `
      <svg width="700" height="460" xmlns="http://www.w3.org/2000/svg">
        <rect width="700" height="460" fill="#fffef8"/>
        <text x="350" y="230" text-anchor="middle" font-family="system-ui" font-size="14" fill="#dc2626">
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