-- Sample NEPSE Stocks
INSERT INTO stocks (symbol, name, sector, listed_shares) VALUES
('NABIL', 'Nabil Bank Limited', 'Commercial Banks', 96146530),
('NICA', 'NIC Asia Bank Limited', 'Commercial Banks', 161092496),
('GBIME', 'Global IME Bank Limited', 'Commercial Banks', 161092496),
('SBL', 'Siddhartha Bank Limited', 'Commercial Banks', 120000000),
('HBL', 'Himalayan Bank Limited', 'Commercial Banks', 80000000),
('EBL', 'Everest Bank Limited', 'Commercial Banks', 80000000),
('SCB', 'Standard Chartered Bank Nepal', 'Commercial Banks', 80120000),
('SANIMA', 'Sanima Bank Limited', 'Commercial Banks', 120000000),
('KBL', 'Kumari Bank Limited', 'Commercial Banks', 100000000),
('MBL', 'Machhapuchchhre Bank Limited', 'Commercial Banks', 100000000),
('NLIC', 'Nepal Life Insurance Company', 'Life Insurance', 80000000),
('ALICL', 'Asian Life Insurance Company', 'Life Insurance', 50000000),
('LICN', 'Life Insurance Corporation Nepal', 'Life Insurance', 40000000),
('NHPC', 'National Hydro Power Company', 'Hydro Power', 30000000),
('CHCL', 'Chilime Hydro Power Company', 'Hydro Power', 50000000),
('BPCL', 'Butwal Power Company', 'Hydro Power', 60000000),
('API', 'API Power Company Limited', 'Hydro Power', 40000000),
('UPPER', 'Upper Tamakoshi Hydropower', 'Hydro Power', 100000000),
('NTC', 'Nepal Telecom', 'Others', 150000000),
('SHIVM', 'Shivam Cements Limited', 'Manufacturing', 30000000),
('UNL', 'Unilever Nepal Limited', 'Manufacturing', 10000000),
('NMB', 'NMB Bank Limited', 'Commercial Banks', 140000000),
('PCBL', 'Prime Commercial Bank', 'Commercial Banks', 120000000),
('CZBIL', 'Citizens Bank International', 'Commercial Banks', 100000000),
('PRVU', 'Prabhu Bank Limited', 'Commercial Banks', 140000000);

-- Sample OHLC data for NABIL (30 days)
INSERT INTO ohlc_daily (stock_id, date, open, high, low, close, volume, turnover) VALUES
(1, '2026-03-30', 1050, 1065, 1040, 1058, 125000, 132250000),
(1, '2026-03-31', 1058, 1072, 1050, 1070, 145000, 155150000),
(1, '2026-04-01', 1070, 1080, 1062, 1075, 110000, 118250000),
(1, '2026-04-02', 1075, 1090, 1070, 1085, 180000, 195300000),
(1, '2026-04-03', 1085, 1095, 1078, 1088, 95000, 103360000),
(1, '2026-04-06', 1088, 1100, 1085, 1098, 160000, 175680000),
(1, '2026-04-07', 1098, 1110, 1090, 1105, 200000, 221000000),
(1, '2026-04-08', 1105, 1115, 1095, 1100, 135000, 148500000),
(1, '2026-04-09', 1100, 1108, 1088, 1092, 115000, 125580000),
(1, '2026-04-10', 1092, 1098, 1080, 1085, 90000, 97650000),
(1, '2026-04-13', 1085, 1095, 1075, 1090, 130000, 141700000),
(1, '2026-04-14', 1090, 1102, 1085, 1098, 155000, 170190000),
(1, '2026-04-15', 1098, 1118, 1095, 1115, 220000, 245300000),
(1, '2026-04-16', 1115, 1125, 1108, 1120, 185000, 207200000),
(1, '2026-04-17', 1120, 1130, 1112, 1125, 175000, 196875000),
(1, '2026-04-20', 1125, 1140, 1120, 1135, 195000, 221325000),
(1, '2026-04-21', 1135, 1145, 1125, 1140, 165000, 188100000),
(1, '2026-04-22', 1140, 1148, 1130, 1138, 120000, 136560000),
(1, '2026-04-23', 1138, 1142, 1125, 1130, 100000, 113000000),
(1, '2026-04-24', 1130, 1135, 1118, 1122, 85000, 95370000),
(1, '2026-04-27', 1122, 1130, 1115, 1128, 140000, 157920000),
(1, '2026-04-28', 1128, 1145, 1125, 1142, 210000, 239820000),
(1, '2026-04-29', 1142, 1155, 1138, 1150, 250000, 287500000);

-- Sample OHLC data for NICA (recent 15 days)
INSERT INTO ohlc_daily (stock_id, date, open, high, low, close, volume, turnover) VALUES
(2, '2026-04-09', 850, 860, 842, 855, 90000, 76950000),
(2, '2026-04-10', 855, 862, 848, 852, 75000, 63900000),
(2, '2026-04-13', 852, 868, 850, 865, 120000, 103800000),
(2, '2026-04-14', 865, 875, 860, 872, 135000, 117720000),
(2, '2026-04-15', 872, 885, 868, 880, 155000, 136400000),
(2, '2026-04-16', 880, 890, 875, 885, 110000, 97350000),
(2, '2026-04-17', 885, 892, 878, 888, 95000, 84360000),
(2, '2026-04-20', 888, 895, 882, 890, 100000, 89000000),
(2, '2026-04-21', 890, 898, 885, 895, 115000, 102925000),
(2, '2026-04-22', 895, 908, 892, 905, 180000, 162900000),
(2, '2026-04-23', 905, 912, 898, 902, 85000, 76670000),
(2, '2026-04-24', 902, 910, 895, 908, 130000, 117960000),
(2, '2026-04-27', 908, 920, 905, 918, 170000, 156060000),
(2, '2026-04-28', 918, 930, 915, 925, 200000, 185000000),
(2, '2026-04-29', 925, 935, 920, 930, 190000, 176700000);

-- Sample Market Index data
INSERT INTO market_indices (name, date, value, change, change_percent, turnover, volume) VALUES
('NEPSE', '2026-04-29', 2285.50, 15.30, 0.67, 5500000000, 12000000),
('NEPSE', '2026-04-28', 2270.20, -8.40, -0.37, 4800000000, 10500000),
('NEPSE', '2026-04-27', 2278.60, 12.10, 0.53, 5200000000, 11200000),
('NEPSE', '2026-04-24', 2266.50, -5.20, -0.23, 4500000000, 9800000),
('NEPSE', '2026-04-23', 2271.70, 8.90, 0.39, 4900000000, 10100000),
('SENSITIVE', '2026-04-29', 432.15, 2.85, 0.66, 3200000000, 8000000),
('BANKING', '2026-04-29', 1820.30, 12.50, 0.69, 2800000000, 7500000);

-- Sample Corporate Actions
INSERT INTO corporate_actions (stock_id, type, ratio, amount, book_close_date, announcement_date) VALUES
(1, 'dividend', NULL, 35.00, '2026-05-15', '2026-04-20'),
(1, 'bonus', 0.15, NULL, '2026-05-15', '2026-04-20'),
(2, 'dividend', NULL, 25.00, '2026-05-20', '2026-04-22'),
(3, 'bonus', 0.10, NULL, '2026-05-25', '2026-04-25');

-- Sample News
INSERT INTO news (title, source, url, published_at, sentiment, sentiment_score, related_symbols, summary) VALUES
('NABIL Bank Reports Record Quarterly Profit', 'ShareSansar', 'https://sharesansar.com/news/nabil-profit', '2026-04-28 10:00:00+05:45', 'positive', 0.85, ARRAY['NABIL'], 'Nabil Bank Limited has reported a record quarterly profit of Rs 2.5 billion for Q3 FY2026.'),
('NIC Asia Expands Branch Network', 'MeroLagani', 'https://merolagani.com/news/nica-expansion', '2026-04-27 14:00:00+05:45', 'positive', 0.72, ARRAY['NICA'], 'NIC Asia Bank has opened 5 new branches across Nepal, expanding its reach.'),
('Nepal Rastra Bank Tightens Monetary Policy', 'Nepali Times', 'https://nepalitimes.com/nrb-policy', '2026-04-26 09:00:00+05:45', 'negative', -0.45, ARRAY['NABIL','NICA','GBIME','SBL','HBL'], 'NRB has announced tighter monetary policy measures affecting the banking sector.'),
('Hydropower Sector Shows Strong Growth', 'ShareSansar', 'https://sharesansar.com/news/hydro-growth', '2026-04-25 11:00:00+05:45', 'positive', 0.68, ARRAY['NHPC','CHCL','BPCL','UPPER'], 'Hydropower companies report increased generation capacity and revenue growth.');
