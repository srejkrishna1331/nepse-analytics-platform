import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const news = [
  { title: 'NABIL Bank Reports Record Quarterly Profit', source: 'ShareSansar', date: '2026-04-28', sentiment: 'positive', symbols: ['NABIL'] },
  { title: 'NIC Asia Expands Branch Network', source: 'MeroLagani', date: '2026-04-27', sentiment: 'positive', symbols: ['NICA'] },
  { title: 'Nepal Rastra Bank Tightens Monetary Policy', source: 'Nepali Times', date: '2026-04-26', sentiment: 'negative', symbols: ['NABIL', 'NICA'] },
  { title: 'Hydropower Sector Shows Strong Growth', source: 'ShareSansar', date: '2026-04-25', sentiment: 'positive', symbols: ['NHPC', 'CHCL'] },
  { title: 'SEBON Introduces New Margin Rules', source: 'MeroLagani', date: '2026-04-24', sentiment: 'neutral', symbols: [] },
];

export default function NewsScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Sentiment Summary */}
      <View style={styles.sentimentRow}>
        <View style={[styles.sentimentCard, { borderColor: '#065f46' }]}>
          <Text style={[styles.sentimentCount, { color: '#10b981' }]}>3</Text>
          <Text style={styles.sentimentLabel}>Positive</Text>
        </View>
        <View style={[styles.sentimentCard, { borderColor: '#991b1b' }]}>
          <Text style={[styles.sentimentCount, { color: '#ef4444' }]}>1</Text>
          <Text style={styles.sentimentLabel}>Negative</Text>
        </View>
        <View style={[styles.sentimentCard, { borderColor: '#92400e' }]}>
          <Text style={[styles.sentimentCount, { color: '#f59e0b' }]}>1</Text>
          <Text style={styles.sentimentLabel}>Neutral</Text>
        </View>
      </View>

      {/* News Items */}
      {news.map((item, i) => (
        <View key={i} style={styles.newsCard}>
          <View style={styles.newsHeader}>
            <Text style={styles.newsTitle}>{item.title}</Text>
            <View style={[styles.sentimentBadge, {
              backgroundColor: item.sentiment === 'positive' ? '#064e3b' : item.sentiment === 'negative' ? '#7f1d1d' : '#78350f'
            }]}>
              <Text style={[styles.sentimentBadgeText, {
                color: item.sentiment === 'positive' ? '#34d399' : item.sentiment === 'negative' ? '#fca5a5' : '#fcd34d'
              }]}>
                {item.sentiment.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.newsMeta}>
            <Text style={styles.newsSource}>{item.source}</Text>
            <Text style={styles.newsDate}>{item.date}</Text>
          </View>
          {item.symbols.length > 0 && (
            <View style={styles.symbolsRow}>
              {item.symbols.map((s) => (
                <View key={s} style={styles.symbolBadge}>
                  <Text style={styles.symbolBadgeText}>{s}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  sentimentRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  sentimentCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1 },
  sentimentCount: { fontSize: 24, fontWeight: 'bold' },
  sentimentLabel: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  newsCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  newsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  newsTitle: { color: '#e2e8f0', fontSize: 14, fontWeight: '600', flex: 1 },
  sentimentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  sentimentBadgeText: { fontSize: 9, fontWeight: 'bold' },
  newsMeta: { flexDirection: 'row', gap: 12, marginTop: 8 },
  newsSource: { color: '#64748b', fontSize: 11 },
  newsDate: { color: '#64748b', fontSize: 11 },
  symbolsRow: { flexDirection: 'row', gap: 4, marginTop: 8 },
  symbolBadge: { backgroundColor: '#1e3a5f', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  symbolBadgeText: { color: '#60a5fa', fontSize: 10, fontWeight: '600' },
});
