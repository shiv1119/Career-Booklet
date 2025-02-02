export interface BlogResponse {
    id: number;
    title: string;
    content: string;
    author: string;
    status: string;
    category: string | null;
    subcategory: string | null;
    category_id: number;
    subcategory_id: number;
    created_at: string;
    updated_at: string;
    tags: string[];
    total_views: number;
  }

export interface BlogCreateData {
    title: string;
    content: string;
    status: string;
    category_id?: number;
    subcategory_id?: number;
    new_category?: string;
    new_subcategory?: string;
    tags: string;
  }
  

  export interface Subcategory {
    id: number;
    name: string;
  }
  
  export interface Category {
    id: number;
    name: string;
    subcategories: Subcategory[];
  }


export interface Tag {
  id: number;
  name: string;
}

export interface FetchOptions {
  token: string;
  queryParams?: Record<string, string | number>;
}

export interface AnalyticsData {
  day?: string | number;
  month?: string | number; 
  year?: string | number;
  total_views: number;
  percentage_change: number;
  total_current_views: number;
}

