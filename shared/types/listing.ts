export interface LocalizedString {
  en: string;
  fr?: string;
  es?: string;
}

export interface MoneyValue {
  amount: number;       // Base integer formatting matching exact banking cents values
  currency: string;     // ISO 4217 standard format (e.g. "USD", "EUR", "GHS")
}

export interface GeoLocation {
  address: string;
  timezone: string;     // IANA Zone naming context registry identifiers
}

export interface DiningMetadata {
  cuisineType: string;
  priceTier: "$" | "$$" | "$$$";
  menuThumbnails: string[];
}

export interface GlobalListingContract {
  id: string;
  category: "Dining" | "Events" | "Beauty" | "Hospitality";
  names: LocalizedString;
  location: GeoLocation;
  basePrice: MoneyValue;
  dining?: DiningMetadata;
  amenities: {
    wifi: boolean;
    ac: boolean;
  };
}
