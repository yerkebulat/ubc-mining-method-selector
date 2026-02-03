'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import type { ScoringResult } from '@/types';
import { getConfig } from '@/lib/scoring-engine';

const config = getConfig();

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #344256',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2530',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#5c7699',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#344256',
    marginBottom: 10,
    backgroundColor: '#ebeef3',
    padding: 8,
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d2dae5',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d2dae5',
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#344256',
    borderBottomWidth: 1,
    borderBottomColor: '#d2dae5',
  },
  tableCell: {
    padding: 6,
    flex: 1,
  },
  tableCellHeader: {
    padding: 6,
    flex: 1,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rankCell: {
    width: 40,
    textAlign: 'center',
    padding: 6,
  },
  methodCell: {
    flex: 2,
    padding: 6,
  },
  scoreCell: {
    width: 60,
    textAlign: 'center',
    padding: 6,
  },
  statusCell: {
    width: 80,
    textAlign: 'center',
    padding: 6,
  },
  eliminated: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  recommended: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  inputItem: {
    width: '50%',
    paddingVertical: 4,
    paddingRight: 10,
  },
  inputLabel: {
    color: '#5c7699',
    fontSize: 9,
  },
  inputValue: {
    fontWeight: 'bold',
    color: '#1f2530',
  },
  methodology: {
    backgroundColor: '#f5f7fa',
    padding: 15,
    marginBottom: 20,
  },
  methodologyText: {
    lineHeight: 1.5,
    color: '#3b4d67',
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#d2dae5',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#7c94b2',
    textAlign: 'center',
    marginBottom: 3,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 30,
    right: 40,
    color: '#7c94b2',
  },
  categoryBreakdown: {
    flexDirection: 'row',
    marginTop: 5,
    marginBottom: 10,
  },
  categoryBox: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 8,
    marginRight: 5,
  },
  categoryTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#344256',
    marginBottom: 4,
  },
  categoryScore: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2530',
  },
});

interface PDFReportProps {
  results: ScoringResult;
}

function PDFReportDocument({ results }: PDFReportProps) {
  const timestamp = new Date().toLocaleString();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mining Method Selection Report</Text>
          <Text style={styles.subtitle}>
            Generated: {timestamp} | UBC Mining Method Selector v1.0.0
          </Text>
        </View>

        {/* Methodology Section */}
        <View style={styles.methodology}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5, color: '#1f2530' }}>
            Methodology
          </Text>
          <Text style={styles.methodologyText}>
            This report uses the numerical mining method selection approach developed
            by Nicholas (1981), implemented as the UBC Mining Method Selector by
            Miller-Tait, Pakalnis &amp; Poulin (1995). The method ranks 10 underground
            mining methods based on deposit geometry, grade distribution, and rock
            mechanics characteristics. Each parameter combination receives a score
            (preferred: 3-4, probable: 1-2, unlikely: 0, eliminated: -49). Methods
            with any elimination score (-49) are removed from consideration.
          </Text>
        </View>

        {/* Input Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Input Parameters</Text>
          <View style={styles.inputGrid}>
            {Object.entries(results.inputs).map(([key, value]) => {
              const factor = config.factors[key];
              return (
                <View key={key} style={styles.inputItem}>
                  <Text style={styles.inputLabel}>{factor?.label || key}:</Text>
                  <Text style={styles.inputValue}>{value}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Results Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ranked Mining Methods</Text>
          <View style={styles.table}>
            <View style={styles.tableRowHeader}>
              <Text style={[styles.tableCellHeader, styles.rankCell]}>Rank</Text>
              <Text style={[styles.tableCellHeader, styles.methodCell]}>Method</Text>
              <Text style={[styles.tableCellHeader, styles.scoreCell]}>Geo</Text>
              <Text style={[styles.tableCellHeader, styles.scoreCell]}>Ore</Text>
              <Text style={[styles.tableCellHeader, styles.scoreCell]}>HW</Text>
              <Text style={[styles.tableCellHeader, styles.scoreCell]}>FW</Text>
              <Text style={[styles.tableCellHeader, styles.scoreCell]}>Total</Text>
              <Text style={[styles.tableCellHeader, styles.statusCell]}>Status</Text>
            </View>
            {results.rankedMethods.map((result, idx) => (
              <View
                key={result.method}
                style={[
                  styles.tableRow,
                  result.isEliminated ? styles.eliminated : {},
                ]}
              >
                <Text style={[styles.tableCell, styles.rankCell]}>
                  {result.isEliminated ? '-' : idx + 1}
                </Text>
                <Text style={[styles.tableCell, styles.methodCell]}>
                  {result.method}
                </Text>
                <Text style={[styles.tableCell, styles.scoreCell]}>
                  {result.categoryScores.geometry.score}
                </Text>
                <Text style={[styles.tableCell, styles.scoreCell]}>
                  {result.categoryScores.ore_zone.score}
                </Text>
                <Text style={[styles.tableCell, styles.scoreCell]}>
                  {result.categoryScores.hanging_wall.score}
                </Text>
                <Text style={[styles.tableCell, styles.scoreCell]}>
                  {result.categoryScores.footwall.score}
                </Text>
                <Text style={[styles.tableCell, styles.scoreCell]}>
                  {result.totalScore}
                </Text>
                <Text style={[styles.tableCell, styles.statusCell]}>
                  {result.isEliminated ? 'Eliminated' : 'Recommended'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Recommendations */}
        {results.recommendedMethods.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Top {Math.min(3, results.recommendedMethods.length)} Recommendations
            </Text>
            {results.recommendedMethods.slice(0, 3).map((result, idx) => (
              <View key={result.method} style={{ marginBottom: 10 }}>
                <Text style={{ fontWeight: 'bold', color: '#1f2530', marginBottom: 3 }}>
                  {idx + 1}. {result.method} (Score: {result.totalScore})
                </Text>
                <View style={styles.categoryBreakdown}>
                  <View style={styles.categoryBox}>
                    <Text style={styles.categoryTitle}>Geometry</Text>
                    <Text style={styles.categoryScore}>
                      {result.categoryScores.geometry.score}
                    </Text>
                  </View>
                  <View style={styles.categoryBox}>
                    <Text style={styles.categoryTitle}>Ore Zone</Text>
                    <Text style={styles.categoryScore}>
                      {result.categoryScores.ore_zone.score}
                    </Text>
                  </View>
                  <View style={styles.categoryBox}>
                    <Text style={styles.categoryTitle}>Hanging Wall</Text>
                    <Text style={styles.categoryScore}>
                      {result.categoryScores.hanging_wall.score}
                    </Text>
                  </View>
                  <View style={styles.categoryBox}>
                    <Text style={styles.categoryTitle}>Footwall</Text>
                    <Text style={styles.categoryScore}>
                      {result.categoryScores.footwall.score}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Based on David E. Nicholas (1981), &quot;Method Selection – A Numerical
            Approach&quot; and the UBC Mining Method Selector by Miller-Tait, Pakalnis
            &amp; Poulin (1995).
          </Text>
          <Text style={styles.footerText}>
            Web application implemented by Yerkebulan Tazabek.
          </Text>
          <Text style={styles.footerText}>
            Open-source reimplementation. Not an official UBC product. Engineering
            judgment required.
          </Text>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

export async function generatePDF(results: ScoringResult): Promise<Blob> {
  const blob = await pdf(<PDFReportDocument results={results} />).toBlob();
  return blob;
}

export function downloadPDF(blob: Blob, filename: string = 'mining-method-report.pdf') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
