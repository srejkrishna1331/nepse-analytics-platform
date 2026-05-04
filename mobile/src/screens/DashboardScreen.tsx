import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const indices = [
  { name: 'NEPSE', value: 2285.5, change: 15.3, pct: 0.67 },
  { name: 'SENSITIVE', value: 432.15, change: 2.85, pct: 0.66 },
  { name: 'BANKING', value: 1820.3, change: 12.5, pct: 0.69 },
];

const gainers = [
  { symbol: 'UPPER', price: 490, pct: 2.51 },
  { symbol: 'SHIVM', price: 520, pct: 2.97 },
  { symbol: 'CHCL', price: 540, pct: 1.50 },
];

const losers = [
  { symbol: 'GBIME', price: 285, pct: -0.70 },
  { symbol: 'HBL', price: 420, pct: -0.71 },
  { symbol: 'NLIC', price: 820, pct: -0.61 },
];

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Indices */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.indicesRow}>
        {indices.map((idx) => (
          <View key={idx.name} style={styles.indexCard}>
            <Text style={styles.indexName}>{idx.name}</Text>
            <Text style={styles.indexValue}>{idx.value.toFixed(2)}</Text>
            <Text style={[styles.indexChange, { color: idx.change >= 0 ? '#10b981' : '#ef4444' }]}>
              {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)} ({idx.pct.toFixed(2)}%)
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Turnover</Text>
          <Text style={styles.summaryValue}>Rs. 5.50B</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Volume</Text>
          <Text style={styles.summaryValue}>12.0M</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Adv/Dec</Text>
          <Text style={styles.summaryValue}>
            <Text style={{ color: '#10b981' }}>156</Text>/<Text style={{ color: '#ef4444' }}>82</Text>
          </Text>
        </View>
      </View>

      {/* Gainers */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: '#10b981' }]}>Top Gainers</Text>
        {gainers.map((s) => (
          <View key={s.symbol} style={styles.stockRow}>
            <Text style={styles.stockSymbol}>{s.symbol}</Text>
            <View style={styles.stockRight}>
              <Text style={styles.stockPrice}>{s.price.toFixed(2)}</Text>
              <Text style={[styles.stockChange, { color: '#10b981' }]}>+{s.pct.toFixed(2)}%</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Losers */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Top Losers</Text>
        {losers.map((s) => (
          <View key={s.symbol} style={styles.stockRow}>
            <Text style={styles.stockSymbol}>{s.symbol}</Text>
            <View style={styles.stockRight}>
              <Text style={styles.stockPrice}>{s.price.toFixed(2)}</Text>
              <Text style={[styles.stockChange, { color: '#ef4444' }]}>{s.pct.toFixed(2)}%</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Disclaimer: This app provides analytics for educational purposes only.
          Trading involves risk. Always do your own research.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  indicesRow: { paddingHorizontal: 16, paddingTop: 16 },
  indexCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginRight: 12, minWidth: 140, borderWidth: 1, borderColor: '#334155' },
  indexName: { color: '#94a3b8', fontSize: 12 },
  indexValue: { color: '#e2e8f0', fontSize: 22, fontWeight: 'bold', marginTop: 4 },
  indexChange: { fontSize: 12, marginTop: 4 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  summaryCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#334155' },
  summaryLabel: { color: '#94a3b8', fontSize: 11 },
  summaryValue: { color: '#e2e8f0', fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  stockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  stockSymbol: { color: '#3b82f6', fontSize: 14, fontWeight: 'bold' },
  stockRight: { alignItems: 'flex-end' },
  stockPrice: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  stockChange: { fontSize: 12, marginTop: 2 },
  disclaimer: { margin: 16, padding: 12, backgroundColor: '#422006', borderRadius: 8, borderWidth: 1, borderColor: '#854d0e' },
  disclaimerText: { color: '#fbbf24', fontSize: 11, opacity: 0.7 },
});
