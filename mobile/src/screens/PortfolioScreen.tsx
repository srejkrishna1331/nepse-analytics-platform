import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const holdings = [
  { symbol: 'NABIL', qty: 100, avg: 1050, ltp: 1150, pl: 10000, plPct: 9.52 },
  { symbol: 'NICA', qty: 200, avg: 880, ltp: 930, pl: 10000, plPct: 5.68 },
  { symbol: 'UPPER', qty: 150, avg: 450, ltp: 490, pl: 6000, plPct: 8.89 },
  { symbol: 'NLIC', qty: 50, avg: 850, ltp: 820, pl: -1500, plPct: -3.53 },
];

export default function PortfolioScreen() {
  const totalInvested = holdings.reduce((s, h) => s + h.qty * h.avg, 0);
  const totalCurrent = holdings.reduce((s, h) => s + h.qty * h.ltp, 0);
  const totalPL = totalCurrent - totalInvested;
  const totalPLPct = (totalPL / totalInvested) * 100;

  return (
    <ScrollView style={styles.container}>
      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Invested</Text>
          <Text style={styles.summaryValue}>Rs. {(totalInvested / 1000).toFixed(0)}K</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Current</Text>
          <Text style={styles.summaryValue}>Rs. {(totalCurrent / 1000).toFixed(0)}K</Text>
        </View>
      </View>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>P/L</Text>
          <Text style={[styles.summaryValue, { color: totalPL >= 0 ? '#10b981' : '#ef4444' }]}>
            {totalPL >= 0 ? '+' : ''}Rs. {totalPL.toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Returns</Text>
          <Text style={[styles.summaryValue, { color: totalPLPct >= 0 ? '#10b981' : '#ef4444' }]}>
            {totalPLPct >= 0 ? '+' : ''}{totalPLPct.toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* Holdings */}
      <Text style={styles.sectionTitle}>Holdings</Text>
      {holdings.map((h) => (
        <View key={h.symbol} style={styles.holdingCard}>
          <View style={styles.holdingHeader}>
            <Text style={styles.holdingSymbol}>{h.symbol}</Text>
            <Text style={[styles.holdingPL, { color: h.pl >= 0 ? '#10b981' : '#ef4444' }]}>
              {h.pl >= 0 ? '+' : ''}{h.plPct.toFixed(2)}%
            </Text>
          </View>
          <View style={styles.holdingDetails}>
            <View style={styles.holdingDetail}>
              <Text style={styles.detailLabel}>Qty</Text>
              <Text style={styles.detailValue}>{h.qty}</Text>
            </View>
            <View style={styles.holdingDetail}>
              <Text style={styles.detailLabel}>Avg</Text>
              <Text style={styles.detailValue}>{h.avg}</Text>
            </View>
            <View style={styles.holdingDetail}>
              <Text style={styles.detailLabel}>LTP</Text>
              <Text style={styles.detailValue}>{h.ltp}</Text>
            </View>
            <View style={styles.holdingDetail}>
              <Text style={styles.detailLabel}>P/L</Text>
              <Text style={[styles.detailValue, { color: h.pl >= 0 ? '#10b981' : '#ef4444' }]}>
                Rs.{h.pl.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  summaryCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#334155' },
  summaryLabel: { color: '#94a3b8', fontSize: 11 },
  summaryValue: { color: '#e2e8f0', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  sectionTitle: { color: '#e2e8f0', fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 12 },
  holdingCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  holdingHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  holdingSymbol: { color: '#3b82f6', fontSize: 16, fontWeight: 'bold' },
  holdingPL: { fontSize: 14, fontWeight: 'bold' },
  holdingDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  holdingDetail: { alignItems: 'center' },
  detailLabel: { color: '#64748b', fontSize: 10 },
  detailValue: { color: '#e2e8f0', fontSize: 13, fontWeight: '600', marginTop: 2 },
});
