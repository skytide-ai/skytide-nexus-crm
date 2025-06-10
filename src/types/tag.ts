export interface Tag {
  id: string;
  name: string;
  color: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTagForm {
  name: string;
  color: string;
}

export interface UpdateTagForm {
  name?: string;
  color?: string;
}
