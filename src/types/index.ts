export type UserRole = 'Owner' | 'Manager' | 'Sales';

export type ProspectStatus = 'Prospect' | 'Follow Up' | 'Customer' | 'Tidak Jadi';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  password?: string; // used for auth verification in mock/local engine
}

export interface Zone {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface ZoneMember {
  id: string;
  zone_id: string;
  user_id: string;
}

export interface BusinessType {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface Prospect {
  id: string;
  business_name: string;
  pic_name: string;
  phone: string;
  business_type_id: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  gps_captured_at: string | null;
  zone_id: string | null;
  sales_id: string | null;
  status: ProspectStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProspectPhoto {
  id: string;
  prospect_id: string;
  file_url: string;
  created_at: string;
}

export interface DuplicateWarningInfo {
  matchByPhone: boolean;
  matchByName: boolean;
  matchByGps: boolean;
  matchedProspects: {
    id: string;
    business_name: string;
    pic_name: string;
    phone: string;
    sales_name?: string;
  }[];
}
