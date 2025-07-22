export interface AddressDetails {
  city: string;
  name: string;
  address_line: string;
  building_number: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface MealData {
  id: string;
  name: string;
  active: boolean;
  amount?: string;
  brand_id?: string;
  item_type?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Addon {
  id: string;
  amount: number;
  meal_id: string;
  meal_data: MealData;
  created_at: Date;
  updated_at: Date;
  meal_addon_id: string;
  internal_profit: number;
  min_selection_no: string;
  meal_addon_category_id: string;
  images?: Record<string, any>;
  is_combo?: boolean;
  position?: number;
  quantity?: number;
  posist_data?: Record<string, any>;
}

export interface Meal {
  id: string;
  new: boolean;
  name: string;
  brand: Brand;
  active: boolean;
  addons: Addon[];
  amount: string;
  images: string[];
  alcohol: boolean;
  item_no: string | null;
  summary: string | null;
  brand_id: string;
  calories: string;
  is_addon: boolean;
  is_combo: boolean;
  position: number;
  quantity: number;
  home_page: boolean;
  item_type: string;
  meal_tags: Record<string, any>[];
  created_at: Date;
  is_deleted: boolean;
  order_note: string;
  updated_at: Date;
  description: string;
  minimum_age: string;
  posist_data: Record<string, any>;
  available_no: string;
  meal_keywords: Record<string, any>[];
  internal_profit: number;
  meal_category_id: string;
}

export interface MealGroup {
  brand: Brand;
  meals: Meal[];
  amount: number;
  internal_profit: number;
}

export interface CalculatedOrder {
  id: number;
  total_amount: number;
  free_delivery: boolean;
  delivery_fee: number;
  service_charge: number;
  address_details: AddressDetails;
  meals: MealGroup[];
  lat: number;
  lng: number;
  cokitchen_polygon_id: string;
  user_id: number;
  cokitchen_id: string;
  pickup: boolean;
  prev_price: number;
  created_at: Date;
  updated_at: Date;
}
