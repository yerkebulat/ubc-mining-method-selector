# UBC Mining Method Selector

An open-source web application that implements the numerical mining method selection approach described by Nicholas (1981), based on the UBC Mining Method Selector spreadsheet by Miller-Tait, Pakalnis & Poulin (1995).

## Overview

This tool helps mining engineers and geologists perform preliminary screening of underground mining methods based on:

- **Deposit Geometry**: Shape, thickness, plunge, grade distribution, depth
- **Rock Mechanics**: Rock Mass Rating (RMR) and Rock Substance Strength (RSS) for ore zone, hanging wall, and footwall

The application evaluates 10 underground mining methods and ranks them by suitability score.

## Mining Methods Evaluated

1. Open Pit
2. Block Caving
3. Sublevel Stoping
4. Sublevel Caving
5. Longwall
6. Room and Pillar
7. Shrinkage Stoping
8. Cut and Fill
9. Top Slicing
10. Square Set

## Features

- **Interactive Form**: Input deposit and rock mechanics parameters
- **Instant Results**: Real-time calculation and ranking of mining methods
- **Detailed Breakdown**: View scores by category (geometry, ore zone, hanging wall, footwall)
- **Elimination Tracking**: Clearly identifies and explains eliminated methods
- **PDF Export**: Generate professional reports for documentation
- **Shareable Links**: Share results via URL parameters
- **Weights Reference**: View the complete scoring matrix used in calculations

## Quick Start

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/ubc-mining-method-selector.git
cd ubc-mining-method-selector

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Static Export (for GitHub Pages)

```bash
npm run build
```

The static files will be in the `out` directory.

## Deployment

### Vercel (Recommended)

Deploy to Vercel by connecting your GitHub repository.

### GitHub Pages

1. Fork this repository
2. Enable GitHub Pages in repository settings
3. Set source to GitHub Actions
4. The site will be available at `https://your-username.github.io/ubc-mining-method-selector/`

## Methodology

### Scoring System

Each deposit characteristic receives a score based on its suitability for each mining method:

| Score | Interpretation |
|-------|----------------|
| 4-6 | Preferred - Ideal for the method |
| 3-4 | Probable - Method can be used effectively |
| 1-2 | Possible - Not ideal but workable |
| 0 | Unlikely - Method not typically applied |
| -49 | Eliminated - Method cannot be used |

### Total Score Calculation

```
Total = Geometry + Ore Zone + Hanging Wall + Footwall

Where:
- Geometry = Shape + Thickness + Plunge + Grade + Depth
- Ore Zone = RMR_Ore + RSS_Ore
- Hanging Wall = RMR_HW + RSS_HW
- Footwall = RMR_FW + RSS_FW
```

Methods with any factor scoring -49 are automatically eliminated.

## Project Structure

```
├── data/
│   └── method-selector-config.json  # Scoring weights (extracted from Excel)
├── docs/
│   └── excel-analysis.md            # Documentation of Excel analysis
├── src/
│   ├── app/                         # Next.js app router pages
│   ├── components/                  # React components
│   ├── lib/                         # Utility functions and scoring engine
│   ├── types/                       # TypeScript type definitions
│   └── __tests__/                   # Test files
├── public/                          # Static assets
└── README.md
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Configuration

The scoring weights are stored in `data/method-selector-config.json`. This file contains:

- All 10 mining methods
- 11 input factors with their options
- Complete scoring matrix (450+ weight values)
- Factor tooltips and descriptions

**Note**: The weights are extracted from the original UBC Excel spreadsheet and should not be modified unless you have a validated alternative source.

## Attribution

This application is based on:

1. **Nicholas, D.E. (1981)**. "Method Selection – A Numerical Approach." Design and Operation of Caving and Sublevel Stoping Mines, Chapter 4, pp. 39-53.

2. **Miller-Tait, L., Pakalnis, R. & Poulin, R. (1995)**. "UBC Mining Method Selection." 4th International Symposium on Mine Planning & Equipment Selection, Calgary, Oct 31-Nov 3, 1995, pp. 163-168.

3. **Excel Implementation**: Jeff Breadner (1999), UBC Method.xls v1.1.0

## Disclaimer

- This is an **open-source reimplementation**, not an official UBC product
- Results are for **preliminary screening only**
- **Engineering judgment is required** for all mining decisions
- This tool is **not a substitute** for professional feasibility studies
- The authors and contributors make no warranties about the accuracy or suitability of results

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Adding new mining methods
- Modifying scoring weights
- Running tests
- Code style requirements

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original methodology by David E. Nicholas
- UBC algorithm development by Miller-Tait, Pakalnis & Poulin
- Excel implementation by Jeff Breadner
- Web application implemented by **Yerkebulan Tazabek**

---

**Note**: If you have questions about the mining engineering aspects of this tool, please consult qualified mining professionals. For technical issues with the web application, please open a GitHub issue.
