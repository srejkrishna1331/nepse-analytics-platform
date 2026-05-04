import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

export default function SignalScreen() {
  const [symbol, setSymbol] = useState('NABIL');

  const signal = {
    signal: 'BUY' as const,
    confidence: 72.5,
    score: 68.3,
    riskLevel: 'MEDIUM',
    indicators: [
      { name: 'RSI', signal: 'BUY', reason: 'Approaching oversold (42.5)' },
      { name: 'MACD', signal: 'BUY', reason: 'Bullish crossover' },
      { name: 'Bollinger', signal: 'HOLD', reason: 'Within bands' },
      { name: 'SMA Cross', signal: 'BUY', reason: 'Golden cross active' },
      { name: 'Volume', signal: 'BUY', reason: '1.8x above average' },
      { name: 'ADX', signal: 'BUY', reason: 'Strong uptrend (32.5)' },
    ],
  };

  const signalColor = signal.signal === 'BUY' ? '#10b981' : signal.signal === 'SELL' ? '#ef4444' : '#f59e0b';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={symbol}
          onChangeText={(t) => setSymbol(t.toUpperCase())}
          placeholder="Symbol"
          placeholderTextColor="#64748b"
        />
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Analyze</Text>
        </TouchableOpacity>
      </View>

      {/* Signal Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderColor: signalColor }]}>
          <Text style={styles.summaryLabel}>Signal</Text>
          <Text style={[styles.summaryBig, { color: signalColor }]}>{signal.signal}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Confidence</Text>
          <Text style={[styles.summaryBig, { color: '#3b82f6' }]}>{signal.confidence}%</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Score</Text>
          <Text style={styles.summaryBig}>{signal.score}/100</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Risk</Text>
          <Text style={[styles.summaryBig, { color: '#f59e0b' }]}>{signal.riskLevel}</Text>
        </View>
      </View>

      {/* Indicators */}
      <Text style={styles.sectionTitle}>Indicator Breakdown</Text>
      {signal.indicators.map((ind, i) => (
        <View key={i} style={styles.indicatorRow}>
          <View style={styles.indicatorLeft}>
            <View style={[styles.dot, {
              backgroundColor: ind.signal === 'BUY' ? '#10b981' : ind.signal === 'SELL' ? '#ef4444' : '#f59e0b'
            }]} />
            <Text style={styles.indicatorName}>{ind.name}</Text>
          </View>
          <View style={styles.indicatorRight}>
            <Text style={styles.indicatorReason}>{ind.reason}</Text>
            <View style={[styles.badge, {
              backgroundColor: ind.signal === 'BUY' ? '#064e3b' : ind.signal === 'SELL' ? '#7f1d1d' : '#78350f'
            }]}>
              <Text style={[styles.badgeText, {
                color: ind.signal === 'BUY' ? '#34d399' : ind.signal === 'SELL' ? '#fca5a5' : '#fcd34d'
              }]}>{ind.signal}</Text>
            </View>
          </View>
        </View>
      ))}

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Signals are for educational purposes only. Always do your own research.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: { flex: 1, backgroundColor: '#1e293b', borderRadius: 8, padding: 12, color: '#e2e8f0', borderWidth: 1, borderColor: '#334155' },
  button: { backgroundColor: '#2563eb', borderRadius: 8, paddingHorizontal: 20, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  summaryCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  summaryLabel: { color: '#94a3b8', fontSize: 12 },
  summaryBig: { color: '#e2e8f0', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  sectionTitle: { color: '#e2e8f0', fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 12 },
  indicatorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  indicatorLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  indicatorName: { color: '#e2e8f0', fontSize: 13, fontWeight: '600' },
  indicatorRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  indicatorReason: { color: '#94a3b8', fontSize: 11, maxWidth: 140 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  disclaimer: { margin: 16, padding: 12, backgroundColor: '#422006', borderRadius: 8 },
  disclaimerText: { color: '#fbbf24', fontSize: 11, opacity: 0.7, textAlign: 'center' },
});
