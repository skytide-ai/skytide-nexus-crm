
export interface Contact {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  country_code: string;
  email?: string;
  age?: number;
  gender?: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir';
  birth_date?: string;
  address?: string;
  city?: string;
  document_type?: 'CC' | 'NIT';
  document_number?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ContactNote {
  id: string;
  contact_id: string;
  note: string;
  created_at: string;
  created_by: string;
}

export interface ContactFile {
  id: string;
  contact_id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
  created_by: string;
}

export interface Appointment {
  id: string;
  organization_id: string;
  contact_id: string;
  service_id?: string;
  member_id?: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'programada' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}
