/**
 * Rider model interface
 * Represents delivery riders in the food delivery system
 */
export interface Rider {
  id: number;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  is_available: boolean;
  is_active: boolean;
  current_latitude: number | null;
  current_longitude: number | null;
  last_location_update: Date | null;
  vehicle_type: VehicleType | null;
  license_plate: string | null;
  profile_image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Rider creation interface (excluding auto-generated fields)
 */
export interface CreateRiderData {
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  vehicle_type?: VehicleType;
  license_plate?: string;
  profile_image_url?: string;
}

/**
 * Rider update interface (all fields optional except constraints)
 */
export interface UpdateRiderData {
  name?: string;
  email?: string;
  phone?: string;
  password_hash?: string;
  is_available?: boolean;
  is_active?: boolean;
  current_latitude?: number | null;
  current_longitude?: number | null;
  last_location_update?: Date | null;
  vehicle_type?: VehicleType | null;
  license_plate?: string | null;
  profile_image_url?: string | null;
}

/**
 * Location update interface
 */
export interface RiderLocationUpdate {
  current_latitude: number;
  current_longitude: number;
  last_location_update?: Date;
}

/**
 * Rider public profile (excluding sensitive data)
 */
export interface RiderPublicProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_available: boolean;
  vehicle_type: VehicleType | null;
  profile_image_url: string | null;
  created_at: Date;
}

/**
 * Rider location data
 */
export interface RiderLocation {
  id: number;
  name: string;
  current_latitude: number | null;
  current_longitude: number | null;
  last_location_update: Date | null;
  is_available: boolean;
}

/**
 * Vehicle types enum
 */
export enum VehicleType {
  MOTORCYCLE = 'motorcycle',
  BICYCLE = 'bicycle',
  CAR = 'car',
  SCOOTER = 'scooter',
  WALKING = 'walking',
}

/**
 * Rider status enum
 */
export enum RiderStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
  INACTIVE = 'inactive',
}

/**
 * Helper function to get rider status based on availability and activity
 */
export function getRiderStatus(
  rider: Pick<Rider, 'is_available' | 'is_active'>,
): RiderStatus {
  if (!rider.is_active) {
    return RiderStatus.INACTIVE;
  }

  if (!rider.is_available) {
    return RiderStatus.OFFLINE;
  }

  return RiderStatus.AVAILABLE;
}

/**
 * Helper function to validate coordinates
 */
export function isValidCoordinates(
  latitude: number,
  longitude: number,
): boolean {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
}

/**
 * Helper function to calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Helper function to convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
