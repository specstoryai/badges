# 📊 SpecStory AI Activity Badges

Beautiful, hand-drawn style SVG badges for visualizing AI-assisted development activity in GitHub repositories. Track and display your AI coding sessions with authentic sketchy aesthetics!

## ✨ Features

- 🎨 **Hand-drawn style** using Rough.js for authentic sketchy appearance
- 📈 **Four badge types**: Calendar, daily charts, trend lines, and summary badges
- 🔄 **Real-time data** from GitHub repositories via the SpecStory Stats API
- ⚡ **Smart caching** with 1-hour TTL for optimal performance
- 🌿 **Branch support** for analyzing different branches
- 📱 **Responsive SVGs** that scale perfectly anywhere
- 🎯 **Customizable display** with query parameters and interactive controls
- 🎨 **SpecStory branding** with logo integration

## 🚀 Live Demo

Visit [https://badges.specstory.com](https://badges.specstory.com) to see the badges in action and generate badges for your repository.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A GitHub repository with `.specstory/history` directory containing AI session logs

### Installation

```bash
# Clone the repository
git clone https://github.com/specstoryai/badges.git
cd badges

# Install dependencies
npm install

# Start development server
npm run dev --turbopack
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📊 Badge Types

### 1. Activity Calendar
Monthly calendar view showing daily AI coding activity with green checkmarks for active days and red X's for inactive days.

```markdown
![Activity Calendar](https://badges.specstory.com/api/badge/owner/repo/calendar.svg)
```

**Query Parameters:**
- `month`: Specific month in YYYY-MM format (e.g., `2025-08`)
- `branch`: Git branch to analyze

Example:
```markdown
![August 2025](https://badges.specstory.com/api/badge/owner/repo/calendar.svg?month=2025-08&branch=main)
```

### 2. Daily Activity Chart
Shows daily prompt counts as a hand-drawn bar chart with intelligent date labeling.

```markdown
![Daily Activity](https://badges.specstory.com/api/badge/owner/repo/daily.svg)
```

**Query Parameters:**
- `showZeroDays`: Set to `true` to show zero-activity days as gray bars
- `branch`: Git branch to analyze

Example:
```markdown
![Daily Activity](https://badges.specstory.com/api/badge/owner/repo/daily.svg?showZeroDays=true&branch=develop)
```

### 3. Trend Line
Displays activity trend over time with a sketchy line chart and data points.

```markdown
![Trend](https://badges.specstory.com/api/badge/owner/repo/trend.svg)
```

**Query Parameters:**
- `showZeroDays`: Set to `true` to show zero-activity days as gray dots
- `branch`: Git branch to analyze

### 4. Summary Badge
Compact badge showing total prompts, daily average, and file count.

```markdown
![Summary](https://badges.specstory.com/api/badge/owner/repo/summary.svg)
```

**Query Parameters:**
- `branch`: Git branch to analyze

## 🎨 Interactive Demo Page

The application includes an interactive demo page at `/{owner}/{repo}` that allows you to:

1. **View all badges** for any GitHub repository
2. **Customize display** with interactive controls:
   - Choose primary badge to highlight
   - Select specific months for calendar view
   - Toggle zero-activity day visibility
   - Specify git branches
   - Hide secondary badges for focused view

### Demo Page Query Parameters

Navigate to `/{owner}/{repo}` with these optional parameters:

- `primary`: Choose main badge (`calendar`, `daily`, `trend`, `summary`)
- `month`: Calendar month (YYYY-MM format)
- `showZeroDays`: Include zero-activity days (`true`/`false`)
- `branch`: Git branch name
- `hideSecondary`: Show only primary badge (`true`/`false`)

Example URLs:
```
/specstoryai/tnyOffice?primary=daily&showZeroDays=true
/owner/repo?primary=calendar&month=2025-08&branch=develop
/owner/repo?primary=summary&hideSecondary=true
```

## 🎨 Visual Features

- **Rough.js rendering** for authentic hand-drawn appearance
- **SpecStory logo** integrated into each badge
- **Calendar view** with:
  - Green backgrounds and checkmarks for active days
  - Gray backgrounds and red X's for inactive days
  - Day numbers and prompt counts
  - Month/year title with repository name
- **Smart date labeling** that adapts to data density:
  - All dates shown for ≤7 days
  - Progressive reduction for larger datasets
- **Warm color palette** with cream backgrounds (#fffef8)
- **Sketchy borders** with customizable roughness

## 🛠️ API Endpoints

All endpoints follow the pattern:
```
/api/badge/[owner]/[name]/[type].svg
```

Where:
- `[owner]`: GitHub username or organization
- `[name]`: Repository name
- `[type]`: Badge type (`calendar`, `daily`, `trend`, `summary`)

### Response Headers
- `Content-Type: image/svg+xml`
- `Cache-Control: public, max-age=3600` (1-hour cache)

## 📝 Example Usage

Add these badges to your README:

```markdown
# My AI-Assisted Project

## 📊 Development Activity

<!-- Monthly calendar view -->
![Activity Calendar](https://badges.specstory.com/api/badge/owner/repo/calendar.svg)

<!-- Daily activity with hand-drawn bars -->
![Daily Prompts](https://badges.specstory.com/api/badge/owner/repo/daily.svg)

<!-- Trend line showing progress -->
![Trend](https://badges.specstory.com/api/badge/owner/repo/trend.svg)

<!-- Quick stats summary -->
![Summary](https://badges.specstory.com/api/badge/owner/repo/summary.svg)

<!-- Specific month calendar -->
![August 2025](https://badges.specstory.com/api/badge/owner/repo/calendar.svg?month=2025-08)

<!-- Feature branch activity -->
![Feature Branch](https://badges.specstory.com/api/badge/owner/repo/daily.svg?branch=feature-xyz)

<!-- Show gaps in activity -->
![With Zero Days](https://badges.specstory.com/api/badge/owner/repo/trend.svg?showZeroDays=true)
```

## 🔧 Configuration

The badges use the [SpecStory Stats API](https://stats.specstory.com) to fetch repository data. The API analyzes `.specstory/history` directories in GitHub repositories containing AI coding session logs.

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

The application is optimized for Vercel deployment with Next.js 15 and Turbopack.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/specstoryai/badges)

### Manual Deployment

```bash
# Build for production
npm run build --turbopack

# Start production server
npm start
```

### ESLint Configuration

The project includes ESLint configuration for Vercel deployment:

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@next/next/no-img-element": "off",
    "react/no-unescaped-entities": "off"
  }
}
```

## 🏗️ Tech Stack

- **Next.js 15** - React framework with App Router and Turbopack
- **Rough.js** - Hand-drawn graphics library
- **jsdom** - Server-side DOM for SVG generation
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling for demo pages
- **React 19** - Latest React features

## 📦 Project Structure

```
badges/
├── app/
│   ├── api/
│   │   └── badge/
│   │       └── [owner]/
│   │           └── [name]/
│   │               ├── calendar.svg/route.ts # Monthly calendar view
│   │               ├── daily.svg/route.ts    # Daily chart endpoint
│   │               ├── trend.svg/route.ts    # Trend line endpoint
│   │               └── summary.svg/route.ts  # Summary badge endpoint
│   ├── [owner]/
│   │   └── [repo]/
│   │       └── page.tsx                      # Dynamic repo page
│   ├── page.tsx                              # Homepage (redirects)
│   ├── layout.tsx                            # Root layout
│   └── globals.css                           # Global styles
├── lib/
│   └── utils.ts                              # Utility functions
├── public/
│   └── SpecStory-logo.svg                    # SpecStory logo
├── .eslintrc.json                            # ESLint configuration
├── package.json                              # Dependencies
├── tsconfig.json                             # TypeScript config
├── tailwind.config.ts                        # Tailwind configuration
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
- [Vercel](https://vercel.com) for hosting and deployment

## 🔗 Links

- [Live Application](https://badges.specstory.com)
- [SpecStory](https://specstory.com) - AI coding activity tracking
- [Stats API Documentation](./API_README.md)
- [GitHub Repository](https://github.com/specstoryai/badges)

---

Built with ❤️ by [SpecStory](https://specstory.com) to visualize AI-assisted development activity.