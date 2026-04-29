import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput } from 'react-native';

const stocks = [
  { symbol: 'NABIL', name: 'Nabil Bank', ltp: 1150, change: 0.70, volume: '250K' },
  { symbol: 'NICA', name: 'NIC Asia Bank', ltp: 930, change: 0.54, volume: '190K' },
  { symbol: 'GBIME', name: 'Global IME Bank', ltp: 285, change: -0.70, volume: '150K' },
  { symbol: 'SBL', name: 'Siddhartha Bank', ltp: 310, change: 1.31, volume: '120K' },
  { symbol: 'UPPER', name: 'Upper Tamakoshi', ltp: 490, change: 2.51, volume: '300K' },
  { symbol: 'NLIC', name: 'Nepal Life Insurance', ltp: 820, change: -0.61, volume: '80K' },
  { symbol: 'CHCL', name: 'Chilime Hydro', ltp: 540, change: 1.50, volume: '95K' },
  { symbol: 'NTC', name: 'Nepal Telecom', ltp: 680, change: -0.44, volume: '60K' },
  { symbol: 'SHIVM', name: 'Shivam Cements', ltp: 520, change: 2.97, volume: '45K' },
  { symbol: 'HBL', name: 'Himalayan Bank', ltp: 420, change: -0.71, volume: '85K' },
];

export default function MarketScreen() {
  const [search, setSearch] = useState('');
  const filtered = stocks.filter(
    (s) => s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search stocks..."
        placeholderTextColor="#64748b"
        value={search}
        onChangeText={setSearch}
      />
      <ScrollView>
        {/* Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { flex: 1.5 }]}>Symbol</Text>
          <Text style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>LTP</Text>
          <Text style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>Change</Text>
          <Text style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>Volume</Text>
        </View>
        {filtered.map((s) => (
          <View key={s.symbol} style={styles.tableRow}>
            <View style={{ flex: 1.5 }}>
              <Text style={styles.symbol}>{s.symbol}</Text>
              <Text style={styles.name}>{s.name}</Text>
            </View>
            <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>{s.ltp.toFixed(2)}</Text>
            <Text
              style={[styles.cell, { flex: 1, textAlign: 'right', color: s.change >= 0 ? '#10b981' : '#ef4444' }]}
            >
              {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
            </Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>{s.volume}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  search: { backgroundColor: '#1e293b', margin: 16, borderRadius: 8, padding: 12, color: '#e2e8f0', borderWidth: 1, borderColor: '#334155', fontSize: 14 },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerCell: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', alignItems: 'center' },
  symbol: { color: '#3b82f6', fontSize: 14, fontWeight: 'bold' },
  name: { color: '#64748b', fontSize: 10, marginTop: 2 },
  cell: { color: '#e2e8f0', fontSize: 13 },
});
