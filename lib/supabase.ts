import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Types ──────────────────────────────────────────────────

export interface OwnerSettings {
  id: number
  email: string
  password: string
  whatsapp: string
  site_name: string
  tagline_ar: string
  tagline_fr: string
  shop1_url: string
  shop2_url: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  phone: string
  region: string
  type: string
  notes: string
  status: 'active' | 'inactive'
  code: string
  created_at: string
}

export interface Post {
  id: string
  client_id: string
  type: 'text' | 'image' | 'video' | 'file'
  content: string
  media_url: string | null   // ← ADD THIS LINE
  media_label: string | null
  created_at: string
}

export interface ChecklistItem {
  id: string
  client_id: string
  text: string
  done: boolean
  done_at: string | null
  created_at: string
}

export interface Notification {
  id: string
  text: string
  read: boolean
  created_at: string
}

export interface CalendarEvent {
  id: string
  client_id: string
  type: 'visit' | 'spray' | 'delivery' | 'followup'
  date: string
  time: string
  note: string
  created_at: string
}

export interface Order {
  id: string
  client_id: string
  product: string
  molecule: string
  qty: string
  price: number
  date: string
  created_at: string
}

export interface Article {
  id: string
  category: string
  title: string
  excerpt: string
  body: string
  keywords: string[]
  created_at: string
}

// ── Helper: generate client code ──────────────────────────
export function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'AF-'
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// ── DB helpers ─────────────────────────────────────────────

// Owner
export async function getOwnerSettings(): Promise<OwnerSettings | null> {
  const { data } = await supabase.from('owner_settings').select('*').eq('id', 1).single()
  return data
}
export async function updateOwnerSettings(updates: Partial<OwnerSettings>) {
  return supabase.from('owner_settings').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', 1)
}

// Clients
export async function getClients() {
  return supabase.from('clients').select('*').order('created_at', { ascending: false })
}
export async function getClientByCode(code: string) {
  return supabase.from('clients').select('*').eq('code', code.toUpperCase()).single()
}
export async function createClient_db(data: Omit<Client, 'id' | 'created_at'>) {
  return supabase.from('clients').insert(data).select().single()
}
export async function updateClient_db(id: string, data: Partial<Client>) {
  return supabase.from('clients').update(data).eq('id', id).select().single()
}
export async function deleteClient_db(id: string) {
  return supabase.from('clients').delete().eq('id', id)
}

// Posts
export async function getPosts() {
  return supabase.from('posts').select('*').order('created_at', { ascending: false })
}
export async function getPostsForClient(clientId: string) {
  return supabase.from('posts').select('*')
    .or(`client_id.eq.${clientId},client_id.eq.all`)
    .order('created_at', { ascending: false })
}
export async function createPost(data: Omit<Post, 'id' | 'created_at'>) {
  return supabase.from('posts').insert(data).select().single()
}
export async function deletePost(id: string) {
  return supabase.from('posts').delete().eq('id', id)
}

// Checklist
export async function getChecklistItems() {
  return supabase.from('checklist_items').select('*, clients(name)').order('created_at')
}
export async function getChecklistForClient(clientId: string) {
  return supabase.from('checklist_items').select('*').eq('client_id', clientId).order('created_at')
}
export async function createChecklistItem(data: { client_id: string; text: string }) {
  return supabase.from('checklist_items').insert({ ...data, done: false }).select().single()
}
export async function toggleChecklistItem(id: string, done: boolean) {
  return supabase.from('checklist_items').update({
    done,
    done_at: done ? new Date().toISOString() : null
  }).eq('id', id)
}
export async function deleteChecklistItem(id: string) {
  return supabase.from('checklist_items').delete().eq('id', id)
}

// Notifications
export async function getNotifications() {
  return supabase.from('notifications').select('*').order('created_at', { ascending: false })
}
export async function createNotification(text: string) {
  return supabase.from('notifications').insert({ text, read: false }).select().single()
}
export async function markNotificationRead(id: string) {
  return supabase.from('notifications').update({ read: true }).eq('id', id)
}
export async function markAllNotificationsRead() {
  return supabase.from('notifications').update({ read: true }).eq('read', false)
}

// Calendar
export async function getCalendarEvents() {
  return supabase.from('calendar_events').select('*, clients(name)').order('date')
}
export async function getCalendarEventsForClient(clientId: string) {
  return supabase.from('calendar_events').select('*').eq('client_id', clientId).order('date')
}
export async function createCalendarEvent(data: Omit<CalendarEvent, 'id' | 'created_at'>) {
  return supabase.from('calendar_events').insert(data).select().single()
}
export async function deleteCalendarEvent(id: string) {
  return supabase.from('calendar_events').delete().eq('id', id)
}

// Orders
export async function getOrders() {
  return supabase.from('orders').select('*, clients(name)').order('date', { ascending: false })
}
export async function getOrdersForClient(clientId: string) {
  return supabase.from('orders').select('*').eq('client_id', clientId).order('date', { ascending: false })
}
export async function createOrder(data: Omit<Order, 'id' | 'created_at'>) {
  return supabase.from('orders').insert(data).select().single()
}
export async function deleteOrder(id: string) {
  return supabase.from('orders').delete().eq('id', id)
}

// Articles
export async function getArticles() {
  return supabase.from('articles').select('*').order('created_at', { ascending: false })
}
export async function createArticle(data: Omit<Article, 'id' | 'created_at'>) {
  return supabase.from('articles').insert(data).select().single()
}
export async function deleteArticle(id: string) {
  return supabase.from('articles').delete().eq('id', id)
}
// Storage – Post Media
export async function uploadPostMedia(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('posts-media').upload(path, file)
  if (error) { console.error('Upload error:', error); return null }
  const { data } = supabase.storage.from('posts-media').getPublicUrl(path)
  return data.publicUrl
}
