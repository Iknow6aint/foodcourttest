import { Injectable, Logger } from '@nestjs/common';

/**
 * Interface for location coordinates
 */
export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Interface for nearby rider result
 */
export interface NearbyRider {
  id: number;
  name: string;
  phone: string;
  current_latitude: number;
  current_longitude: number;
  distance_km: number;
  is_available: boolean;
}

/**
 * Service for geospatial proximity calculations and rider searches
 */
@Injectable()
export class ProximityService {
  private readonly logger = new Logger(ProximityService.name);

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param location1 First location coordinates
   * @param location2 Second location coordinates
   * @returns Distance in kilometers
   */
  calculateDistance(location1: Location, location2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    
    const lat1 = this.toRadians(location1.latitude);
    const lon1 = this.toRadians(location1.longitude);
    const lat2 = this.toRadians(location2.latitude);
    const lon2 = this.toRadians(location2.longitude);

    const deltaLat = lat2 - lat1;
    const deltaLon = lon2 - lon1;

    const a = 
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    this.logger.debug(
      `Distance between (${location1.latitude}, ${location1.longitude}) and ` +
      `(${location2.latitude}, ${location2.longitude}): ${distance.toFixed(2)}km`
    );

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Check if location is within radius
   * @param center Center location
   * @param target Target location to check
   * @param radiusKm Radius in kilometers
   * @returns True if target is within radius of center
   */
  isWithinRadius(center: Location, target: Location, radiusKm: number): boolean {
    const distance = this.calculateDistance(center, target);
    return distance <= radiusKm;
  }

  /**
   * Calculate distances from a center point to multiple locations
   * @param center Center location
   * @param locations Array of locations to calculate distances to
   * @returns Array of locations with distances
   */
  calculateDistances(
    center: Location, 
    locations: Array<Location & { id: number }>
  ): Array<Location & { id: number; distance_km: number }> {
    return locations.map(location => ({
      ...location,
      distance_km: this.calculateDistance(center, location)
    }));
  }

  /**
   * Find locations within a specific radius, sorted by distance
   * @param center Center location
   * @param locations Array of locations to search
   * @param radiusKm Radius in kilometers
   * @returns Array of locations within radius, sorted by distance (closest first)
   */
  findWithinRadius<T extends Location & { id: number }>(
    center: Location,
    locations: T[],
    radiusKm: number
  ): Array<T & { distance_km: number }> {
    const locationsWithDistance = locations
      .map(location => ({
        ...location,
        distance_km: this.calculateDistance(center, location)
      }))
      .filter(location => location.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km);

    this.logger.log(
      `Found ${locationsWithDistance.length} locations within ${radiusKm}km radius of ` +
      `(${center.latitude}, ${center.longitude})`
    );

    return locationsWithDistance;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Validate location coordinates
   * @param location Location to validate
   * @returns True if valid coordinates
   */
  validateLocation(location: Location): boolean {
    const { latitude, longitude } = location;
    
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return false;
    }
    
    if (latitude < -90 || latitude > 90) {
      return false;
    }
    
    if (longitude < -180 || longitude > 180) {
      return false;
    }
    
    return true;
  }

  /**
   * Get bounding box coordinates for efficient database queries
   * @param center Center location
   * @param radiusKm Radius in kilometers
   * @returns Bounding box coordinates
   */
  getBoundingBox(center: Location, radiusKm: number): {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } {
    // Approximate degrees per km (varies by latitude)
    const latDegreePerKm = 1 / 111;
    const lngDegreePerKm = 1 / (111 * Math.cos(this.toRadians(center.latitude)));
    
    const latOffset = radiusKm * latDegreePerKm;
    const lngOffset = radiusKm * lngDegreePerKm;
    
    return {
      minLat: center.latitude - latOffset,
      maxLat: center.latitude + latOffset,
      minLng: center.longitude - lngOffset,
      maxLng: center.longitude + lngOffset,
    };
  }
}
