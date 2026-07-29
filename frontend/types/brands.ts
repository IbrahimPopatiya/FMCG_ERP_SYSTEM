export interface BrandResponse {
  id: string;
  name: string;
  logo: string | null;
}

export interface BrandCreate {
  name: string;
  logo?: string | null;
}

export interface BrandDeleteResponse {
  id: string;
  deleted_at: string;
}
