import rough from 'roughjs/bundled/rough.cjs';
import { JSDOM } from 'jsdom';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  const { owner, name } = await params;
  try {
    const res = await fetch(
      `https://stats.specstory.com/analyze?repo=${owner}/${name}`
    );
    
    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }
    
    const data = await res.json();
    
    if (!data.success || !data.data) {
      throw new Error('Invalid data structure');
    }

    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.document = dom.window.document as any;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '400');
    svg.setAttribute('height', '120');
    svg.setAttribute('viewBox', '0 0 400 120');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'bg-gradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('style', 'stop-color:#fef3c7;stop-opacity:1');
    gradient.appendChild(stop1);
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('style', 'stop-color:#fde68a;stop-opacity:1');
    gradient.appendChild(stop2);
    
    defs.appendChild(gradient);
    svg.appendChild(defs);

    const rc = rough.svg(svg as any);

    svg.appendChild(rc.rectangle(5, 5, 390, 110, {
      fill: 'url(#bg-gradient)',
      fillStyle: 'solid',
      stroke: '#92400e',
      strokeWidth: 2,
      roughness: 1.5,
      bowing: 2
    }) as any);

    const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleText.setAttribute('x', '200');
    titleText.setAttribute('y', '35');
    titleText.setAttribute('text-anchor', 'middle');
    titleText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    titleText.setAttribute('font-size', '16');
    titleText.setAttribute('font-weight', 'bold');
    titleText.setAttribute('fill', '#78350f');
    titleText.textContent = `${owner}/${name}`;
    svg.appendChild(titleText);

    const stats = data.data;
    const promptsPerDay = stats.promptsPerDay || {};
    
    const totalText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    totalText.setAttribute('x', '80');
    totalText.setAttribute('y', '65');
    totalText.setAttribute('text-anchor', 'middle');
    totalText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    totalText.setAttribute('font-size', '24');
    totalText.setAttribute('font-weight', 'bold');
    totalText.setAttribute('fill', '#dc2626');
    totalText.textContent = String(stats.promptCount);
    svg.appendChild(totalText);
    
    const totalLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    totalLabel.setAttribute('x', '80');
    totalLabel.setAttribute('y', '85');
    totalLabel.setAttribute('text-anchor', 'middle');
    totalLabel.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    totalLabel.setAttribute('font-size', '11');
    totalLabel.setAttribute('fill', '#78350f');
    totalLabel.textContent = 'Total Prompts';
    svg.appendChild(totalLabel);

    const avgText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    avgText.setAttribute('x', '200');
    avgText.setAttribute('y', '65');
    avgText.setAttribute('text-anchor', 'middle');
    avgText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    avgText.setAttribute('font-size', '24');
    avgText.setAttribute('font-weight', 'bold');
    avgText.setAttribute('fill', '#2563eb');
    avgText.textContent = promptsPerDay.averagePerDay ? 
      promptsPerDay.averagePerDay.toFixed(1) : '0';
    svg.appendChild(avgText);
    
    const avgLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    avgLabel.setAttribute('x', '200');
    avgLabel.setAttribute('y', '85');
    avgLabel.setAttribute('text-anchor', 'middle');
    avgLabel.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    avgLabel.setAttribute('font-size', '11');
    avgLabel.setAttribute('fill', '#78350f');
    avgLabel.textContent = 'Avg/Day';
    svg.appendChild(avgLabel);

    const filesText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    filesText.setAttribute('x', '320');
    filesText.setAttribute('y', '65');
    filesText.setAttribute('text-anchor', 'middle');
    filesText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    filesText.setAttribute('font-size', '24');
    filesText.setAttribute('font-weight', 'bold');
    filesText.setAttribute('fill', '#059669');
    filesText.textContent = String(stats.filesProcessed);
    svg.appendChild(filesText);
    
    const filesLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    filesLabel.setAttribute('x', '320');
    filesLabel.setAttribute('y', '85');
    filesLabel.setAttribute('text-anchor', 'middle');
    filesLabel.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    filesLabel.setAttribute('font-size', '11');
    filesLabel.setAttribute('fill', '#78350f');
    filesLabel.textContent = 'Files';
    svg.appendChild(filesLabel);

    svg.appendChild(rc.line(140, 50, 140, 90, {
      roughness: 1.5,
      strokeWidth: 1,
      stroke: '#92400e',
      strokeLineDash: [5, 5]
    }) as any);

    svg.appendChild(rc.line(260, 50, 260, 90, {
      roughness: 1.5,
      strokeWidth: 1,
      stroke: '#92400e',
      strokeLineDash: [5, 5]
    }) as any);

    const dateText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    dateText.setAttribute('x', '200');
    dateText.setAttribute('y', '105');
    dateText.setAttribute('text-anchor', 'middle');
    dateText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    dateText.setAttribute('font-size', '9');
    dateText.setAttribute('fill', '#92400e');
    dateText.setAttribute('opacity', '0.7');
    if (promptsPerDay.dateRange) {
      dateText.textContent = `${promptsPerDay.dateRange.start} to ${promptsPerDay.dateRange.end}`;
    } else {
      dateText.textContent = 'No date data available';
    }
    svg.appendChild(dateText);

    return new Response(svg.outerHTML, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    const errorSvg = `
      <svg width="400" height="120" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="120" fill="#fef3c7"/>
        <text x="200" y="60" text-anchor="middle" font-family="system-ui" font-size="14" fill="#dc2626">
          Failed to load summary
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