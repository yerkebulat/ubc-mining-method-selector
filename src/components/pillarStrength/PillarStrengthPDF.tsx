'use client';

import {
  Document,
  Link,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: '#344256',
    paddingBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2530',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 11,
    color: '#5c7699',
  },
  warning: {
    backgroundColor: '#fee2e2',
    color: '#7f1d1d',
    padding: 10,
    marginBottom: 16,
    lineHeight: 1.4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#344256',
    marginBottom: 8,
    backgroundColor: '#ebeef3',
    padding: 7,
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d2dae5',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d2dae5',
  },
  labelCell: {
    width: '45%',
    padding: 6,
    color: '#485f7f',
  },
  valueCell: {
    width: '55%',
    padding: 6,
    color: '#1f2530',
    fontWeight: 'bold',
  },
  text: {
    color: '#3b4d67',
    lineHeight: 1.45,
  },
  linkText: {
    color: '#2563eb',
    fontSize: 9,
    lineHeight: 1.4,
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
  },
});

interface PillarStrengthPDFProps {
  summary: Record<string, string | number | null>;
  warnings: string[];
  equationNotes: string[];
  shareUrl?: string;
}

function PillarStrengthPDFDocument({
  summary,
  warnings,
  equationNotes,
  shareUrl,
}: PillarStrengthPDFProps) {
  const timestamp = new Date().toLocaleString();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Pillar Strength Calculation Report</Text>
          <Text style={styles.subtitle}>
            Generated: {timestamp} | Metric preliminary calculator
          </Text>
        </View>

        <Text style={styles.warning}>
          These calculations are simplified empirical and tributary-area estimates.
          They are screening-level outputs and should not be used blindly for final design.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Results Summary</Text>
          <View style={styles.table}>
            {Object.entries(summary).map(([key, value]) => (
              <View key={key} style={styles.row}>
                <Text style={styles.labelCell}>{key}</Text>
                <Text style={styles.valueCell}>{value ?? 'Unavailable'}</Text>
              </View>
            ))}
          </View>
        </View>

        {shareUrl && shareUrl !== 'Unavailable' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reloadable Calculation Link</Text>
            <Link src={shareUrl} style={styles.linkText}>
              {shareUrl}
            </Link>
          </View>
        )}

        {warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Warnings and Notes</Text>
            {warnings.map((warning) => (
              <Text key={warning} style={styles.text}>
                - {warning}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equation Notes</Text>
          {equationNotes.map((note) => (
            <Text key={note} style={styles.text}>
              - {note}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assumptions</Text>
          <Text style={styles.text}>
            Tributary-area loading assumes simplified equal load sharing and pillars
            loaded approximately parallel to their vertical axis. Empirical equations
            are calibration-dependent; geology, joints, scale effects, blasting damage,
            time effects, and irregular geometry can materially change behavior.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            UBC Mining Method Selector project. Professional engineering judgment required.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generatePillarStrengthPDF(
  summary: Record<string, string | number | null>,
  warnings: string[],
  equationNotes: string[],
  shareUrl?: string
): Promise<Blob> {
  return pdf(
    <PillarStrengthPDFDocument
      summary={summary}
      warnings={warnings}
      equationNotes={equationNotes}
      shareUrl={shareUrl}
    />
  ).toBlob();
}

export function downloadPillarStrengthPDF(
  blob: Blob,
  filename = 'pillar-strength-report.pdf'
) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
