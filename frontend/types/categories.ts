export interface CategoryResponse {
  id: string;
  name: string;
  parent_id: string | null;
  image: string | null;
}

export interface CategoryCreate {
  name: string;
  parent_id?: string | null;
  image?: string | null;
}

export interface CategoryDeleteResponse {
  id: string;
  deleted_at: string;
}
