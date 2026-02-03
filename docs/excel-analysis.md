# Excel File Analysis: UBC Method.xls

## Overview

This document describes the analysis of the `UBC Method.xls` file, which is the authoritative source for the mining method selection weights used in this web application.

## File Information

- **File Name**: UBC Method.xls
- **Version**: v 1.1.0
- **Format**: Microsoft Excel 97-2003 (.xls)
- **Sheets**: 2 (Main, Weights)

## Sheet Structure

### Main Sheet

The Main sheet serves as the user interface in the original Excel implementation.

**Structure**:
- Row 2: Column headers (Method, Shape, Plunge, Thickness, Grades, Depth, RMR Ore, RMR HW, RMR FW, RSS Ore, RSS HW, RSS FW, Total)
- Rows 3-12: Mining methods with their calculated scores

**Mining Methods Listed**:
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

**Attribution in Excel**:
- Algorithm by: Miller-Tait, L., Pakalnis, R. and Poulin, R. (1995)
- Excel implementation by: Jeff Breadner (1999)
- Original idea: Nicholas, D. (1992) SME Mining Engineering Handbook

### Weights Sheet

The Weights sheet contains the core scoring matrices used for calculations.

**Structure**:
- Row 9: Category labels (Shape, Plunge, Thickness, Grades, Depth, RMR Ore, RMR Hanging Wall, RMR Footwall, RSS Ore, RSS Hanging Wall, RSS Footwall)
- Row 10: Option labels for each category
- Rows 11-20: Weight values for each mining method

## Input Parameters

### Geometry & Grade Distribution

| Factor | Options | Description |
|--------|---------|-------------|
| Shape | Equidimensional, Platy/Tabular, Irregular | General shape of the deposit |
| Thickness | V. Narrow, Narrow, Intermediate, Thick, V. Thick | Ore body thickness |
| Plunge | Flat, Moderate, Steep | Angle of the ore body plunge |
| Grade | Low, Moderate, High | Grade distribution variability |
| Depth | <100m, 100-600m, >600m | Depth below surface |

### Rock Mechanics

For each zone (Ore, Hanging Wall, Footwall):

| Factor | Options | Description |
|--------|---------|-------------|
| RMR | V. Weak, Weak, Moderate, Strong, V. Strong | Rock Mass Rating |
| RSS | V. Weak, Weak, Moderate, Strong | Rock Substance Strength |

**Note**: RSS has only 4 options while RMR has 5 options.

## Scoring System

### Weight Value Interpretation

| Value Range | Interpretation |
|-------------|----------------|
| 4-6 | Preferred - Characteristic is ideal for the method |
| 3-4 | Probable - Method can be used effectively |
| 1-2 | Possible - Method might work but not ideal |
| 0 | Unlikely - Method would not typically be applied |
| -49 | Eliminated - Method cannot be used |

### Special Values

- **-49**: Elimination threshold. If any factor scores -49, the method is eliminated.
- **-10**: Used for Sublevel Stoping with V. Narrow thickness (partial elimination).
- **6**: Maximum preferred value (used for Longwall with weak rock conditions).

## Calculation Logic

The total score for each mining method is calculated as:

```
Total = Geometry Score + Ore Zone Score + Hanging Wall Score + Footwall Score

Where:
- Geometry Score = Shape + Thickness + Plunge + Grade + Depth
- Ore Zone Score = RMR Ore + RSS Ore
- Hanging Wall Score = RMR HW + RSS HW
- Footwall Score = RMR FW + RSS FW
```

## Data Extraction

The weight values were extracted programmatically from the Excel file using pandas and xlrd. The extracted data is stored in `/data/method-selector-config.json`.

### Verification

All extracted values have been verified against the original Excel file:
- 10 mining methods
- 11 input factors
- Total of 450+ individual weight values

## Differences from Nicholas (1981) Paper

The UBC Excel implementation differs slightly from the original Nicholas (1981) paper:

1. **Category naming**: Excel uses "RMR" and "RSS" instead of more detailed rock mechanics categories
2. **Option counts**: Some categories have different numbers of options
3. **Weight values**: Some specific weights differ from the paper's tables
4. **Additional depth category**: Excel includes depth as a factor

**Important**: The Excel file is the authoritative source for this implementation, not the paper. The paper serves as conceptual reference only.

## File Integrity

- The Excel file appears to be the original implementation from 1999
- Macros are present but not required for data extraction
- The weights data does not require VBA to read

## Recommendations

1. Do not commit the original Excel file to the repository (licensing unclear)
2. Use the extracted JSON configuration as the data source
3. Document any discrepancies between Excel and paper in the application
