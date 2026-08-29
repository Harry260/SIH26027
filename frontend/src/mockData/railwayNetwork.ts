// GeoJSON representation of major Indian Railways Golden Quadrilateral and High-Density Network Trunk Routes

export interface NetworkLine {
  id: string;
  name: string;
  coordinates: [number, number][]; // [lng, lat]
}

export const INDIAN_RAILWAYS_TRUNK_NETWORK: NetworkLine[] = [
  // 1. Delhi - Agra - Kanpur - Allahabad - Varanasi - Patna - Howrah (Eastern Corridor)
  {
    id: 'TRUNK-EAST-1',
    name: 'Northern / Eastern Trunk Mainline (NDLS - HWH)',
    coordinates: [
      [77.2189, 28.6143], // New Delhi
      [77.7126, 27.8974], // Aligarh
      [77.9944, 27.1591], // Agra Cantt
      [79.0345, 26.9821], // Tundla
      [80.3514, 26.4539], // Kanpur Central
      [81.8463, 25.4358], // Prayagraj (Allahabad)
      [82.9868, 25.3283], // Varanasi
      [83.1234, 25.2812], // Pt. Deen Dayal Upadhyaya
      [84.1432, 25.5562], // Buxar
      [85.1376, 25.6022], // Patna
      [86.0123, 25.2341], // Kiul
      [87.0123, 24.2341], // Jasidih
      [87.3123, 23.8341], // Asansol
      [87.8541, 23.2324], // Barddhaman
      [88.3426, 22.5839], // Howrah
    ],
  },
  // 2. Delhi - Mathura - Kota - Ratlam - Vadodara - Mumbai (Western Trunk)
  {
    id: 'TRUNK-WEST-1',
    name: 'Western Trunk Mainline (NDLS - MMCT)',
    coordinates: [
      [77.2189, 28.6143], // New Delhi
      [77.6737, 27.4924], // Mathura
      [76.8432, 26.5432], // Sawai Madhopur
      [75.8362, 25.1825], // Kota
      [75.0345, 23.3315], // Ratlam
      [73.1812, 22.3107], // Vadodara
      [72.8311, 21.1702], // Surat
      [72.9341, 20.3841], // Vapi
      [72.8193, 18.9696], // Mumbai Central
    ],
  },
  // 3. Delhi - Agra - Gwalior - Jhansi - Bhopal - Itarsi - Nagpur - Balharshah - Kazipet - Hyderabad / Chennai (North-South Trunk)
  {
    id: 'TRUNK-NS-1',
    name: 'Grand Trunk / North-South Mainline (NDLS - MAS)',
    coordinates: [
      [77.2189, 28.6143], // New Delhi
      [77.9944, 27.1591], // Agra Cantt
      [78.1828, 26.2183], // Gwalior
      [78.5685, 25.4484], // Jhansi
      [78.2341, 24.1841], // Bina
      [77.4126, 23.2685], // Bhopal
      [77.7541, 22.6124], // Itarsi
      [79.0882, 21.1458], // Nagpur
      [79.3451, 19.8451], // Balharshah
      [79.5432, 18.7432], // Ramagundam
      [79.5124, 17.9689], // Kazipet
      [80.6480, 16.5062], // Vijayawada
      [80.0432, 14.4432], // Nellore
      [79.9123, 13.7841], // Gudur
      [80.2707, 13.0827], // Chennai Central
    ],
  },
  // 4. Chennai - Katpadi - Jolarpettai - Bangarapet - Bengaluru (Southern Mainline)
  {
    id: 'TRUNK-SOUTH-1',
    name: 'Southern Trunk Route (MAS - SBC)',
    coordinates: [
      [80.2707, 13.0827], // Chennai Central
      [79.7037, 12.9841], // Arakkonam
      [79.1325, 12.9165], // Katpadi
      [78.5772, 12.5714], // Jolarpettai
      [78.2031, 12.8741], // Bangarapet
      [77.7512, 12.9941], // Krishnarajapuram
      [77.5684, 12.9784], // Bengaluru KSR
    ],
  },
  // 5. Mumbai - Pune - Solapur - Wadi - Raichur - Guntakal - Renigunta - Chennai (South-Western Corridor)
  {
    id: 'TRUNK-SW-1',
    name: 'South-Western Mainline (MMCT - MAS)',
    coordinates: [
      [72.8193, 18.9696], // Mumbai Central
      [73.0941, 19.1841], // Kalyan
      [73.4123, 18.7512], // Lonavala
      [73.8744, 18.5284], // Pune
      [74.5432, 18.1841], // Daund
      [75.9064, 17.6599], // Solapur
      [77.0123, 17.0541], // Wadi
      [77.3541, 16.2041], // Raichur
      [77.3712, 15.1741], // Guntakal
      [78.5432, 14.4841], // Cuddapah
      [79.5123, 13.6341], // Renigunta
      [80.2707, 13.0827], // Chennai Central
    ],
  },
  // 6. Howrah - Kharagpur - Cuttack - Bhubaneswar - Visakhapatnam - Vijayawada (East Coast Trunk)
  {
    id: 'TRUNK-EC-1',
    name: 'East Coast Mainline (HWH - BZA)',
    coordinates: [
      [88.3426, 22.5839], // Howrah
      [87.3214, 22.3391], // Kharagpur
      [86.9123, 21.4841], // Balasore
      [85.8793, 20.4625], // Cuttack
      [85.8245, 20.2961], // Bhubaneswar
      [85.0341, 19.3124], // Berhampur
      [83.2185, 17.6868], // Visakhapatnam
      [82.2341, 16.9841], // Samalkot
      [81.7841, 16.9841], // Rajahmundry
      [80.6480, 16.5062], // Vijayawada
    ],
  },
  // 7. Mumbai - Bhusawal - Nagpur - Raipur - Bilaspur - Rourkela - Tatanagar - Howrah (Central-Eastern Trunk)
  {
    id: 'TRUNK-MID-1',
    name: 'Mumbai - Howrah via Nagpur Trunk',
    coordinates: [
      [72.8193, 18.9696], // Mumbai
      [73.7841, 19.9975], // Nashik Road
      [74.5432, 20.5432], // Manmad
      [75.7841, 21.0451], // Bhusawal
      [77.0123, 20.7041], // Akola
      [77.7541, 20.9341], // Badnera
      [79.0882, 21.1458], // Nagpur
      [80.1841, 21.4541], // Gondia
      [81.2841, 21.1841], // Durg
      [81.6296, 21.2514], // Raipur
      [82.1432, 22.0841], // Bilaspur
      [83.3841, 21.8941], // Raigarh
      [84.0123, 21.8451], // Jharsuguda
      [84.8541, 22.2241], // Rourkela
      [85.6432, 22.6841], // Chakradharpur
      [86.2029, 22.8046], // Tatanagar
      [87.3214, 22.3391], // Kharagpur
      [88.3426, 22.5839], // Howrah
    ],
  },
];

