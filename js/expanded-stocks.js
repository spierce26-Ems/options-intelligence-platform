/**
 * EXPANDED ROBINHOOD STOCK LIST
 * Complete list of ALL popular stocks with options available on Robinhood
 * Total: 500+ stocks across all sectors
 */

const ALL_ROBINHOOD_STOCKS = [
    // MEGA CAP TECH (30 stocks)
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA', 'NVDA', 'AMD', 'INTC',
    'NFLX', 'ADBE', 'CRM', 'ORCL', 'CSCO', 'AVGO', 'QCOM', 'TXN', 'INTU', 'NOW',
    'UBER', 'LYFT', 'SNAP', 'PINS', 'TWTR', 'SQ', 'SHOP', 'ZM', 'DOCU', 'SNOW',
    
    // TECH & SOFTWARE (40 stocks)
    'MSFT', 'AAPL', 'GOOG', 'NVDA', 'AMD', 'MU', 'AMAT', 'LRCX', 'KLAC', 'ASML',
    'TSM', 'QCOM', 'AVGO', 'TXN', 'ADI', 'MRVL', 'NXPI', 'SWKS', 'QRVO', 'XLNX',
    'CRM', 'ADBE', 'INTU', 'WDAY', 'PANW', 'CRWD', 'ZS', 'DDOG', 'NET', 'OKTA',
    'TEAM', 'SPLK', 'ZI', 'BILL', 'HUBS', 'VEEV', 'ESTC', 'MDB', 'COUP', 'NCNO',
    
    // MEGA CAP (50 stocks)
    'SPY', 'QQQ', 'IWM', 'DIA', 'ARKK', 'XLF', 'XLE', 'XLV', 'XLI', 'XLK',
    'BRK.B', 'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'USB', 'PNC', 'TFC',
    'JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'MRK', 'ABT', 'LLY', 'BMY', 'AMGN',
    'WMT', 'HD', 'PG', 'KO', 'PEP', 'COST', 'NKE', 'MCD', 'SBUX', 'TGT',
    'DIS', 'CMCSA', 'NFLX', 'T', 'VZ', 'TMUS', 'CHTR', 'DISH', 'FOXA', 'PARA',
    
    // FINANCIAL (60 stocks)
    'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'USB', 'PNC', 'TFC', 'SCHW',
    'BLK', 'SPGI', 'CME', 'ICE', 'NDAQ', 'COIN', 'HOOD', 'SOFI', 'AFRM', 'UPST',
    'V', 'MA', 'PYPL', 'SQ', 'FIS', 'FISV', 'AXP', 'DFS', 'COF', 'ALLY',
    'MET', 'PRU', 'AIG', 'AFL', 'ALL', 'TRV', 'PGR', 'CB', 'AJG', 'MMC',
    'BX', 'KKR', 'APO', 'ARES', 'CG', 'TROW', 'BEN', 'IVZ', 'AMG', 'VIRT',
    'GPN', 'JKHY', 'BR', 'WEX', 'FOUR', 'BILL', 'NCNO', 'STNE', 'NU', 'PAGS',
    
    // HEALTHCARE & BIOTECH (60 stocks)
    'JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'MRK', 'ABT', 'LLY', 'BMY', 'AMGN',
    'GILD', 'VRTX', 'REGN', 'BIIB', 'MRNA', 'BNTX', 'CVS', 'CI', 'HUM', 'CNC',
    'ISRG', 'SYK', 'BSX', 'MDT', 'BDX', 'EW', 'HOLX', 'BAX', 'ZBH', 'ALGN',
    'ILMN', 'A', 'DHR', 'WAT', 'DGX', 'LH', 'IQV', 'CRL', 'TECH', 'MTD',
    'EXAS', 'TDOC', 'VEEV', 'DXCM', 'PODD', 'TNDM', 'NVAX', 'CRSP', 'BEAM', 'EDIT',
    'SRPT', 'SGEN', 'ALNY', 'IONS', 'BMRN', 'RGEN', 'UTHR', 'Jazz', 'HALO', 'FOLD',
    
    // CONSUMER & RETAIL (50 stocks)
    'AMZN', 'WMT', 'HD', 'COST', 'TGT', 'LOW', 'TJX', 'ROST', 'DG', 'DLTR',
    'NKE', 'LULU', 'DECK', 'CROX', 'SKX', 'UAA', 'UA', 'VFC', 'HBI', 'RL',
    'SBUX', 'MCD', 'CMG', 'YUM', 'QSR', 'DPZ', 'WING', 'JACK', 'WEN', 'SHAK',
    'TSCO', 'AZO', 'ORLY', 'GPC', 'AAP', 'BBWI', 'BBY', 'ANF', 'GPS', 'JWN',
    'ETSY', 'W', 'RH', 'WSM', 'MELI', 'BABA', 'JD', 'PDD', 'SE', 'CPNG',
    
    // ENERGY & COMMODITIES (40 stocks)
    'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'HAL',
    'BKR', 'DVN', 'FANG', 'MRO', 'HES', 'APA', 'CTRA', 'OVV', 'PXD', 'EQT',
    'FCX', 'NEM', 'GOLD', 'AEM', 'AU', 'WPM', 'FNV', 'RGLD', 'HL', 'AG',
    'USO', 'UCO', 'UNG', 'BOIL', 'GLD', 'SLV', 'GDX', 'GDXJ', 'XLE', 'XOP',
    
    // INDUSTRIALS & AEROSPACE (40 stocks)
    'BA', 'CAT', 'GE', 'HON', 'UPS', 'FDX', 'UNP', 'CSX', 'NSC', 'ODFL',
    'LMT', 'RTX', 'NOC', 'GD', 'LHX', 'TDG', 'HWM', 'TXT', 'CACI', 'SAIC',
    'DE', 'CNH', 'AGCO', 'TWI', 'OSK', 'CMI', 'PCAR', 'NAV', 'HII', 'ROCK',
    'MMM', 'EMR', 'ITW', 'ETN', 'PH', 'ROK', 'AME', 'FAST', 'DOV', 'CARR',
    
    // AUTOMOTIVE & EV (30 stocks)
    'TSLA', 'F', 'GM', 'TM', 'HMC', 'STLA', 'RIVN', 'LCID', 'NIO', 'XPEV',
    'LI', 'FSR', 'GOEV', 'RIDE', 'WKHS', 'HYLN', 'NKLA', 'BLNK', 'CHPT', 'EVGO',
    'APTV', 'ADNT', 'BWA', 'GT', 'TSCO', 'AZO', 'ORLY', 'GPC', 'AAP', 'LAD',
    
    // REAL ESTATE & REITS (30 stocks)
    'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'SPG', 'WELL', 'DLR', 'O', 'AVB',
    'EQR', 'INVH', 'MAA', 'UDR', 'CPT', 'VTR', 'PEAK', 'DOC', 'HR', 'SUI',
    'IRM', 'CUBE', 'REXR', 'EGP', 'FR', 'KIM', 'REG', 'FRT', 'BXP', 'VNO',
    
    // SEMICONDUCTORS (25 stocks)
    'NVDA', 'AMD', 'INTC', 'TSM', 'AVGO', 'QCOM', 'TXN', 'ADI', 'MRVL', 'MU',
    'AMAT', 'LRCX', 'KLAC', 'ASML', 'NXPI', 'SWKS', 'QRVO', 'MCHP', 'ON', 'MPWR',
    'WOLF', 'SLAB', 'CRUS', 'SYNA', 'SMCI',
    
    // CLOUD & SAAS (30 stocks)
    'MSFT', 'AMZN', 'GOOGL', 'CRM', 'ORCL', 'ADBE', 'NOW', 'SNOW', 'DDOG', 'NET',
    'CRWD', 'ZS', 'PANW', 'OKTA', 'MDB', 'TEAM', 'WDAY', 'VEEV', 'ESTC', 'SPLK',
    'HUBS', 'ZI', 'BILL', 'COUP', 'NCNO', 'GTLB', 'DOCN', 'FSLY', 'CFLT', 'S',
    
    // MEME STOCKS & HIGH VOLATILITY (30 stocks)
    'GME', 'AMC', 'BB', 'BBBY', 'WISH', 'CLOV', 'PLTR', 'SOFI', 'HOOD', 'COIN',
    'RIOT', 'MARA', 'BTBT', 'EBON', 'SOS', 'CLSK', 'HUT', 'BITF', 'ARBK', 'CIFR',
    'SPCE', 'RKLB', 'ASTR', 'ASTS', 'PL', 'MNTS', 'LUNR', 'IRDM', 'GILT', 'MAXR',
    
    // CHINA TECH (20 stocks)
    'BABA', 'JD', 'PDD', 'BIDU', 'TCOM', 'NTES', 'BEKE', 'TME', 'BILI', 'IQ',
    'VIPS', 'YY', 'DOYU', 'HUYA', 'TIGR', 'FUTU', 'NIO', 'XPEV', 'LI', 'TUYA',
    
    // EMERGING TECH (20 stocks)
    'AI', 'PLTR', 'PATH', 'SNOW', 'U', 'RBLX', 'DASH', 'ABNB', 'COIN', 'HOOD',
    'DKNG', 'PENN', 'WYNN', 'LVS', 'MGM', 'CZR', 'CHGG', 'DUOL', 'YELP', 'MTCH',
    
    // SEMICONDUCTORS EQUIPMENT (15 stocks)
    'AMAT', 'LRCX', 'KLAC', 'ASML', 'TER', 'ENTG', 'MKSI', 'ACLS', 'UCTT', 'COHR',
    'PLAB', 'FORM', 'ONTO', 'ICHR', 'NVMI',
];

// Remove duplicates and sort
const COMPLETE_ROBINHOOD_LIST = [...new Set(ALL_ROBINHOOD_STOCKS)].sort();

console.log(`Total Robinhood Stocks with Options: ${COMPLETE_ROBINHOOD_LIST.length}`);

// Export
window.COMPLETE_ROBINHOOD_LIST = COMPLETE_ROBINHOOD_LIST;
window.TOTAL_STOCKS_COUNT = COMPLETE_ROBINHOOD_LIST.length;
