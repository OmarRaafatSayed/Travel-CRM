// ============================================================================
// TRAVEL AGENCY CRM - TYPE DEFINITIONS
// Strict TypeScript types for visa tracking, payments, and hotel management
// ============================================================================

// Visa Lifecycle State Machine
export type VisaStatus =
  | 'documents_collected'
  | 'in_review'
  | 'embassy_appointment'
  | 'submitted_to_consulate'
  | 'visa_issued'
  | 'visa_rejected'
  | 'passport_delivered';

export interface VisaTracking {
  id: string;
  customer_id: string;
  visa_type: string;
  destination_country: string;
  
  // Status
  status: VisaStatus;
  
  // Key Dates
  documents_collected_at?: string;
  in_review_at?: string;
  embassy_appointment_date?: string;
  submitted_to_consulate_at?: string;
  visa_issued_at?: string;
  visa_rejected_at?: string;
  passport_delivered_at?: string;
  visa_expiry_date?: string;
  
  // Additional Details
  consulate_name?: string;
  consulate_location?: string;
  application_number?: string;
  rejection_reason?: string;
  notes?: string;
  
  // Metadata
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Document Storage
export type DocumentType =
  | 'passport'
  | 'visa'
  | 'ticket'
  | 'voucher'
  | 'hotel_confirmation'
  | 'insurance';

export interface CustomerDocument {
  id: string;
  customer_id: string;
  visa_tracking_id?: string;
  
  // Classification
  document_type: DocumentType;
  document_name: string;
  
  // Storage Reference
  storage_bucket: string;
  storage_path: string;
  file_size_bytes?: number;
  mime_type?: string;
  
  // Expiration
  expiry_date?: string;
  expiry_alert_sent: boolean;
  
  // Metadata
  uploaded_by?: string;
  uploaded_at: string;
  updated_at: string;
}

// Manual Payment Tracking
export type PaymentStatus =
  | 'pending_deposit'
  | 'partially_paid'
  | 'fully_paid'
  | 'refunded'
  | 'cancelled';

export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'offline_pos'
  | 'cheque';

export interface ManualPayment {
  id: string;
  customer_id: string;
  booking_reference?: string;
  visa_tracking_id?: string;
  
  // Financial Details
  total_booking_cost: number;
  deposit_amount: number;
  amount_paid: number;
  outstanding_balance: number;
  
  // Status
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_reference?: string;
  
  // Due Dates
  deposit_due_date?: string;
  full_payment_due_date?: string;
  payment_received_date?: string;
  
  // Receipt
  receipt_number?: string;
  receipt_generated: boolean;
  receipt_storage_path?: string;
  
  // Notes & Metadata
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type TransactionType =
  | 'deposit'
  | 'installment'
  | 'full_payment'
  | 'refund';

export interface PaymentHistory {
  id: string;
  manual_payment_id: string;
  
  transaction_type: TransactionType;
  amount: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  transaction_date: string;
  
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

// Hotel Offers Management
export interface HotelOffer {
  id: string;
  
  // Hotel Details
  hotel_name: string;
  hotel_location: string;
  hotel_city: string;
  hotel_country: string;
  hotel_rating?: number;
  hotel_category?: string;
  
  // Room Details
  room_type: string;
  board_basis?: string;
  
  // Pricing
  price_per_night: number;
  price_currency: string;
  special_offer_price?: number;
  
  // Availability
  available_from: string;
  available_to: string;
  booking_deadline?: string;
  
  // Capacity
  max_occupancy?: number;
  available_rooms?: number;
  
  // Additional Details
  amenities?: string[];
  description?: string;
  terms_conditions?: string;
  cancellation_policy?: string;
  
  // Source Tracking
  source: 'manual' | 'excel_upload' | 'word_upload' | 'csv_upload';
  uploaded_file_reference?: string;
  
  // Status
  is_active: boolean;
  
  // Metadata
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Booking Alerts
export type AlertType =
  | 'pnr_expiry'
  | 'hotel_cancellation_deadline'
  | 'visa_expiry'
  | 'payment_due';

export interface BookingAlert {
  id: string;
  alert_type: AlertType;
  
  // References
  customer_id?: string;
  visa_tracking_id?: string;
  manual_payment_id?: string;
  
  // Alert Details
  alert_title: string;
  alert_message: string;
  alert_date: string;
  alert_time?: string;
  
  // Status
  is_sent: boolean;
  sent_at?: string;
  
  // Delivery Channels
  send_via_whatsapp: boolean;
  send_via_email: boolean;
  whatsapp_sent: boolean;
  email_sent: boolean;
  
  // Metadata
  created_by?: string;
  created_at: string;
}

// Flight Search Cache
export type TravelClass = 'economy' | 'business' | 'first';

export interface FlightSearchCache {
  id: string;
  
  // Search Parameters
  origin_airport: string;
  destination_airport: string;
  departure_date: string;
  return_date?: string;
  passenger_count: number;
  travel_class: TravelClass;
  
  // Results
  search_results: Record<string, any>; // JSON storage
  
  // Cache Metadata
  search_provider?: string;
  cache_expires_at: string;
  
  // Metadata
  searched_by?: string;
  searched_at: string;
}

// ============================================================================
// FORM INPUT TYPES
// ============================================================================

export interface VisaTrackingInput {
  customer_id: string;
  visa_type: string;
  destination_country: string;
  status?: VisaStatus;
  embassy_appointment_date?: string;
  consulate_name?: string;
  consulate_location?: string;
  application_number?: string;
  notes?: string;
}

export interface ManualPaymentInput {
  customer_id: string;
  booking_reference?: string;
  visa_tracking_id?: string;
  total_booking_cost: number;
  deposit_amount: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  deposit_due_date?: string;
  full_payment_due_date?: string;
  notes?: string;
}

export interface HotelOfferInput {
  hotel_name: string;
  hotel_location: string;
  hotel_city: string;
  hotel_country: string;
  hotel_rating?: number;
  hotel_category?: string;
  room_type: string;
  board_basis?: string;
  price_per_night: number;
  price_currency?: string;
  special_offer_price?: number;
  available_from: string;
  available_to: string;
  booking_deadline?: string;
  max_occupancy?: number;
  available_rooms?: number;
  amenities?: string[];
  description?: string;
  terms_conditions?: string;
  cancellation_policy?: string;
  source: 'manual' | 'excel_upload' | 'word_upload' | 'csv_upload';
}
