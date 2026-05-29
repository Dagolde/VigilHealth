// ============================================================
// VigilHealth Database Types
// Derived from the Supabase schema — follows the Supabase
// generated types pattern with Tables, Insert, and Row types.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          email_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          primary_location: unknown | null; // PostGIS GEOGRAPHY type
          primary_city: string | null;
          primary_state: string | null;
          search_radius_miles: number;
          notification_preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          primary_location?: unknown | null;
          primary_city?: string | null;
          primary_state?: string | null;
          search_radius_miles?: number;
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          primary_location?: unknown | null;
          primary_city?: string | null;
          primary_state?: string | null;
          search_radius_miles?: number;
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      risk_levels: {
        Row: {
          id: string;
          location: unknown; // PostGIS GEOGRAPHY type
          location_name: string;
          city: string | null;
          state: string | null;
          country: string | null;
          disease: string;
          risk_level: 'low' | 'moderate' | 'high' | 'critical' | null;
          risk_score: number | null;
          case_count: number | null;
          source: 'who' | 'cdc' | 'community' | null;
          source_url: string | null;
          confidence: number | null;
          valid_from: string;
          valid_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          location: unknown;
          location_name: string;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          disease: string;
          risk_level?: 'low' | 'moderate' | 'high' | 'critical' | null;
          risk_score?: number | null;
          case_count?: number | null;
          source?: 'who' | 'cdc' | 'community' | null;
          source_url?: string | null;
          confidence?: number | null;
          valid_from: string;
          valid_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          location?: unknown;
          location_name?: string;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          disease?: string;
          risk_level?: 'low' | 'moderate' | 'high' | 'critical' | null;
          risk_score?: number | null;
          case_count?: number | null;
          source?: 'who' | 'cdc' | 'community' | null;
          source_url?: string | null;
          confidence?: number | null;
          valid_from?: string;
          valid_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      community_reports: {
        Row: {
          id: string;
          user_id: string | null;
          location: unknown; // PostGIS GEOGRAPHY type
          observation_type: 'symptom' | 'supply' | 'other' | null;
          description: string;
          is_flagged: boolean;
          flag_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          location: unknown;
          observation_type?: 'symptom' | 'supply' | 'other' | null;
          description: string;
          is_flagged?: boolean;
          flag_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          location?: unknown;
          observation_type?: 'symptom' | 'supply' | 'other' | null;
          description?: string;
          is_flagged?: boolean;
          flag_reason?: string | null;
          created_at?: string;
        };
      };
      supply_locations: {
        Row: {
          id: string;
          name: string;
          type: 'pharmacy' | 'testing_site' | 'telehealth' | 'other' | null;
          location: unknown; // PostGIS GEOGRAPHY type
          address: string;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          phone: string | null;
          hours: string | null;
          is_premium: boolean;
          has_safe_badge: boolean;
          safe_badge_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: 'pharmacy' | 'testing_site' | 'telehealth' | 'other' | null;
          location: unknown;
          address: string;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          phone?: string | null;
          hours?: string | null;
          is_premium?: boolean;
          has_safe_badge?: boolean;
          safe_badge_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'pharmacy' | 'testing_site' | 'telehealth' | 'other' | null;
          location?: unknown;
          address?: string;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          phone?: string | null;
          hours?: string | null;
          is_premium?: boolean;
          has_safe_badge?: boolean;
          safe_badge_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      supply_availability: {
        Row: {
          id: string;
          location_id: string | null;
          item_name: string;
          status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown' | null;
          reported_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id?: string | null;
          item_name: string;
          status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown' | null;
          reported_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string | null;
          item_name?: string;
          status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown' | null;
          reported_by?: string | null;
          created_at?: string;
        };
      };
      help_requests: {
        Row: {
          id: string;
          requester_id: string | null;
          description: string;
          task_type: 'groceries' | 'pharmacy' | 'other' | null;
          location: unknown; // PostGIS GEOGRAPHY type
          urgency: 'low' | 'medium' | 'high' | null;
          status: 'pending' | 'accepted' | 'fulfilled' | 'cancelled';
          volunteer_id: string | null;
          created_at: string;
          updated_at: string;
          fulfilled_at: string | null;
        };
        Insert: {
          id?: string;
          requester_id?: string | null;
          description: string;
          task_type?: 'groceries' | 'pharmacy' | 'other' | null;
          location: unknown;
          urgency?: 'low' | 'medium' | 'high' | null;
          status?: 'pending' | 'accepted' | 'fulfilled' | 'cancelled';
          volunteer_id?: string | null;
          created_at?: string;
          updated_at?: string;
          fulfilled_at?: string | null;
        };
        Update: {
          id?: string;
          requester_id?: string | null;
          description?: string;
          task_type?: 'groceries' | 'pharmacy' | 'other' | null;
          location?: unknown;
          urgency?: 'low' | 'medium' | 'high' | null;
          status?: 'pending' | 'accepted' | 'fulfilled' | 'cancelled';
          volunteer_id?: string | null;
          created_at?: string;
          updated_at?: string;
          fulfilled_at?: string | null;
        };
      };
      volunteers: {
        Row: {
          id: string;
          is_verified: boolean;
          verification_method: string | null;
          average_rating: number | null;
          completed_tasks: number;
          flag_count: number;
          is_suspended: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          is_verified?: boolean;
          verification_method?: string | null;
          average_rating?: number | null;
          completed_tasks?: number;
          flag_count?: number;
          is_suspended?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          is_verified?: boolean;
          verification_method?: string | null;
          average_rating?: number | null;
          completed_tasks?: number;
          flag_count?: number;
          is_suspended?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          body: string;
          tags: string[] | null;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          body: string;
          tags?: string[] | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          body?: string;
          tags?: string[] | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      answers: {
        Row: {
          id: string;
          question_id: string | null;
          user_id: string | null;
          body: string;
          sources: Json;
          is_verified: boolean;
          upvotes: number;
          is_flagged: boolean;
          flag_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_id?: string | null;
          user_id?: string | null;
          body: string;
          sources?: Json;
          is_verified?: boolean;
          upvotes?: number;
          is_flagged?: boolean;
          flag_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string | null;
          user_id?: string | null;
          body?: string;
          sources?: Json;
          is_verified?: boolean;
          upvotes?: number;
          is_flagged?: boolean;
          flag_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      business_organizations: {
        Row: {
          id: string;
          name: string;
          subscription_tier: 'free' | 'basic' | 'premium';
          subscription_expires_at: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          subscription_tier?: 'free' | 'basic' | 'premium';
          subscription_expires_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          subscription_tier?: 'free' | 'basic' | 'premium';
          subscription_expires_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      business_locations: {
        Row: {
          id: string;
          organization_id: string | null;
          name: string;
          location: unknown | null; // PostGIS GEOGRAPHY type
          address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          name: string;
          location?: unknown | null;
          address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          name?: string;
          location?: unknown | null;
          address?: string | null;
          created_at?: string;
        };
      };
      business_users: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          role: 'admin' | 'member';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          role?: 'admin' | 'member';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          role?: 'admin' | 'member';
          created_at?: string;
        };
      };
      employee_wellness_reports: {
        Row: {
          id: string;
          organization_id: string | null;
          location_id: string | null;
          employee_id: string;
          symptoms: string[] | null;
          severity: 'mild' | 'moderate' | 'severe' | null;
          is_absent: boolean;
          reported_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          location_id?: string | null;
          employee_id: string;
          symptoms?: string[] | null;
          severity?: 'mild' | 'moderate' | 'severe' | null;
          is_absent?: boolean;
          reported_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          location_id?: string | null;
          employee_id?: string;
          symptoms?: string[] | null;
          severity?: 'mild' | 'moderate' | 'severe' | null;
          is_absent?: boolean;
          reported_at?: string;
        };
      };
      telehealth_referrals: {
        Row: {
          id: string;
          user_id: string | null;
          provider_id: string;
          provider_name: string;
          referral_code: string;
          symptom_summary: string | null;
          status: 'pending' | 'completed' | 'cancelled';
          commission_amount: number | null;
          commission_paid: boolean;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          provider_id: string;
          provider_name: string;
          referral_code: string;
          symptom_summary?: string | null;
          status?: 'pending' | 'completed' | 'cancelled';
          commission_amount?: number | null;
          commission_paid?: boolean;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          provider_id?: string;
          provider_name?: string;
          referral_code?: string;
          symptom_summary?: string | null;
          status?: 'pending' | 'completed' | 'cancelled';
          commission_amount?: number | null;
          commission_paid?: boolean;
          created_at?: string;
          completed_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      risk_level_enum: 'low' | 'moderate' | 'high' | 'critical';
      source_enum: 'who' | 'cdc' | 'community';
      supply_status_enum: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';
      help_request_status_enum: 'pending' | 'accepted' | 'fulfilled' | 'cancelled';
      urgency_enum: 'low' | 'medium' | 'high';
      subscription_tier_enum: 'free' | 'basic' | 'premium';
      business_role_enum: 'admin' | 'member';
      severity_enum: 'mild' | 'moderate' | 'severe';
      telehealth_status_enum: 'pending' | 'completed' | 'cancelled';
      observation_type_enum: 'symptom' | 'supply' | 'other';
      location_type_enum: 'pharmacy' | 'testing_site' | 'telehealth' | 'other';
    };
    CompositeTypes: Record<string, never>;
  };
}

// ============================================================
// Convenience type aliases
// ============================================================

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Row types
export type User = Tables<'users'>;
export type UserProfile = Tables<'user_profiles'>;
export type RiskLevel = Tables<'risk_levels'>;
export type CommunityReport = Tables<'community_reports'>;
export type SupplyLocation = Tables<'supply_locations'>;
export type SupplyAvailability = Tables<'supply_availability'>;
export type HelpRequest = Tables<'help_requests'>;
export type Volunteer = Tables<'volunteers'>;
export type Question = Tables<'questions'>;
export type Answer = Tables<'answers'>;
export type BusinessOrganization = Tables<'business_organizations'>;
export type BusinessLocation = Tables<'business_locations'>;
export type BusinessUser = Tables<'business_users'>;
export type EmployeeWellnessReport = Tables<'employee_wellness_reports'>;
export type TelehealthReferral = Tables<'telehealth_referrals'>;

// Insert types
export type UserInsert = InsertTables<'users'>;
export type UserProfileInsert = InsertTables<'user_profiles'>;
export type RiskLevelInsert = InsertTables<'risk_levels'>;
export type CommunityReportInsert = InsertTables<'community_reports'>;
export type SupplyLocationInsert = InsertTables<'supply_locations'>;
export type SupplyAvailabilityInsert = InsertTables<'supply_availability'>;
export type HelpRequestInsert = InsertTables<'help_requests'>;
export type VolunteerInsert = InsertTables<'volunteers'>;
export type QuestionInsert = InsertTables<'questions'>;
export type AnswerInsert = InsertTables<'answers'>;
export type BusinessOrganizationInsert = InsertTables<'business_organizations'>;
export type BusinessLocationInsert = InsertTables<'business_locations'>;
export type BusinessUserInsert = InsertTables<'business_users'>;
export type EmployeeWellnessReportInsert = InsertTables<'employee_wellness_reports'>;
export type TelehealthReferralInsert = InsertTables<'telehealth_referrals'>;

// Update types
export type UserUpdate = UpdateTables<'users'>;
export type UserProfileUpdate = UpdateTables<'user_profiles'>;
export type RiskLevelUpdate = UpdateTables<'risk_levels'>;
export type CommunityReportUpdate = UpdateTables<'community_reports'>;
export type SupplyLocationUpdate = UpdateTables<'supply_locations'>;
export type SupplyAvailabilityUpdate = UpdateTables<'supply_availability'>;
export type HelpRequestUpdate = UpdateTables<'help_requests'>;
export type VolunteerUpdate = UpdateTables<'volunteers'>;
export type QuestionUpdate = UpdateTables<'questions'>;
export type AnswerUpdate = UpdateTables<'answers'>;
export type BusinessOrganizationUpdate = UpdateTables<'business_organizations'>;
export type BusinessLocationUpdate = UpdateTables<'business_locations'>;
export type BusinessUserUpdate = UpdateTables<'business_users'>;
export type EmployeeWellnessReportUpdate = UpdateTables<'employee_wellness_reports'>;
export type TelehealthReferralUpdate = UpdateTables<'telehealth_referrals'>;

// ============================================================
// Notification preferences type (used in user_profiles)
// ============================================================
export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
}

// ============================================================
// Answer source type (used in answers.sources JSONB)
// ============================================================
export interface AnswerSource {
  url: string;
  title: string;
  organization: string;
}
