# Polymarket Volume Dashboard

A beautiful, responsive dashboard that displays the top 10 active markets on Polymarket sorted by 24-hour volume. Built with Next.js, React, and Tailwind CSS.

## Features

- 📊 **Real-time Data**: Fetches live market data from Polymarket's API
- 🔄 **Auto-refresh**: Updates every 45 seconds automatically
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 🎨 **Beautiful UI**: Light theme with smooth curves and subtle gradients
- ⚡ **Fast Performance**: Optimized with Next.js App Router and caching
- 🛡️ **Error Handling**: Graceful error states and loading indicators

## Market Information Displayed

Each market card shows:
- Market question/title
- 24-hour trading volume
- Current Yes/No outcome prices
- Number of active traders
- Total liquidity
- Market end date
- Market image (when available)

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API**: Polymarket Gamma API

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

- `GET /api/markets` - Fetches top 10 markets by 24h volume

## Project Structure

```
src/
├── app/
│   ├── api/markets/route.ts    # API route for market data
│   ├── components/
│   │   └── MarketCard.tsx      # Individual market card component
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main dashboard page
├── tailwind.config.ts          # Tailwind configuration
└── package.json
```

## Data Source

This dashboard uses the [Polymarket Gamma API](https://gamma-api.polymarket.com/markets) to fetch market data. The API provides:

- Market questions and metadata
- 24-hour trading volumes
- Market liquidity and trader counts
- Market images and end dates
- Condition IDs and token information

## Customization

The dashboard is highly customizable through Tailwind CSS classes. Key design elements:

- **Colors**: Soft blues, purples, and grays
- **Borders**: Rounded corners with `rounded-2xl`
- **Shadows**: Subtle shadows with hover effects
- **Gradients**: Light background gradients
- **Animations**: Smooth transitions and hover effects

## Performance

- **Caching**: API responses are cached for 30 seconds
- **Auto-refresh**: Data updates every 45 seconds
- **Optimized Images**: Next.js Image component with lazy loading
- **Responsive**: Mobile-first design with breakpoints

## Future Enhancements

This is the foundation for a more comprehensive Polymarket dashboard. Future features could include:

- Real-time price updates
- Market search and filtering
- User portfolio tracking
- Market analytics and charts
- Dark mode toggle
- Market categories and tags

## License

MIT License - feel free to use this project as a starting point for your own Polymarket applications!