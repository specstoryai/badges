# 📊 Hand-Drawn GitHub Stats Badges

Beautiful, sketchy-style SVG badges for displaying GitHub repository statistics with a hand-drawn aesthetic. Perfect for adding personality to your project READMEs!

## ✨ Features

- 🎨 **Hand-drawn style** using Rough.js for authentic sketchy appearance
- 📈 **Three badge types**: Daily activity charts, trend lines, and summary badges
- 🔄 **Real-time data** from GitHub repositories via the SpecStory Stats API
- ⚡ **Smart caching** with 1-hour TTL for optimal performance
- 🌿 **Branch support** for analyzing different branches
- 📱 **Responsive SVGs** that scale perfectly anywhere
- 🎯 **Intelligent labeling** that adapts to data density

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A GitHub repository with `.specstory/history` directory containing markdown files

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/badges.git
cd badges

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo page.

## 📊 Badge Types

### 1. Daily Activity Chart
Shows daily prompt counts as a hand-drawn bar chart with intelligent date labeling.

```markdown
![Daily Activity](https://your-app.vercel.app/api/badge/owner/repo/daily.svg)
```

With branch:
```markdown
![Daily Activity](https://your-app.vercel.app/api/badge/owner/repo/daily.svg?branch=develop)
```

### 2. Trend Line
Displays activity trend with a sketchy line chart and data points.

```markdown
![Trend](https://your-app.vercel.app/api/badge/owner/repo/trend.svg)
```

### 3. Summary Badge
Compact badge showing total prompts, daily average, and file count.

```markdown
![Summary](https://your-app.vercel.app/api/badge/owner/repo/summary.svg)
```

## 🎨 Visual Features

- **Rough.js rendering** for authentic hand-drawn appearance
- **Hachure fill patterns** for bars and shapes
- **Adaptive date labels** that prevent overcrowding:
  - All dates shown for ≤7 days
  - Every 2nd date for ≤14 days
  - Every 3rd date for ≤21 days
  - Every 4th date for ≤30 days
  - First, last, and every 5th for >30 days
- **Warm color palette** with gradient backgrounds
- **Sketchy borders** with customizable roughness

## 🛠️ API Endpoints

### `GET /api/badge/[owner]/[name]/daily.svg`
Generates a daily activity bar chart.

**Query Parameters:**
- `branch` (optional): Specific branch to analyze

### `GET /api/badge/[owner]/[name]/trend.svg`
Generates a trend line chart.

**Query Parameters:**
- `branch` (optional): Specific branch to analyze

### `GET /api/badge/[owner]/[name]/summary.svg`
Generates a summary statistics badge.

**Query Parameters:**
- `branch` (optional): Specific branch to analyze

## 📝 Example Usage

Add these badges to your README:

```markdown
# My Project

## 📊 Development Activity

<!-- Daily activity with hand-drawn bars -->
![Daily Prompts](https://badges.yourdomain.com/api/badge/owner/repo/daily.svg)

<!-- Trend line showing progress -->
![Trend](https://badges.yourdomain.com/api/badge/owner/repo/trend.svg)

<!-- Quick stats summary -->
![Summary](https://badges.yourdomain.com/api/badge/owner/repo/summary.svg)

<!-- Specific branch -->
![Feature Branch](https://badges.yourdomain.com/api/badge/owner/repo/daily.svg?branch=feature-xyz)
```

## 🔧 Configuration

The badges use the [SpecStory Stats API](https://stats.specstory.com) to fetch repository data. The API analyzes `.specstory/history` directories in GitHub repositories.

### Environment Variables

No environment variables required! The app works out of the box.

### Customization

To modify the visual style, edit the Rough.js parameters in the route files:

```typescript
// Adjust these values in the badge route files
{
  roughness: 1.5,      // Higher = more sketchy
  strokeWidth: 2,      // Line thickness
  fillStyle: 'hachure', // Fill pattern style
  hachureGap: 4,       // Gap between hachure lines
  hachureAngle: 60,    // Angle of hachure lines
  bowing: 2            // Line bowing amount
}
```

## 🚀 Deployment

### Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/badges)

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🏗️ Tech Stack

- **Next.js 15** - React framework with App Router
- **Rough.js** - Hand-drawn graphics library
- **jsdom** - DOM implementation for SVG generation
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling for demo page

## 📦 Project Structure

```
badges/
├── app/
│   ├── api/
│   │   └── badge/
│   │       └── [owner]/
│   │           └── [name]/
│   │               ├── daily.svg/route.ts    # Daily chart endpoint
│   │               ├── trend.svg/route.ts    # Trend line endpoint
│   │               └── summary.svg/route.ts  # Summary badge endpoint
│   ├── page.tsx                              # Demo page
│   ├── layout.tsx                            # Root layout
│   └── globals.css                           # Global styles
├── lib/
│   └── utils.ts                              # Utility functions
├── API_README.md                              # Stats API documentation
└── README.md                                  # This file
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [Rough.js](https://roughjs.com/) for the amazing hand-drawn graphics library
- [SpecStory Stats API](https://stats.specstory.com) for repository analytics
- [Next.js](https://nextjs.org) for the awesome framework

## 🔗 Links

- [Live Demo](https://your-badges-app.vercel.app)
- [Stats API Documentation](./API_README.md)
- [SpecStory](https://specstory.com)
