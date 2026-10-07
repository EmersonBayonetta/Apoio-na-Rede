export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accessibility_criteria: {
        Row: {
          criado_em: string | null
          criterio: string
          establishment_id: string
          id: string
          observacao_livre: string | null
          presente: boolean | null
          recurso: string | null
          tipo_deficiencia: Database["public"]["Enums"]["disability_type"]
        }
        Insert: {
          criado_em?: string | null
          criterio: string
          establishment_id: string
          id?: string
          observacao_livre?: string | null
          presente?: boolean | null
          recurso?: string | null
          tipo_deficiencia: Database["public"]["Enums"]["disability_type"]
        }
        Update: {
          criado_em?: string | null
          criterio?: string
          establishment_id?: string
          id?: string
          observacao_livre?: string | null
          presente?: boolean | null
          recurso?: string | null
          tipo_deficiencia?: Database["public"]["Enums"]["disability_type"]
        }
        Relationships: [
          {
            foreignKeyName: "accessibility_criteria_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishments: {
        Row: {
          atualizado_em: string | null
          bairro: string | null
          categoria: Database["public"]["Enums"]["establishment_category"]
          cep: string | null
          cidade: string
          criado_em: string | null
          descricao: string
          dono_id: string | null
          email_contato: string | null
          endereco: string
          estado: string
          fotos: string[] | null
          horario_funcionamento: string | null
          id: string
          informado_responsavel: boolean
          latitude: number
          longitude: number
          motivo_rejeicao: string | null
          nome: string
          nota_media: number | null
          place_id: string | null
          status: Database["public"]["Enums"]["establishment_status"]
          telefone: string | null
          total_avaliacoes: number | null
          verificado_em: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          atualizado_em?: string | null
          bairro?: string | null
          categoria: Database["public"]["Enums"]["establishment_category"]
          cep?: string | null
          cidade: string
          criado_em?: string | null
          descricao: string
          dono_id?: string | null
          email_contato?: string | null
          endereco: string
          estado?: string
          fotos?: string[] | null
          horario_funcionamento?: string | null
          id?: string
          informado_responsavel?: boolean
          latitude: number
          longitude: number
          motivo_rejeicao?: string | null
          nome: string
          nota_media?: number | null
          place_id?: string | null
          status?: Database["public"]["Enums"]["establishment_status"]
          telefone?: string | null
          total_avaliacoes?: number | null
          verificado_em?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          atualizado_em?: string | null
          bairro?: string | null
          categoria?: Database["public"]["Enums"]["establishment_category"]
          cep?: string | null
          cidade?: string
          criado_em?: string | null
          descricao?: string
          dono_id?: string | null
          email_contato?: string | null
          endereco?: string
          estado?: string
          fotos?: string[] | null
          horario_funcionamento?: string | null
          id?: string
          informado_responsavel?: boolean
          latitude?: number
          longitude?: number
          motivo_rejeicao?: string | null
          nome?: string
          nota_media?: number | null
          place_id?: string | null
          status?: Database["public"]["Enums"]["establishment_status"]
          telefone?: string | null
          total_avaliacoes?: number | null
          verificado_em?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "establishments_dono_id_fkey"
            columns: ["dono_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      place_reports: {
        Row: {
          comentario: string
          criado_em: string
          establishment_id: string | null
          fotos: string[]
          id: string
          local_key: string | null
          motivo_recusa: string | null
          place_id: string | null
          respostas: Json
          status: string
          user_id: string
        }
        Insert: {
          comentario?: string
          criado_em?: string
          establishment_id?: string | null
          fotos?: string[]
          id?: string
          local_key?: string | null
          motivo_recusa?: string | null
          place_id?: string | null
          respostas: Json
          status?: string
          user_id?: string
        }
        Update: {
          comentario?: string
          criado_em?: string
          establishment_id?: string | null
          fotos?: string[]
          id?: string
          local_key?: string | null
          motivo_recusa?: string | null
          place_id?: string | null
          respostas?: Json
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_reports_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          atende_por_tipo: Database["public"]["Enums"]["disability_type"][]
          cidade: string
          criado_em: string | null
          descricao: string | null
          email: string | null
          endereco: string | null
          especialidade: string
          establishment_id: string | null
          estado: string
          foto_url: string | null
          id: string
          nome: string
          registro_profissional: string | null
          telefone: string | null
          whatsapp: string | null
        }
        Insert: {
          atende_por_tipo?: Database["public"]["Enums"]["disability_type"][]
          cidade: string
          criado_em?: string | null
          descricao?: string | null
          email?: string | null
          endereco?: string | null
          especialidade: string
          establishment_id?: string | null
          estado?: string
          foto_url?: string | null
          id?: string
          nome: string
          registro_profissional?: string | null
          telefone?: string | null
          whatsapp?: string | null
        }
        Update: {
          atende_por_tipo?: Database["public"]["Enums"]["disability_type"][]
          cidade?: string
          criado_em?: string | null
          descricao?: string | null
          email?: string | null
          endereco?: string | null
          especialidade?: string
          establishment_id?: string | null
          estado?: string
          foto_url?: string | null
          id?: string
          nome?: string
          registro_profissional?: string | null
          telefone?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      review_flags: {
        Row: {
          criado_em: string
          id: string
          motivo: string
          review_id: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          motivo: string
          review_id: string
          user_id?: string
        }
        Update: {
          criado_em?: string
          id?: string
          motivo?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_flags_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comentario: string
          data: string | null
          denunciada: boolean | null
          establishment_id: string
          fotos: string[] | null
          id: string
          motivo_denuncia: string | null
          nota: number
          tipo_deficiencia_avaliada: Database["public"]["Enums"]["disability_type"]
          user_id: string | null
          user_nome: string
        }
        Insert: {
          comentario: string
          data?: string | null
          denunciada?: boolean | null
          establishment_id: string
          fotos?: string[] | null
          id?: string
          motivo_denuncia?: string | null
          nota: number
          tipo_deficiencia_avaliada: Database["public"]["Enums"]["disability_type"]
          user_id?: string | null
          user_nome?: string
        }
        Update: {
          comentario?: string
          data?: string | null
          denunciada?: boolean | null
          establishment_id?: string
          fotos?: string[] | null
          id?: string
          motivo_denuncia?: string | null
          nota?: number
          tipo_deficiencia_avaliada?: Database["public"]["Enums"]["disability_type"]
          user_id?: string | null
          user_nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          cidade: string
          coordenadas: Json
          criado_em: string | null
          distancia_metros: number | null
          id: string
          nivel_seguranca: string
          ponto_destino: string
          ponto_origem: string
          tem_piso_tatil: boolean
          tem_rampa: boolean
          tem_semaforo_sonoro: boolean
          titulo: string
          trecho_descricao: string
        }
        Insert: {
          cidade: string
          coordenadas?: Json
          criado_em?: string | null
          distancia_metros?: number | null
          id?: string
          nivel_seguranca?: string
          ponto_destino: string
          ponto_origem: string
          tem_piso_tatil?: boolean
          tem_rampa?: boolean
          tem_semaforo_sonoro?: boolean
          titulo: string
          trecho_descricao: string
        }
        Update: {
          cidade?: string
          coordenadas?: Json
          criado_em?: string | null
          distancia_metros?: number | null
          id?: string
          nivel_seguranca?: string
          ponto_destino?: string
          ponto_origem?: string
          tem_piso_tatil?: boolean
          tem_rampa?: boolean
          tem_semaforo_sonoro?: boolean
          titulo?: string
          trecho_descricao?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          atualizado_em: string | null
          avatar_url: string | null
          bio: string | null
          criado_em: string | null
          email: string
          id: string
          nome: string
          preferencias_acessibilidade:
            | Database["public"]["Enums"]["disability_type"][]
            | null
          tipo: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          atualizado_em?: string | null
          avatar_url?: string | null
          bio?: string | null
          criado_em?: string | null
          email: string
          id: string
          nome: string
          preferencias_acessibilidade?:
            | Database["public"]["Enums"]["disability_type"][]
            | null
          tipo?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          atualizado_em?: string | null
          avatar_url?: string | null
          bio?: string | null
          criado_em?: string | null
          email?: string
          id?: string
          nome?: string
          preferencias_acessibilidade?:
            | Database["public"]["Enums"]["disability_type"][]
            | null
          tipo?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_approved_reports: { Args: { requested_key: string }; Returns: Json }
      get_place_accessibility: {
        Args: { requested_place_id: string }
        Returns: Json
      }
      register_establishment: {
        Args: { criteria: Json; details: Json }
        Returns: string
      }
    }
    Enums: {
      disability_type:
        | "mobilidade"
        | "visual"
        | "auditiva"
        | "intelectual"
        | "invisivel"
      establishment_category:
        | "alimentacao"
        | "saude"
        | "lazer_cultura"
        | "comercio_loja"
        | "servico_publico"
        | "banheiro_adaptado"
        | "educacao"
        | "transporte_mobilidade"
        | "hospedagem"
      establishment_status: "pendente" | "verificado" | "rejeitado"
      user_role: "comum" | "comerciante" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      disability_type: [
        "mobilidade",
        "visual",
        "auditiva",
        "intelectual",
        "invisivel",
      ],
      establishment_category: [
        "alimentacao",
        "saude",
        "lazer_cultura",
        "comercio_loja",
        "servico_publico",
        "banheiro_adaptado",
        "educacao",
        "transporte_mobilidade",
        "hospedagem",
      ],
      establishment_status: ["pendente", "verificado", "rejeitado"],
      user_role: ["comum", "comerciante", "admin"],
    },
  },
} as const
