export type AllergenSeverity = 'fatal' | 'intolerance' | 'mild';

export interface Allergen {
  id: string;
  name: string;
  enabled: boolean;
  severity: AllergenSeverity;
  emoji: string;
}

export interface NutritionalInfo {
  calories?: string;
  protein?: string;
  carbs?: string;
  fat?: string;
  fiber?: string;
  sugar?: string;
}

export interface DetectedAllergen {
  ingredient: string;
  matchedAllergens: string[];
  explanation: string;
}

export interface TraceAllergen {
  allergens: string[];
  warning: string;
}

export interface ScanResult {
  productName?: string;
  barcode?: string;
  ingredients: string[];
  detectedAllergens: DetectedAllergen[];
  traceAllergens: TraceAllergen[];
  originalLanguage: string;
  translation?: string;
  ingredientsVisible?: boolean;
  imageIssue?: 'blurry' | 'incomplete' | 'not_found' | null;
  safetyRating: 'safe' | 'warning' | 'danger' | 'unknown';
  nutritionalInfo?: NutritionalInfo;
  timestamp: number;
}

export interface HistoryItem extends ScanResult {
  id: string;
  imageUrl?: string;
  profileId: string;
}

export interface Profile {
  id: string;
  name: string;
  emoji: string;
  allergens: Allergen[];
  createdAt: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}
