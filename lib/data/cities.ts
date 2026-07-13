// The cities Companio serves, plus the ones it intends to.
//
// A city is "live" when at least one companion actually lists there. Mumbai and
// Indore are live. The rest are listed because members search for them and we
// want to hear about it — the explore grid shows an honest empty state and
// invites them to apply as the first companion, rather than showing them people
// who are not there.
//
// This file used to carry a `members` count per city — 2,300 for Mumbai, 500 for
// Chandigarh, and so on. Every one was invented, and `localizeArea()` re-labelled
// the same fourteen Mumbai profiles with each city's neighbourhood names so that
// every city "felt served". Both are gone. `liveCities()` is derived from the
// companion catalogue, so it cannot drift from the truth.

export interface City {
  id: string;
  name: string;
  state: string;
  /** Neighbourhoods, used for filters and for the companion application form. */
  areas: string[];
  lat: number; // city-centre latitude (map view only — never a person's location)
  lng: number; // city-centre longitude
}

export const CITIES: City[] = [
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, areas: ['Bandra', 'Colaba', 'Andheri', 'Dadar', 'Powai', 'Juhu', 'Lower Parel', 'Matunga', 'Versova', 'Worli', 'Chembur', 'Malad', 'Fort', 'Khar'] },
  { id: 'indore', name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577, areas: ['Vijay Nagar', 'Rajwada', 'New Palasia', 'Bhawarkuan', 'Saket Nagar', 'Geeta Bhawan', 'Khajrana', 'Nipania', 'Annapurna', 'Rau', 'Sudama Nagar', 'Mhow Naka', 'Scheme No. 54', 'Silicon City'] },
  { id: 'delhi', name: 'Delhi NCR', state: 'Delhi', lat: 28.6139, lng: 77.2090, areas: ['Hauz Khas', 'Connaught Place', 'Saket', 'Dwarka', 'Gurugram', 'Noida', 'Lajpat Nagar', 'Vasant Kunj', 'Karol Bagh', 'Mayur Vihar', 'Rohini', 'Greater Kailash', 'Chandni Chowk', 'Janakpuri'] },
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, areas: ['Indiranagar', 'Koramangala', 'Jayanagar', 'Whitefield', 'HSR Layout', 'Malleshwaram', 'JP Nagar', 'Basavanagudi', 'Yelahanka', 'BTM Layout', 'Rajajinagar', 'Hebbal', 'MG Road', 'Banashankari'] },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, areas: ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Madhapur', 'Secunderabad', 'Kukatpally', 'Begumpet', 'Himayatnagar', 'Kondapur', 'Manikonda', 'Charminar', 'Ameerpet', 'Miyapur', 'Uppal'] },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, areas: ['Adyar', 'T. Nagar', 'Mylapore', 'Anna Nagar', 'Velachery', 'Besant Nagar', 'Nungambakkam', 'Alwarpet', 'Porur', 'Tambaram', 'Kilpauk', 'Egmore', 'OMR', 'Guindy'] },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, areas: ['Park Street', 'Salt Lake', 'Ballygunge', 'New Town', 'Alipore', 'Gariahat', 'Behala', 'Jadavpur', 'Howrah', 'Dum Dum', 'Esplanade', 'Tollygunge', 'Rajarhat', 'Shyambazar'] },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, areas: ['Koregaon Park', 'Viman Nagar', 'Baner', 'Kothrud', 'Aundh', 'Hinjawadi', 'Camp', 'Deccan', 'Hadapsar', 'Wakad', 'Kalyani Nagar', 'Shivajinagar', 'Magarpatta', 'Pashan'] },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, areas: ['Satellite', 'Navrangpura', 'Bodakdev', 'Maninagar', 'Vastrapur', 'Prahlad Nagar', 'CG Road', 'Thaltej', 'Paldi', 'Gota', 'Chandkheda', 'Bopal', 'Naranpura', 'SG Highway'] },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, areas: ['C-Scheme', 'Malviya Nagar', 'Vaishali Nagar', 'Mansarovar', 'Raja Park', 'Bani Park', 'Jagatpura', 'Tonk Road', 'Civil Lines', 'Jhotwara', 'Sodala', 'Amer Road', 'Sanganer', 'Bapu Nagar'] },
  { id: 'chandigarh', name: 'Chandigarh', state: 'Punjab/Haryana', lat: 30.7333, lng: 76.7794, areas: ['Sector 17', 'Sector 35', 'Panchkula', 'Mohali', 'Sector 22', 'Sector 8', 'Manimajra', 'Zirakpur', 'Sector 43', 'Sector 15', 'Industrial Area', 'Sector 26', 'New Chandigarh', 'Kharar'] },
];

export const DEFAULT_CITY_ID = 'mumbai';

export function getCity(id: string): City {
  return CITIES.find((c) => c.id === id) ?? CITIES[0];
}

/** Match a companion's `city` name (e.g. "Mumbai") back to its City id. */
export function cityIdFromName(name: string): string | undefined {
  return CITIES.find((c) => c.name.toLowerCase() === name.trim().toLowerCase())?.id;
}
