export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          image_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_credentials: {
        Row: {
          user_id: string;
          password_hash: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          password_hash: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          password_hash?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          invite_code: string;
          manager_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          invite_code: string;
          manager_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          invite_code?: string;
          manager_user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          org_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["member_role"];
          joined_at: string;
        };
        Insert: {
          org_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["member_role"];
          joined_at?: string;
        };
        Update: {
          org_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["member_role"];
          joined_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          org_id: string;
          title: string;
          event_date: string;
          attendance_start_at: string;
          attendance_end_at: string;
          radius_meters: number;
          location_name: string | null;
          location_address: string | null;
          latitude: number;
          longitude: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          title: string;
          event_date: string;
          attendance_start_at: string;
          attendance_end_at: string;
          radius_meters: number;
          location_name?: string | null;
          location_address?: string | null;
          latitude: number;
          longitude: number;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          title?: string;
          event_date?: string;
          attendance_start_at?: string;
          attendance_end_at?: string;
          radius_meters?: number;
          location_name?: string | null;
          location_address?: string | null;
          latitude?: number;
          longitude?: number;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      attendances: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: Database["public"]["Enums"]["attendance_status"];
          checked_in_at: string | null;
          checked_in_latitude: number | null;
          checked_in_longitude: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status: Database["public"]["Enums"]["attendance_status"];
          checked_in_at?: string | null;
          checked_in_latitude?: number | null;
          checked_in_longitude?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          status?: Database["public"]["Enums"]["attendance_status"];
          checked_in_at?: string | null;
          checked_in_latitude?: number | null;
          checked_in_longitude?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      member_role: "MANAGER" | "MEMBER";
      attendance_status: "NOT_ATTENDED" | "ATTENDED" | "ABSENT";
    };
    CompositeTypes: {};
  };
};
