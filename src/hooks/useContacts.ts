import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Contact, ContactReply } from '@/constants/contact'

export const useMyContacts = () => {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-contacts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100) as unknown as { data: Contact[] | null; error: { message: string } | null }
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })
}

export const useContactReplies = (contactId: string | null) =>
  useQuery({
    queryKey: ['contact-replies', contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_replies')
        .select('id, contact_id, body, replied_by, is_admin_reply, created_at, users:replied_by ( display_name )')
        .eq('contact_id', contactId!)
        .order('created_at', { ascending: true }) as unknown as {
          data: ContactReply[] | null
          error: { message: string } | null
        }
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })
