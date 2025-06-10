import { Contact } from './contact';

export interface Funnel {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface FunnelStage {
  id: string;
  funnel_id: string;
  name: string;
  color: string;
  position: number;
  created_at: string;
}

export interface FunnelContact {
  id: string;
  funnel_id: string;
  stage_id: string;
  contact_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  // Campos expandidos para la UI
  contact?: Contact;
  stage?: FunnelStage;
}

export interface CreateFunnelForm {
  name: string;
  description?: string;
}

export interface CreateFunnelStageForm {
  name: string;
  color: string;
}

export interface UpdateFunnelStagePosition {
  id: string;
  position: number;
}

export interface UpdateFunnelContactPosition {
  id: string; // funnel_contact_id (PK de la tabla funnel_contacts)
  contact_id: string; // FK al contacto original (inmutable para esta fila)
  funnel_id: string; // FK al embudo (inmutable para esta fila)
  stage_id: string; // El NUEVO stage_id al que se mueve
  position: number; // La NUEVA posición dentro de la etapa
}
