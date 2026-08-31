export type CityPreset = {
  id: string
  name: string
  nameAr: string
  lat: number
  lon: number
  timeZone: string
  country: string
}

/**
 * Bundled city presets — browser-only, no network.
 * Covers major Muslim populations and global hubs. Coordinates are city centres
 * (approx, ~5km precision is sufficient for prayer-time accuracy <1 min).
 * TimeZone is IANA; kept in sync with lat/lon manually.
 */
export const CITIES: CityPreset[] = [
  // Saudi Arabia
  { id: 'riyadh', name: 'Riyadh', nameAr: 'الرياض', lat: 24.7136, lon: 46.6753, timeZone: 'Asia/Riyadh', country: 'SA' },
  { id: 'makkah', name: 'Makkah', nameAr: 'مكة', lat: 21.3891, lon: 39.8579, timeZone: 'Asia/Riyadh', country: 'SA' },
  { id: 'madinah', name: 'Madinah', nameAr: 'المدينة', lat: 24.4672, lon: 39.6111, timeZone: 'Asia/Riyadh', country: 'SA' },
  { id: 'jeddah', name: 'Jeddah', nameAr: 'جدة', lat: 21.5433, lon: 39.1728, timeZone: 'Asia/Riyadh', country: 'SA' },
  { id: 'dammam', name: 'Dammam', nameAr: 'الدمام', lat: 26.4207, lon: 50.0888, timeZone: 'Asia/Riyadh', country: 'SA' },
  { id: 'abha', name: 'Abha', nameAr: 'أبها', lat: 18.2164, lon: 42.5053, timeZone: 'Asia/Riyadh', country: 'SA' },
  // Gulf
  { id: 'dubai', name: 'Dubai', nameAr: 'دبي', lat: 25.2048, lon: 55.2708, timeZone: 'Asia/Dubai', country: 'AE' },
  { id: 'abu-dhabi', name: 'Abu Dhabi', nameAr: 'أبوظبي', lat: 24.4539, lon: 54.3773, timeZone: 'Asia/Dubai', country: 'AE' },
  { id: 'doha', name: 'Doha', nameAr: 'الدوحة', lat: 25.2854, lon: 51.531, timeZone: 'Asia/Qatar', country: 'QA' },
  { id: 'kuwait-city', name: 'Kuwait City', nameAr: 'مدينة الكويت', lat: 29.3759, lon: 47.9774, timeZone: 'Asia/Kuwait', country: 'KW' },
  { id: 'manama', name: 'Manama', nameAr: 'المنامة', lat: 26.2235, lon: 50.5876, timeZone: 'Asia/Bahrain', country: 'BH' },
  { id: 'muscat', name: 'Muscat', nameAr: 'مسقط', lat: 23.588, lon: 58.3829, timeZone: 'Asia/Muscat', country: 'OM' },
  // Levant & Egypt
  { id: 'cairo', name: 'Cairo', nameAr: 'القاهرة', lat: 30.0444, lon: 31.2357, timeZone: 'Africa/Cairo', country: 'EG' },
  { id: 'alexandria', name: 'Alexandria', nameAr: 'الإسكندرية', lat: 31.2001, lon: 29.9187, timeZone: 'Africa/Cairo', country: 'EG' },
  { id: 'amman', name: 'Amman', nameAr: 'عمّان', lat: 31.9454, lon: 35.9284, timeZone: 'Asia/Amman', country: 'JO' },
  { id: 'beirut', name: 'Beirut', nameAr: 'بيروت', lat: 33.8938, lon: 35.5018, timeZone: 'Asia/Beirut', country: 'LB' },
  { id: 'damascus', name: 'Damascus', nameAr: 'دمشق', lat: 33.5138, lon: 36.2765, timeZone: 'Asia/Damascus', country: 'SY' },
  { id: 'jerusalem', name: 'Jerusalem', nameAr: 'القدس', lat: 31.7683, lon: 35.2137, timeZone: 'Asia/Hebron', country: 'PS' },
  // Turkey
  { id: 'istanbul', name: 'Istanbul', nameAr: 'إسطنبول', lat: 41.0082, lon: 28.9784, timeZone: 'Europe/Istanbul', country: 'TR' },
  { id: 'ankara', name: 'Ankara', nameAr: 'أنقرة', lat: 39.9334, lon: 32.8597, timeZone: 'Europe/Istanbul', country: 'TR' },
  // South Asia
  { id: 'karachi', name: 'Karachi', nameAr: 'كراتشي', lat: 24.8607, lon: 67.0011, timeZone: 'Asia/Karachi', country: 'PK' },
  { id: 'lahore', name: 'Lahore', nameAr: 'لاهور', lat: 31.5204, lon: 74.3587, timeZone: 'Asia/Karachi', country: 'PK' },
  { id: 'islamabad', name: 'Islamabad', nameAr: 'إسلام آباد', lat: 33.6844, lon: 73.0479, timeZone: 'Asia/Karachi', country: 'PK' },
  { id: 'dhaka', name: 'Dhaka', nameAr: 'دكا', lat: 23.8103, lon: 90.4125, timeZone: 'Asia/Dhaka', country: 'BD' },
  { id: 'delhi', name: 'Delhi', nameAr: 'دلهي', lat: 28.6139, lon: 77.209, timeZone: 'Asia/Kolkata', country: 'IN' },
  { id: 'mumbai', name: 'Mumbai', nameAr: 'مومباي', lat: 19.076, lon: 72.8777, timeZone: 'Asia/Kolkata', country: 'IN' },
  // Southeast Asia
  { id: 'jakarta', name: 'Jakarta', nameAr: 'جاكرتا', lat: -6.2088, lon: 106.8456, timeZone: 'Asia/Jakarta', country: 'ID' },
  { id: 'bandung', name: 'Bandung', nameAr: 'باندونغ', lat: -6.9175, lon: 107.6191, timeZone: 'Asia/Jakarta', country: 'ID' },
  { id: 'kuala-lumpur', name: 'Kuala Lumpur', nameAr: 'كوالالمبور', lat: 3.139, lon: 101.6869, timeZone: 'Asia/Kuala_Lumpur', country: 'MY' },
  { id: 'singapore', name: 'Singapore', nameAr: 'سنغافورة', lat: 1.3521, lon: 103.8198, timeZone: 'Asia/Singapore', country: 'SG' },
  // North Africa
  { id: 'casablanca', name: 'Casablanca', nameAr: 'الدار البيضاء', lat: 33.5731, lon: -7.5898, timeZone: 'Africa/Casablanca', country: 'MA' },
  { id: 'rabat', name: 'Rabat', nameAr: 'الرباط', lat: 34.0209, lon: -6.8416, timeZone: 'Africa/Casablanca', country: 'MA' },
  { id: 'algiers', name: 'Algiers', nameAr: 'الجزائر', lat: 36.7538, lon: 3.0588, timeZone: 'Africa/Algiers', country: 'DZ' },
  { id: 'tunis', name: 'Tunis', nameAr: 'تونس', lat: 36.8065, lon: 10.1815, timeZone: 'Africa/Tunis', country: 'TN' },
  { id: 'tripoli', name: 'Tripoli', nameAr: 'طرابلس', lat: 32.8872, lon: 13.1913, timeZone: 'Africa/Tripoli', country: 'LY' },
  // Europe
  { id: 'london', name: 'London', nameAr: 'لندن', lat: 51.5072, lon: -0.1276, timeZone: 'Europe/London', country: 'GB' },
  { id: 'paris', name: 'Paris', nameAr: 'باريس', lat: 48.8566, lon: 2.3522, timeZone: 'Europe/Paris', country: 'FR' },
  { id: 'berlin', name: 'Berlin', nameAr: 'برلين', lat: 52.52, lon: 13.405, timeZone: 'Europe/Berlin', country: 'DE' },
  { id: 'madrid', name: 'Madrid', nameAr: 'مدريد', lat: 40.4168, lon: -3.7038, timeZone: 'Europe/Madrid', country: 'ES' },
  // Americas
  { id: 'new-york', name: 'New York', nameAr: 'نيويورك', lat: 40.7128, lon: -74.006, timeZone: 'America/New_York', country: 'US' },
  { id: 'los-angeles', name: 'Los Angeles', nameAr: 'لوس أنجلوس', lat: 34.0522, lon: -118.2437, timeZone: 'America/Los_Angeles', country: 'US' },
  { id: 'toronto', name: 'Toronto', nameAr: 'تورنتو', lat: 43.6532, lon: -79.3832, timeZone: 'America/Toronto', country: 'CA' },
]

export function getCity(id: string): CityPreset | undefined {
  return CITIES.find((c) => c.id === id)
}
