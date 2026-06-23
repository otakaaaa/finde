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
      analytics_daily_snapshots: {
        Row: {
          created_at: string
          date: string
          metrics: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          metrics: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          metrics?: Json
          updated_at?: string
        }
        Relationships: []
      }
      areas: {
        Row: {
          city: string
          created_at: string
          id: number
          prefecture: string
          slug: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: number
          prefecture: string
          slug: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: number
          prefecture?: string
          slug?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          aliases: string[] | null
          created_at: string
          id: string
          merged_into: string | null
          name: string
          name_kana: string | null
          search_vector: unknown
          status: string
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          aliases?: string[] | null
          created_at?: string
          id?: string
          merged_into?: string | null
          name: string
          name_kana?: string | null
          search_vector?: unknown
          status?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          aliases?: string[] | null
          created_at?: string
          id?: string
          merged_into?: string | null
          name?: string
          name_kana?: string | null
          search_vector?: unknown
          status?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brands_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          code: string
          id: number
          name: string
        }
        Insert: {
          code: string
          id?: number
          name: string
        }
        Update: {
          code?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          id: number
          name: string
          prefecture_id: number
        }
        Insert: {
          id?: number
          name: string
          prefecture_id: number
        }
        Update: {
          id?: number
          name?: string
          prefecture_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "cities_prefecture_id_fkey"
            columns: ["prefecture_id"]
            isOneToOne: false
            referencedRelation: "prefectures"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_replies: {
        Row: {
          body: string
          contact_id: string
          created_at: string
          id: string
          is_admin_reply: boolean
          replied_by: string
        }
        Insert: {
          body: string
          contact_id: string
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          replied_by: string
        }
        Update: {
          body?: string
          contact_id?: string
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          replied_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_replies_inquiry_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_replies_replied_by_fkey"
            columns: ["replied_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          body: string
          category: string
          created_at: string
          email: string
          id: string
          is_noreply: boolean
          name: string
          status: string
          subject: string
          user_id: string | null
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          email: string
          id?: string
          is_noreply?: boolean
          name: string
          status?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          email?: string
          id?: string
          is_noreply?: boolean
          name?: string
          status?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_inquiries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          shop_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shop_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      item_categories: {
        Row: {
          code: string
          id: number
          name: string
          order: number
          size_group: string
        }
        Insert: {
          code: string
          id?: number
          name: string
          order?: number
          size_group?: string
        }
        Update: {
          code?: string
          id?: number
          name?: string
          order?: number
          size_group?: string
        }
        Relationships: []
      }
      item_types: {
        Row: {
          code: string
          id: number
          item_category_id: number
          name: string
          order: number
        }
        Insert: {
          code: string
          id?: number
          item_category_id: number
          name: string
          order?: number
        }
        Update: {
          code?: string
          id?: number
          item_category_id?: number
          name?: string
          order?: number
        }
        Relationships: [
          {
            foreignKeyName: "item_types_item_category_id_fkey"
            columns: ["item_category_id"]
            isOneToOne: false
            referencedRelation: "item_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_request_brands: {
        Row: {
          brand_id: string
          request_id: string
        }
        Insert: {
          brand_id: string
          request_id: string
        }
        Update: {
          brand_id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_request_brands_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_request_brands_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "shop_listing_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_request_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          request_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          request_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_dm_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "shop_listing_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_dm_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_request_photos: {
        Row: {
          created_at: string
          id: string
          order: number
          request_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          order?: number
          request_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          order?: number
          request_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_request_photos_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "shop_listing_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      material_types: {
        Row: {
          code: string
          id: number
          is_active: boolean
          name: string
          order: number
        }
        Insert: {
          code: string
          id?: number
          is_active?: boolean
          name: string
          order?: number
        }
        Update: {
          code?: string
          id?: number
          is_active?: boolean
          name?: string
          order?: number
        }
        Relationships: []
      }
      ng_words: {
        Row: {
          id: number
          score: number
          word: string
        }
        Insert: {
          id?: number
          score?: number
          word: string
        }
        Update: {
          id?: number
          score?: number
          word?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link_url: string | null
          metadata: Json
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          metadata?: Json
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link_url?: string | null
          metadata?: Json
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_applications: {
        Row: {
          created_at: string
          id: string
          listing_request_id: string | null
          reviewed_by: string | null
          shop_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_request_id?: string | null
          reviewed_by?: string | null
          shop_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_request_id?: string | null
          reviewed_by?: string | null
          shop_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_applications_listing_request_id_fkey"
            columns: ["listing_request_id"]
            isOneToOne: false
            referencedRelation: "shop_listing_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_applications_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prefectures: {
        Row: {
          id: number
          name: string
          name_en: string
          region: string
          slug: string
        }
        Insert: {
          id: number
          name: string
          name_en: string
          region: string
          slug: string
        }
        Update: {
          id?: number
          name?: string
          name_en?: string
          region?: string
          slug?: string
        }
        Relationships: []
      }
      press_releases: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "press_releases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      price_ranges: {
        Row: {
          id: number
          label: string
          max_price: number | null
          min_price: number | null
        }
        Insert: {
          id?: number
          label: string
          max_price?: number | null
          min_price?: number | null
        }
        Update: {
          id?: number
          label?: string
          max_price?: number | null
          min_price?: number | null
        }
        Relationships: []
      }
      review_photos: {
        Row: {
          created_at: string
          id: string
          review_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_photos_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string
          id: string
          note: string | null
          reason: string
          reported_by: string
          review_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          reason: string
          reported_by: string
          review_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          reason?: string
          reported_by?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string
          created_at: string
          id: string
          ng_score: number
          rating: number
          shop_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          ng_score?: number
          rating: number
          shop_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          ng_score?: number
          rating?: number
          shop_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
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
      share_bookmark_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_bookmark_folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      share_bookmarks: {
        Row: {
          created_at: string
          folder_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_bookmarks_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "share_bookmark_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "share_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      share_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          ng_score: number
          post_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          ng_score?: number
          post_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          ng_score?: number
          post_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "share_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      share_impressions: {
        Row: {
          day: string
          post_id: string
          user_id: string
        }
        Insert: {
          day?: string
          post_id: string
          user_id: string
        }
        Update: {
          day?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_impressions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "share_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_impressions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      share_post_photos: {
        Row: {
          created_at: string
          id: string
          order: number
          post_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          order?: number
          post_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          order?: number
          post_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_post_photos_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "share_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      share_post_reports: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          reason: string | null
          reported_by: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reason?: string | null
          reported_by: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reason?: string | null
          reported_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_post_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "share_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "share_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_post_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      share_post_shops: {
        Row: {
          created_at: string
          post_id: string
          shop_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          shop_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_post_shops_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "share_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_post_shops_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      share_posts: {
        Row: {
          body: string
          bookmark_count: number
          comment_count: number
          created_at: string
          id: string
          impression_count: number
          ng_score: number
          published_at: string | null
          rating_count: number
          rating_sum: number
          state: string
          status: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          body: string
          bookmark_count?: number
          comment_count?: number
          created_at?: string
          id?: string
          impression_count?: number
          ng_score?: number
          published_at?: string | null
          rating_count?: number
          rating_sum?: number
          state?: string
          status?: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          body?: string
          bookmark_count?: number
          comment_count?: number
          created_at?: string
          id?: string
          impression_count?: number
          ng_score?: number
          published_at?: string | null
          rating_count?: number
          rating_sum?: number
          state?: string
          status?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      share_ratings: {
        Row: {
          created_at: string
          id: string
          post_id: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_ratings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "share_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_announcements: {
        Row: {
          body: string
          created_at: string
          ends_at: string | null
          id: string
          image_path: string | null
          is_active: boolean
          link_url: string | null
          shop_id: string
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          ends_at?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          link_url?: string | null
          shop_id: string
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          link_url?: string | null
          shop_id?: string
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_announcements_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_brands: {
        Row: {
          brand_id: string
          created_at: string
          shop_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          shop_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_brands_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_brands_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_categories: {
        Row: {
          category_id: number
          shop_id: string
        }
        Insert: {
          category_id: number
          shop_id: string
        }
        Update: {
          category_id?: number
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_categories_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_item_materials: {
        Row: {
          material_type_id: number
          percentage: number | null
          shop_item_id: string
        }
        Insert: {
          material_type_id: number
          percentage?: number | null
          shop_item_id: string
        }
        Update: {
          material_type_id?: number
          percentage?: number | null
          shop_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_item_materials_material_type_id_fkey"
            columns: ["material_type_id"]
            isOneToOne: false
            referencedRelation: "material_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_item_materials_shop_item_id_fkey"
            columns: ["shop_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_item_photos: {
        Row: {
          created_at: string
          id: string
          order: number
          shop_item_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          order?: number
          shop_item_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          order?: number
          shop_item_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_item_photos_shop_item_id_fkey"
            columns: ["shop_item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          brand_id: string | null
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          item_type_id: number | null
          name: string
          price: number | null
          shop_id: string
          size_ids: number[]
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          item_type_id?: number | null
          name: string
          price?: number | null
          shop_id: string
          size_ids?: number[]
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          item_type_id?: number | null
          name?: string
          price?: number | null
          shop_id?: string
          size_ids?: number[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_items_item_type_id_fkey"
            columns: ["item_type_id"]
            isOneToOne: false
            referencedRelation: "item_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_items_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_listing_requests: {
        Row: {
          address: string | null
          applicant_name: string | null
          applicant_phone: string | null
          applicant_role: string | null
          business_hours: Json | null
          category_ids: number[] | null
          city_id: number | null
          created_at: string
          description: string | null
          existing_shop_id: string | null
          id: string
          instagram_handle: string | null
          instagram_url: string | null
          is_owner_request: boolean
          note: string | null
          phone: string | null
          prefecture_id: number | null
          price_range_id: number | null
          reviewed_by: string | null
          shop_name: string
          status: string
          submitted_by: string
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          applicant_name?: string | null
          applicant_phone?: string | null
          applicant_role?: string | null
          business_hours?: Json | null
          category_ids?: number[] | null
          city_id?: number | null
          created_at?: string
          description?: string | null
          existing_shop_id?: string | null
          id?: string
          instagram_handle?: string | null
          instagram_url?: string | null
          is_owner_request?: boolean
          note?: string | null
          phone?: string | null
          prefecture_id?: number | null
          price_range_id?: number | null
          reviewed_by?: string | null
          shop_name: string
          status?: string
          submitted_by: string
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          applicant_name?: string | null
          applicant_phone?: string | null
          applicant_role?: string | null
          business_hours?: Json | null
          category_ids?: number[] | null
          city_id?: number | null
          created_at?: string
          description?: string | null
          existing_shop_id?: string | null
          id?: string
          instagram_handle?: string | null
          instagram_url?: string | null
          is_owner_request?: boolean
          note?: string | null
          phone?: string | null
          prefecture_id?: number | null
          price_range_id?: number | null
          reviewed_by?: string | null
          shop_name?: string
          status?: string
          submitted_by?: string
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_listing_requests_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_listing_requests_existing_shop_id_fkey"
            columns: ["existing_shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_listing_requests_prefecture_id_fkey"
            columns: ["prefecture_id"]
            isOneToOne: false
            referencedRelation: "prefectures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_listing_requests_price_range_id_fkey"
            columns: ["price_range_id"]
            isOneToOne: false
            referencedRelation: "price_ranges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_listing_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_listing_requests_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_photos: {
        Row: {
          created_at: string
          id: string
          order: number
          shop_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          order?: number
          shop_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          order?: number
          shop_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_photos_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_staffs: {
        Row: {
          created_at: string
          id: string
          shop_id: string
          staff_role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shop_id: string
          staff_role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shop_id?: string
          staff_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_staffs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_staffs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_tags: {
        Row: {
          shop_id: string
          tag_id: number
        }
        Insert: {
          shop_id: string
          tag_id: number
        }
        Update: {
          shop_id?: string
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_tags_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_view_events: {
        Row: {
          day: string
          event_type: string
          id: string
          occurred_at: string
          shop_id: string
          source: string | null
          target_id: string | null
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          day?: string
          event_type: string
          id?: string
          occurred_at?: string
          shop_id: string
          source?: string | null
          target_id?: string | null
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          day?: string
          event_type?: string
          id?: string
          occurred_at?: string
          shop_id?: string
          source?: string | null
          target_id?: string | null
          user_id?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_view_events_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_view_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string | null
          area_id: number | null
          average_rating: number | null
          business_hours: Json | null
          city_id: number | null
          closed_days: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          favorite_count: number
          id: string
          instagram_url: string | null
          name: string
          name_pending: string | null
          phone: string | null
          prefecture_id: number | null
          price_range_id: number | null
          review_count: number
          search_vector: unknown
          status: string
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          area_id?: number | null
          average_rating?: number | null
          business_hours?: Json | null
          city_id?: number | null
          closed_days?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          favorite_count?: number
          id?: string
          instagram_url?: string | null
          name: string
          name_pending?: string | null
          phone?: string | null
          prefecture_id?: number | null
          price_range_id?: number | null
          review_count?: number
          search_vector?: unknown
          status?: string
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          area_id?: number | null
          average_rating?: number | null
          business_hours?: Json | null
          city_id?: number | null
          closed_days?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          favorite_count?: number
          id?: string
          instagram_url?: string | null
          name?: string
          name_pending?: string | null
          phone?: string | null
          prefecture_id?: number | null
          price_range_id?: number | null
          review_count?: number
          search_vector?: unknown
          status?: string
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shops_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shops_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shops_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shops_prefecture_id_fkey"
            columns: ["prefecture_id"]
            isOneToOne: false
            referencedRelation: "prefectures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shops_price_range_id_fkey"
            columns: ["price_range_id"]
            isOneToOne: false
            referencedRelation: "price_ranges"
            referencedColumns: ["id"]
          },
        ]
      }
      sizes: {
        Row: {
          code: string
          id: number
          label: string
          order: number
          size_group: string
        }
        Insert: {
          code: string
          id?: number
          label: string
          order?: number
          size_group: string
        }
        Update: {
          code?: string
          id?: number
          label?: string
          order?: number
          size_group?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          shop_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan: string
          shop_id?: string | null
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          shop_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: number
          name: string
          slug: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      wishes: {
        Row: {
          brand_id: string | null
          city_id: number
          created_at: string
          id: string
          is_public: boolean
          item_category_id: number | null
          item_type_id: number | null
          note: string | null
          notify_email: boolean
          prefecture_id: number
          price_range_id: number
          size_id: number | null
          status: string
          tags: string[] | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          city_id: number
          created_at?: string
          id?: string
          is_public?: boolean
          item_category_id?: number | null
          item_type_id?: number | null
          note?: string | null
          notify_email?: boolean
          prefecture_id: number
          price_range_id: number
          size_id?: number | null
          status?: string
          tags?: string[] | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_id?: string | null
          city_id?: number
          created_at?: string
          id?: string
          is_public?: boolean
          item_category_id?: number | null
          item_type_id?: number | null
          note?: string | null
          notify_email?: boolean
          prefecture_id?: number
          price_range_id?: number
          size_id?: number | null
          status?: string
          tags?: string[] | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishes_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishes_item_category_id_fkey"
            columns: ["item_category_id"]
            isOneToOne: false
            referencedRelation: "item_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishes_item_type_id_fkey"
            columns: ["item_type_id"]
            isOneToOne: false
            referencedRelation: "item_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishes_prefecture_id_fkey"
            columns: ["prefecture_id"]
            isOneToOne: false
            referencedRelation: "prefectures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishes_price_range_id_fkey"
            columns: ["price_range_id"]
            isOneToOne: false
            referencedRelation: "price_ranges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishes_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_listing_request: {
        Args: { p_request_id: string }
        Returns: string
      }
      approve_owner_application: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      compute_analytics_for_date: { Args: { p_date: string }; Returns: Json }
      current_app_role: { Args: never; Returns: string }
      delete_expired_notifications: { Args: never; Returns: undefined }
      delete_own_account: { Args: never; Returns: undefined }
      get_share_timeline: {
        Args: {
          p_cursor_id?: string
          p_cursor_ts?: string
          p_limit?: number
          p_offset?: number
          p_tab?: string
        }
        Returns: {
          body: string
          bookmark_count: number
          comment_count: number
          created_at: string
          id: string
          impression_count: number
          ng_score: number
          published_at: string | null
          rating_count: number
          rating_sum: number
          state: string
          status: string
          updated_at: string
          user_id: string
          visibility: string
        }[]
        SetofOptions: {
          from: "*"
          to: "share_posts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_shop_view_analytics: {
        Args: { p_days?: number; p_shop_id: string }
        Returns: Json
      }
      get_shop_wish_analytics: { Args: { p_shop_id: string }; Returns: Json }
      get_wish_recommendations:
        | {
            Args: {
              p_area_id: number
              p_brand_id?: string
              p_item_category_id?: number
              p_item_type_id?: number
              p_price_range_id?: number
            }
            Returns: {
              score: number
              shop_id: string
            }[]
          }
        | {
            Args: {
              p_area_id: number
              p_category_id: number
              p_price_range_id: number
            }
            Returns: {
              matched_count: number
              shop_id: string
            }[]
          }
      is_admin: { Args: never; Returns: boolean }
      notify_admins: {
        Args: {
          p_body: string
          p_link_url: string
          p_metadata?: Json
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      notify_all_users: {
        Args: {
          p_body: string
          p_link_url: string
          p_metadata?: Json
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      notify_wishes_for_shop_item: {
        Args: { p_item_id: string }
        Returns: undefined
      }
      record_share_impression: { Args: { p_post: string }; Returns: undefined }
      record_shop_event: {
        Args: {
          p_event_type: string
          p_shop_id: string
          p_source?: string
          p_target_id?: string
          p_visitor_id: string
        }
        Returns: undefined
      }
      search_shops: {
        Args: {
          p_area_id?: number
          p_category_id?: number
          p_limit?: number
          p_offset?: number
          p_price_range_id?: number
          p_query: string
        }
        Returns: {
          areas: Json
          average_rating: number
          created_at: string
          description: string
          favorite_count: number
          id: string
          name: string
          price_ranges: Json
          rank: number
          review_count: number
          shop_brands: Json
          shop_categories: Json
          shop_photos: Json
          shop_tags: Json
          updated_at: string
        }[]
      }
      share_post_commentable: { Args: { p_post_id: string }; Returns: boolean }
      share_post_ratable: { Args: { p_post_id: string }; Returns: boolean }
      share_post_visible: { Args: { p_post_id: string }; Returns: boolean }
      shop_has_owner: { Args: { p_shop_id: string }; Returns: boolean }
      shop_status: { Args: { p_shop_id: string }; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_own_shop: {
        Args: {
          p_business_hours?: Json
          p_closed_days?: string[]
          p_description?: string
          p_instagram_url?: string
          p_phone?: string
          p_shop_id: string
          p_twitter_url?: string
          p_website_url?: string
        }
        Returns: undefined
      }
      update_shop_as_owner: {
        Args: {
          p_address?: string
          p_business_hours?: Json
          p_city_id?: number
          p_closed_days?: string[]
          p_description?: string
          p_instagram_url?: string
          p_name?: string
          p_phone?: string
          p_prefecture_id?: number
          p_price_range_id?: number
          p_shop_id: string
          p_tiktok_url?: string
          p_twitter_url?: string
          p_website_url?: string
        }
        Returns: string
      }
      upsert_analytics_snapshot: {
        Args: { p_date: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
