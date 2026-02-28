export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          name_ar: string | null
          logo: string | null
          address: string | null
          address_ar: string | null
          city: string | null
          emirate: string | null
          trn: string | null
          trade_license: string | null
          industry: string
          fiscal_year_start: number
          vat_registered: boolean
          vat_number: string | null
          default_vat_rate: number
          currency: string
          phone: string | null
          email: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          name_ar?: string | null
          logo?: string | null
          address?: string | null
          address_ar?: string | null
          city?: string | null
          emirate?: string | null
          trn?: string | null
          trade_license?: string | null
          industry: string
          fiscal_year_start?: number
          vat_registered?: boolean
          vat_number?: string | null
          default_vat_rate?: number
          currency?: string
          phone?: string | null
          email?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_ar?: string | null
          logo?: string | null
          address?: string | null
          address_ar?: string | null
          city?: string | null
          emirate?: string | null
          trn?: string | null
          trade_license?: string | null
          industry?: string
          fiscal_year_start?: number
          vat_registered?: boolean
          vat_number?: string | null
          default_vat_rate?: number
          currency?: string
          phone?: string | null
          email?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          company_id: string | null
          role: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id?: string | null
          role?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string | null
          role?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Company = Database['public']['Tables']['companies']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
