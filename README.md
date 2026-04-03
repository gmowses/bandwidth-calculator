# Bandwidth Calculator

Bandwidth calculator with unit conversion, transfer time, oversubscription ratio and 95th percentile estimation. Client-side only.

Live: https://gmowses.github.io/bandwidth-calculator

## Features

- **Unit Converter** — Kbps / Mbps / Gbps / Tbps <-> KB/s / MB/s / GB/s / TB/s (bits vs bytes, factor of 8)
- **Transfer Time** — file size + bandwidth = estimated transfer duration
- **Oversubscription** — total clients x plan speed / uplink capacity = ratio with contention assessment
- **95th Percentile** — average usage x burst factor with explanation
- Dark / Light mode toggle
- i18n EN / PT-BR
- No server, no tracking, no external requests beyond fonts

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Vite 8
- Lucide React icons
- GitHub Pages (via GitHub Actions)

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## License

MIT
