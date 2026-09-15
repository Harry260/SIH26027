import { Station, RouteCorridor } from '../types';

export const MOCK_STATIONS: Station[] = [
  // Northern Railway (NR)
  { id: 1, code: 'NDLS', name: 'New Delhi', division: 'Delhi', state: 'Delhi', zone: 'NR', lat: 28.6143, lng: 77.2189, isHub: true },
  { id: 2, code: 'DLI', name: 'Old Delhi Junction', division: 'Delhi', state: 'Delhi', zone: 'NR', lat: 28.6616, lng: 77.2285, isHub: true },
  { id: 3, code: 'NZM', name: 'Hazrat Nizamuddin', division: 'Delhi', state: 'Delhi', zone: 'NR', lat: 28.5886, lng: 77.2534, isHub: true },
  { id: 4, code: 'ANVT', name: 'Anand Vihar Terminal', division: 'Delhi', state: 'Delhi', zone: 'NR', lat: 28.6475, lng: 77.3158, isHub: false },
  { id: 5, code: 'ASR', name: 'Amritsar Junction', division: 'Firozpur', state: 'Punjab', zone: 'NR', lat: 31.6340, lng: 74.8723, isHub: true },
  { id: 6, code: 'LDH', name: 'Ludhiana Junction', division: 'Firozpur', state: 'Punjab', zone: 'NR', lat: 30.9010, lng: 75.8573, isHub: false },
  { id: 7, code: 'UMB', name: 'Ambala Cantt Junction', division: 'Ambala', state: 'Haryana', zone: 'NR', lat: 30.3340, lng: 76.8406, isHub: true },
  { id: 8, code: 'LKO', name: 'Lucknow Charbagh', division: 'Lucknow NR', state: 'Uttar Pradesh', zone: 'NR', lat: 26.8322, lng: 80.9202, isHub: true },
  { id: 9, code: 'BSB', name: 'Varanasi Junction', division: 'Lucknow NR', state: 'Uttar Pradesh', zone: 'NR', lat: 25.3283, lng: 82.9868, isHub: true },
  { id: 10, code: 'JAT', name: 'Jammu Tawi', division: 'Firozpur', state: 'Jammu & Kashmir', zone: 'NR', lat: 32.7050, lng: 74.8797, isHub: true },
  { id: 11, code: 'SVDK', name: 'SMVD Katra', division: 'Firozpur', state: 'Jammu & Kashmir', zone: 'NR', lat: 32.9902, lng: 74.9312, isHub: false },
  { id: 12, code: 'CDG', name: 'Chandigarh Junction', division: 'Ambala', state: 'Chandigarh', zone: 'NR', lat: 30.7046, lng: 76.8248, isHub: true },

  // North Central Railway (NCR)
  { id: 13, code: 'AGC', name: 'Agra Cantt', division: 'Agra', state: 'Uttar Pradesh', zone: 'NCR', lat: 27.1591, lng: 77.9944, isHub: true },
  { id: 14, code: 'CNB', name: 'Kanpur Central', division: 'Prayagraj', state: 'Uttar Pradesh', zone: 'NCR', lat: 26.4539, lng: 80.3514, isHub: true },
  { id: 15, code: 'PRYJ', name: 'Prayagraj Junction', division: 'Prayagraj', state: 'Uttar Pradesh', zone: 'NCR', lat: 25.4497, lng: 81.8288, isHub: true },
  { id: 16, code: 'JHS', name: 'VGL Jhansi Junction', division: 'Jhansi', state: 'Uttar Pradesh', zone: 'NCR', lat: 25.4484, lng: 78.5685, isHub: true },
  { id: 17, code: 'GWL', name: 'Gwalior Junction', division: 'Jhansi', state: 'Madhya Pradesh', zone: 'NCR', lat: 26.2166, lng: 78.1887, isHub: false },
  { id: 18, code: 'MTJ', name: 'Mathura Junction', division: 'Agra', state: 'Uttar Pradesh', zone: 'NCR', lat: 27.4924, lng: 77.6737, isHub: false },

  // Eastern Railway (ER) & South Eastern Railway (SER)
  { id: 19, code: 'HWH', name: 'Howrah Junction', division: 'Howrah', state: 'West Bengal', zone: 'ER', lat: 22.5839, lng: 88.3426, isHub: true },
  { id: 20, code: 'SDAH', name: 'Sealdah', division: 'Sealdah', state: 'West Bengal', zone: 'ER', lat: 22.5697, lng: 88.3712, isHub: true },
  { id: 21, code: 'ASN', name: 'Asansol Junction', division: 'Asansol', state: 'West Bengal', zone: 'ER', lat: 23.6889, lng: 86.9661, isHub: false },
  { id: 22, code: 'KGP', name: 'Kharagpur Junction', division: 'Kharagpur', state: 'West Bengal', zone: 'SER', lat: 22.3392, lng: 87.3256, isHub: true },
  { id: 23, code: 'TATA', name: 'Tatanagar Junction', division: 'Chakradharpur', state: 'Jharkhand', zone: 'SER', lat: 22.7667, lng: 86.2029, isHub: true },
  { id: 24, code: 'RNC', name: 'Ranchi Junction', division: 'Ranchi', state: 'Jharkhand', zone: 'SER', lat: 23.3441, lng: 85.3240, isHub: true },

  // East Central Railway (ECR)
  { id: 25, code: 'PNBE', name: 'Patna Junction', division: 'Danapur', state: 'Bihar', zone: 'ECR', lat: 25.6022, lng: 85.1376, isHub: true },
  { id: 26, code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya Junction', division: 'Pt. Deen Dayal Upadhyaya', state: 'Uttar Pradesh', zone: 'ECR', lat: 25.2818, lng: 83.1189, isHub: true },
  { id: 27, code: 'GAYA', name: 'Gaya Junction', division: 'Pt. Deen Dayal Upadhyaya', state: 'Bihar', zone: 'ECR', lat: 24.8052, lng: 85.0064, isHub: false },
  { id: 28, code: 'DHN', name: 'Dhanbad Junction', division: 'Dhanbad', state: 'Jharkhand', zone: 'ECR', lat: 23.7957, lng: 86.4304, isHub: true },
  { id: 29, code: 'MFP', name: 'Muzaffarpur Junction', division: 'Sonpur', state: 'Bihar', zone: 'ECR', lat: 26.1209, lng: 85.3906, isHub: false },

  // Western Railway (WR)
  { id: 30, code: 'MMCT', name: 'Mumbai Central', division: 'Mumbai WR', state: 'Maharashtra', zone: 'WR', lat: 18.9696, lng: 72.8193, isHub: true },
  { id: 31, code: 'BDTS', name: 'Bandra Terminus', division: 'Mumbai WR', state: 'Maharashtra', zone: 'WR', lat: 19.0620, lng: 72.8407, isHub: false },
  { id: 32, code: 'ST', name: 'Surat', division: 'Mumbai WR', state: 'Gujarat', zone: 'WR', lat: 21.2052, lng: 72.8408, isHub: true },
  { id: 33, code: 'BRC', name: 'Vadodara Junction', division: 'Vadodara', state: 'Gujarat', zone: 'WR', lat: 22.3107, lng: 73.1812, isHub: true },
  { id: 34, code: 'ADI', name: 'Ahmedabad Junction', division: 'Ahmedabad', state: 'Gujarat', zone: 'WR', lat: 23.0225, lng: 72.5714, isHub: true },
  { id: 35, code: 'RTM', name: 'Ratlam Junction', division: 'Ratlam', state: 'Madhya Pradesh', zone: 'WR', lat: 23.3364, lng: 75.0373, isHub: true },
  { id: 36, code: 'RJT', name: 'Rajkot Junction', division: 'Rajkot', state: 'Gujarat', zone: 'WR', lat: 22.3082, lng: 70.8022, isHub: false },

  // Central Railway (CR)
  { id: 37, code: 'CSMT', name: 'Mumbai CSMT', division: 'Mumbai CR', state: 'Maharashtra', zone: 'CR', lat: 18.9401, lng: 72.8353, isHub: true },
  { id: 38, code: 'PUNE', name: 'Pune Junction', division: 'Pune', state: 'Maharashtra', zone: 'CR', lat: 18.5284, lng: 73.8744, isHub: true },
  { id: 39, code: 'NGP', name: 'Nagpur Junction', division: 'Nagpur CR', state: 'Maharashtra', zone: 'CR', lat: 21.1524, lng: 79.0888, isHub: true },
  { id: 40, code: 'BSL', name: 'Bhusaval Junction', division: 'Bhusawal', state: 'Maharashtra', zone: 'CR', lat: 21.0455, lng: 75.7885, isHub: true },
  { id: 41, code: 'SUR', name: 'Solapur Junction', division: 'Solapur', state: 'Maharashtra', zone: 'CR', lat: 17.6599, lng: 75.9064, isHub: false },

  // West Central Railway (WCR)
  { id: 42, code: 'BPL', name: 'Bhopal Junction', division: 'Bhopal', state: 'Madhya Pradesh', zone: 'WCR', lat: 23.2685, lng: 77.4126, isHub: true },
  { id: 43, code: 'RKMP', name: 'Rani Kamlapati', division: 'Bhopal', state: 'Madhya Pradesh', zone: 'WCR', lat: 23.2081, lng: 77.4377, isHub: false },
  { id: 44, code: 'JBP', name: 'Jabalpur Junction', division: 'Jabalpur', state: 'Madhya Pradesh', zone: 'WCR', lat: 23.1600, lng: 79.9577, isHub: true },
  { id: 45, code: 'KOTA', name: 'Kota Junction', division: 'Kota', state: 'Rajasthan', zone: 'WCR', lat: 25.2138, lng: 75.8648, isHub: true },
  { id: 46, code: 'ET', name: 'Itarsi Junction', division: 'Bhopal', state: 'Madhya Pradesh', zone: 'WCR', lat: 22.6122, lng: 77.7634, isHub: true },

  // Southern Railway (SR) & South Western Railway (SWR)
  { id: 47, code: 'MAS', name: 'Chennai Central', division: 'Chennai', state: 'Tamil Nadu', zone: 'SR', lat: 13.0827, lng: 80.2707, isHub: true },
  { id: 48, code: 'MS', name: 'Chennai Egmore', division: 'Chennai', state: 'Tamil Nadu', zone: 'SR', lat: 13.0797, lng: 80.2612, isHub: false },
  { id: 49, code: 'CBE', name: 'Coimbatore Junction', division: 'Salem', state: 'Tamil Nadu', zone: 'SR', lat: 11.0006, lng: 76.9672, isHub: true },
  { id: 50, code: 'MDU', name: 'Madurai Junction', division: 'Madurai', state: 'Tamil Nadu', zone: 'SR', lat: 9.9178, lng: 78.1130, isHub: false },
  { id: 51, code: 'TVC', name: 'Thiruvananthapuram Central', division: 'Thiruvananthapuram', state: 'Kerala', zone: 'SR', lat: 8.4875, lng: 76.9525, isHub: true },
  { id: 52, code: 'ERS', name: 'Ernakulam Junction', division: 'Thiruvananthapuram', state: 'Kerala', zone: 'SR', lat: 9.9676, lng: 76.2917, isHub: true },
  { id: 53, code: 'SBC', name: 'Bengaluru KSR', division: 'Bengaluru', state: 'Karnataka', zone: 'SWR', lat: 12.9784, lng: 77.5684, isHub: true },
  { id: 54, code: 'YPR', name: 'Yesvantpur Junction', division: 'Bengaluru', state: 'Karnataka', zone: 'SWR', lat: 13.0238, lng: 77.5503, isHub: false },
  { id: 55, code: 'UBL', name: 'SSS Hubballi Junction', division: 'Hubballi', state: 'Karnataka', zone: 'SWR', lat: 15.3503, lng: 75.1480, isHub: true },
  { id: 56, code: 'MYS', name: 'Mysuru Junction', division: 'Mysuru', state: 'Karnataka', zone: 'SWR', lat: 12.3164, lng: 76.6496, isHub: false },

  // South Central Railway (SCR) & East Coast Railway (ECoR)
  { id: 57, code: 'SC', name: 'Secunderabad Junction', division: 'Secunderabad', state: 'Telangana', zone: 'SCR', lat: 17.4334, lng: 78.5016, isHub: true },
  { id: 58, code: 'HYB', name: 'Hyderabad Deccan', division: 'Hyderabad', state: 'Telangana', zone: 'SCR', lat: 17.3924, lng: 78.4697, isHub: true },
  { id: 59, code: 'BZA', name: 'Vijayawada Junction', division: 'Vijayawada', state: 'Andhra Pradesh', zone: 'SCR', lat: 16.5186, lng: 80.6200, isHub: true },
  { id: 60, code: 'VSKP', name: 'Visakhapatnam Junction', division: 'Waltair', state: 'Andhra Pradesh', zone: 'ECoR', lat: 17.7208, lng: 83.2844, isHub: true },
  { id: 61, code: 'BBS', name: 'Bhubaneswar', division: 'Khurda Road', state: 'Odisha', zone: 'ECoR', lat: 20.2648, lng: 85.8436, isHub: true },
  { id: 62, code: 'PURI', name: 'Puri', division: 'Khurda Road', state: 'Odisha', zone: 'ECoR', lat: 19.8080, lng: 85.8315, isHub: false },

  // North Western Railway (NWR) & North Eastern Railway (NER)
  { id: 63, code: 'JP', name: 'Jaipur Junction', division: 'Jaipur', state: 'Rajasthan', zone: 'NWR', lat: 26.9196, lng: 75.7878, isHub: true },
  { id: 64, code: 'JU', name: 'Jodhpur Junction', division: 'Jodhpur', state: 'Rajasthan', zone: 'NWR', lat: 26.2847, lng: 73.0189, isHub: true },
  { id: 65, code: 'AII', name: 'Ajmer Junction', division: 'Ajmer', state: 'Rajasthan', zone: 'NWR', lat: 26.4526, lng: 74.6399, isHub: false },
  { id: 66, code: 'GKP', name: 'Gorakhpur Junction', division: 'Lucknow NER', state: 'Uttar Pradesh', zone: 'NER', lat: 26.7606, lng: 83.3732, isHub: true },

  // South East Central Railway (SECR) & Northeast Frontier Railway (NFR)
  { id: 67, code: 'R', name: 'Raipur Junction', division: 'Raipur', state: 'Chhattisgarh', zone: 'SECR', lat: 21.2570, lng: 81.6296, isHub: true },
  { id: 68, code: 'BSP', name: 'Bilaspur Junction', division: 'Bilaspur', state: 'Chhattisgarh', zone: 'SECR', lat: 22.0805, lng: 82.1642, isHub: true },
  { id: 69, code: 'GHY', name: 'Guwahati', division: 'Lumding', state: 'Assam', zone: 'NFR', lat: 26.1827, lng: 91.7513, isHub: true },
  { id: 70, code: 'NJP', name: 'New Jalpaiguri Junction', division: 'Katihar', state: 'West Bengal', zone: 'NFR', lat: 26.6854, lng: 88.4429, isHub: true },
  { id: 71, code: 'MAO', name: 'Madgaon Junction', division: 'Karwar', state: 'Goa', zone: 'KR', lat: 15.2736, lng: 73.9781, isHub: true },
];

export const SUPPORTED_CORRIDORS: RouteCorridor[] = [
  {
    id: 101,
    code: 'NDLS_AGC',
    fromCode: 'NDLS',
    toCode: 'AGC',
    name: 'New Delhi ↔ Agra Cantt High-Density Corridor',
    zone: 'Northern / NCR Railway',
    distance_km: 195,
    total_blocks: 20,
    description: 'High-speed quadruple automatic block signaling section powering Gatimaan, Vande Bharat & Bhopal Shatabdi routes.',
  },
  {
    id: 102,
    code: 'MAS_SBC',
    fromCode: 'MAS',
    toCode: 'SBC',
    name: 'Chennai Central ↔ Bengaluru City Corridor',
    zone: 'Southern / SWR Railway',
    distance_km: 359,
    total_blocks: 22,
    description: 'Premier electrified double line corridor with intensive passenger express & intercity traffic.',
  },
  {
    id: 103,
    code: 'MMCT_BRC',
    fromCode: 'MMCT',
    toCode: 'BRC',
    name: 'Mumbai Central ↔ Vadodara Junction Mainline',
    zone: 'Western Railway',
    distance_km: 392,
    total_blocks: 24,
    description: 'Dedicated automatic block territory on Western trunk line connecting Mumbai commercial hub to Gujarat.',
  },
  {
    id: 104,
    code: 'NDLS_CNB',
    fromCode: 'NDLS',
    toCode: 'CNB',
    name: 'New Delhi ↔ Kanpur Central Trunk Line',
    zone: 'Northern / NCR Railway',
    distance_km: 440,
    total_blocks: 26,
    description: 'Core trunk line of Indian Railways carrying Howrah Rajdhani, Prayagraj Express, and dense freight rakes.',
  },
  {
    id: 105,
    code: 'HWH_PNBE',
    fromCode: 'HWH',
    toCode: 'PNBE',
    name: 'Howrah ↔ Patna Grand Chord Link',
    zone: 'Eastern / ECR Railway',
    distance_km: 535,
    total_blocks: 28,
    description: 'Heavy traffic corridor connecting Kolkata with Bihar capital through Asansol industrial belt.',
  },
  {
    id: 106,
    code: 'CSMT_PUNE',
    fromCode: 'CSMT',
    toCode: 'PUNE',
    name: 'Mumbai CSMT ↔ Pune Bhor Ghat Section',
    zone: 'Central Railway',
    distance_km: 192,
    total_blocks: 18,
    description: 'Scenic yet steep mountain grade corridor with specialized banker locomotives and dense suburban traffic.',
  },
  {
    id: 107,
    code: 'SC_BZA',
    fromCode: 'SC',
    toCode: 'BZA',
    name: 'Secunderabad ↔ Vijayawada High-Speed Section',
    zone: 'South Central Railway',
    distance_km: 313,
    total_blocks: 22,
    description: 'Electrified dual line linking Hyderabad IT hub to coastal Andhra Pradesh with automatic signalling.',
  }
];

export function findStation(code: string): Station | undefined {
  return MOCK_STATIONS.find(
    (s) => s.code.toUpperCase() === code.trim().toUpperCase()
  );
}

export function findStationById(id: number): Station | undefined {
  return MOCK_STATIONS.find((s) => s.id === id);
}
