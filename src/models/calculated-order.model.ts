export interface AddressDetails {
  city: string;
  name: string;
  address_line: string;
  building_number: string;
}

export interface CalculatedOrder {
  id: number;
  total_amount: number;
  free_delivery: boolean;
  delivery_fee: number;
  service_charge: number;
  address_details: AddressDetails;
  lat: number;
  lng: number;
  created_at: Date;
  updated_at: Date;
}
