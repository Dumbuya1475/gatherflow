export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendee_form_responses: {
        Row: {
          id: number
          ticket_id: number
          form_field_id: number
          field_value: string
          created_at: string
        }
        Insert: {
          id?: number
          ticket_id: number
          form_field_id: number
          field_value: string
          created_at?: string
        }
        Update: {
          id?: number
          ticket_id?: number
          form_field_id?: number
          field_value?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendee_form_responses_form_field_id_fkey"
            columns: ["form_field_id"]
            referencedRelation: "event_form_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendee_form_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      event_form_field_options: {
        Row: {
          id: number
          form_field_id: number
          value: string
          created_at: string
        }
        Insert: {
          id?: number
          form_field_id: number
          value: string
          created_at?: string
        }
        Update: {
          id?: number
          form_field_id?: number
          value?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_form_field_options_form_field_id_fkey"
            columns: ["form_field_id"]
            referencedRelation: "event_form_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      event_form_fields: {
        Row: {
          id: number
          event_id: number
          field_name: string
          field_type: Database["public"]["Enums"]["field_type"]
          is_required: boolean
          order: number
          created_at: string
        }
        Insert: {
          id?: number
          event_id: number
          field_name: string
          field_type: Database["public"]["Enums"]["field_type"]
          is_required?: boolean
          order: number
          created_at?: string
        }
        Update: {
          id?: number
          event_id?: number
          field_name?: string
          field_type?: Database["public"]["Enums"]["field_type"]
          is_required?: boolean
          order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_form_fields_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_scanners: {
        Row: {
          id: number
          event_id: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: number
          event_id: number
          user_id: string
          created_at?: string
        }
        Update: {
          id?: number
          event_id?: number
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_scanners_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_scanners_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          id: number
          created_at: string
          title: string
          description: string | null
          welcome_message: string | null
          date: string
          end_date: string | null
          location: string | null
          cover_image: string | null
          ticket_brand_logo: string | null
          ticket_brand_color: string | null
          organizer_id: string | null
          capacity: number | null
          is_paid: boolean
          price: number | null
          is_public: boolean
          requires_approval: boolean
          ticket_background_image: string | null
          fee_bearer: string | null
          status: string | null
          payout_completed: boolean | null
        }
        Insert: {
          id?: number
          created_at?: string
          title: string
          description?: string | null
          welcome_message?: string | null
          date: string
          end_date?: string | null
          location?: string | null
          cover_image?: string | null
          ticket_brand_logo?: string | null
          ticket_brand_color?: string | null
          organizer_id?: string | null
          capacity?: number | null
          is_paid?: boolean
          price?: number | null
          is_public?: boolean
          requires_approval?: boolean
          ticket_background_image?: string | null
          fee_bearer?: string | null
          status?: string | null
          payout_completed?: boolean | null
        }
        Update: {
          id?: number
          created_at?: string
          title?: string
          description?: string | null
          welcome_message?: string | null
          date?: string
          end_date?: string | null
          location?: string | null
          cover_image?: string | null
          ticket_brand_logo?: string | null
          ticket_brand_color?: string | null
          organizer_id?: string | null
          capacity?: number | null
          is_paid?: boolean
          price?: number | null
          is_public?: boolean
          requires_approval?: boolean
          ticket_background_image?: string | null
          fee_bearer?: string | null
          status?: string | null
          payout_completed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          id: number
          created_at: string
          event_id: number
          organizer_id: string
          total_tickets_sold: number | null
          gross_amount: number | null
          platform_fees: number | null
          monime_fees: number | null
          net_payout: number | null
          monime_payout_id: string | null
          recipient_phone: string | null
          monime_payout_status: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          event_id: number
          organizer_id: string
          total_tickets_sold?: number | null
          gross_amount?: number | null
          platform_fees?: number | null
          monime_fees?: number | null
          net_payout?: number | null
          monime_payout_id?: string | null
          recipient_phone?: string | null
          monime_payout_status?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          event_id?: number
          organizer_id?: string
          total_tickets_sold?: number | null
          gross_amount?: number | null
          platform_fees?: number | null
          monime_fees?: number | null
          net_payout?: number | null
          monime_payout_id?: string | null
          recipient_phone?: string | null
          monime_payout_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_organizer_id_fkey"
            columns: ["organizer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          first_name: string | null
          last_name: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          email: string | null
          is_guest: boolean | null
          phone: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string | null
          first_name?: string | null
          last_name?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          email?: string | null
          is_guest?: boolean | null
          phone?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          first_name?: string | null
          last_name?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          email?: string | null
          is_guest?: boolean | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          id: number
          created_at: string
          event_id: number
          user_id: string
          qr_token: string | null
          checked_in: boolean
          checked_in_at: string | null
          checked_out: boolean
          checked_out_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_price: number | null
          monime_checkout_session_id: string | null
          monime_payment_status: string | null
          fee_bearer: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          event_id: number
          user_id: string
          qr_token?: string | null
          checked_in?: boolean
          checked_in_at?: string | null
          checked_out?: boolean
          checked_out_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_price?: number | null
          monime_checkout_session_id?: string | null
          monime_payment_status?: string | null
          fee_bearer?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          event_id?: number
          user_id?: string
          qr_token?: string | null
          checked_in?: boolean
          checked_in_at?: string | null
          checked_out?: boolean
          checked_out_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_price?: number | null
          monime_checkout_session_id?: string | null
          monime_payment_status?: string | null
          fee_bearer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_users: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_attendees_for_event: {
        Args: {
          event_id_param: number
        }
        Returns: {
          ticket_id: number
          checked_in: boolean
          checked_out: boolean
          status: Database["public"]["Enums"]["ticket_status"]
          first_name: string
          last_name: string
          email: string
          avatar_url: string
          form_responses: Json
        }[]
      }
      get_event_attendee_count: {
        Args: {
          event_id_param: number
        }
        Returns: number
      }
      get_event_attendee_counts: {
        Args: {
          event_ids: number[]
        }
        Returns: {
          event_id_out: number
          attendee_count: number
        }[]
      }
    }
    Enums: {
      field_type:
        | "text"
        | "number"
        | "date"
        | "boolean"
        | "multiple-choice"
        | "checkboxes"
        | "dropdown"
      ticket_status:
        | "pending"
        | "approved"
        | "rejected"
        | "checked_in"
        | "checked_out"
        | "expired"
        | "unpaid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeName extends PublicCompositeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeNameOrOptions["schema"]]["CompositeTypes"][CompositeName]
  : PublicCompositeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      field_type: [
        "text",
        "number",
        "date",
        "boolean",
        "multiple-choice",
        "checkboxes",
        "dropdown",
      ] as const,
      ticket_status: [
        "pending",
        "approved",
        "rejected",
        "expired",
        "checked_in",
        "checked_out",
        "unpaid",
      ] as const,
    },
  },
} as const

// Custom types for application use
export type Event = Database['public']['Tables']['events']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Ticket = Database['public']['Tables']['tickets']['Row']

export type EventWithAttendees = Event & {
  attendees: number
}

export type Attendee = {
  ticket_id: number
  checked_in: boolean
  checked_out: boolean
  first_name: string | null
  last_name: string | null
  email: string | null
  status: Database["public"]["Enums"]["ticket_status"]
  avatar_url: string | null
}

export type EventFormFieldOption = {
  id: number
  value: string
}

export type EventFormField = Database['public']['Tables']['event_form_fields']['Row'] & {
  options: EventFormFieldOption[] | null
}

export type EventFormFieldWithOptions = Omit<EventFormField, 'id' | 'event_id' | 'order' | 'options'> & {
  options?: { value: string }[]
}