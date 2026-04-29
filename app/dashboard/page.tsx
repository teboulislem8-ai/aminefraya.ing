'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import {
  getOwnerSettings, updateOwnerSettings,
  getClients, createClient_db, updateClient_db, deleteClient_db, generateCode,
  getPosts, createPost, deletePost,
  getChecklistItems, createChecklistItem, toggleChecklistItem, deleteChecklistItem,
  getNotifications, createNotification, markNotificationRead, markAllNotificationsRead,
  getCalendarEvents, createCalendarEvent, deleteCalendarEvent,
  getOrders, createOrder, deleteOrder,
  getArticles, createArticle, deleteArticle,
  uploadPostMedia,
  type Client, type Post, type ChecklistItem, type Notification,
  type CalendarEvent, type Order, type Article, type OwnerSettings
} from '@/lib/supabase'

import * as XLSX from 'xlsx'


const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
const DAYS_AR = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
const EVT_LABELS: { [k: string]: string } = { visit: 'زيارة ميدانية', spray: 'موعد رش', delivery: 'تسليم طلب', followup: 'متابعة' }
const EVT_CLS: { [k: string]: string } = { visit: '#C0DD97', spray: '#E6D9F7', delivery: '#FAEEDA', followup: '#E6F1FB' }
const EVT_TC: { [k: string]: string } = { visit: '#27500A', spray: '#5B2D8E', delivery: '#854F0B', followup: '#185FA5' }
const CAT_STYLES: { [k: string]: { bg: string; c: string } } = { 'حماية النباتات': { bg: '#EAF3DE', c: '#3B6D11' }, 'التغذية الزراعية': { bg: '#FAEEDA', c: '#854F0B' }, 'الري والمياه': { bg: '#E6F1FB', c: '#185FA5' }, 'المحاصيل الحقلية': { bg: '#FBEAF0', c: '#993556' } }

function Logo() { return (<svg width="24" height="24" viewBox="0 0 110 120" fill="none"><path d="M55 22 C42 18 20 26 8 38 C18 36 34 38 42 44" stroke="#2D6A4F" strokeWidth="5" strokeLinecap="round" fill="none" /><path d="M55 22 C68 18 90 26 102 38 C92 36 76 38 68 44" stroke="#2D6A4F" strokeWidth="5" strokeLinecap="round" fill="none" /><circle cx="55" cy="32" r="9" fill="#2D6A4F" /><ellipse cx="55" cy="52" rx="6" ry="10" fill="#2D6A4F" /></svg>) }

function initials(n: string) { return n.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() }

function Toast({ msg }: { msg: string }) { return msg ? <div style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', background: '#1A2E1A', color: 'white', padding: '9px 22px', borderRadius: 10, fontSize: 12, zIndex: 9999, whiteSpace: 'nowrap' }}>{msg}</div> : null }

export default function DashboardPage() {
  const router = useRouter()
  // Auth
  const [authed, setAuthed] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPw, setLoginPw] = useState('')
  const [loginErr, setLoginErr] = useState(false)
  const [settings, setSettings] = useState<OwnerSettings | null>(null)
  // UI
  const [panel, setPanel] = useState('overview')
  const [toast, setToast] = useState('')
  const [importing, setImporting] = useState(false)
  // Data
  const [clients, setClients] = useState<Client[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [checkItems, setCheckItems] = useState<ChecklistItem[]>([])
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  // Calendar
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calFilter, setCalFilter] = useState('all')
  // Forms
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'file'>('text')
  const [postText, setPostText] = useState('')
  const [postClient, setPostClient] = useState('all')
  const [postFile, setPostFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  // New client modal
  const [showClientModal, setShowClientModal] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [cfName, setCfName] = useState('')
  const [cfPhone, setCfPhone] = useState('')
  const [cfRegion, setCfRegion] = useState('')
  const [cfType, setCfType] = useState('زراعة حبوب')
  const [cfNotes, setCfNotes] = useState('')
  const [cfStatus, setCfStatus] = useState<'active' | 'inactive'>('active')
  const [newCode, setNewCode] = useState('')
  // New order modal
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [ofClient, setOfClient] = useState('')
  const [ofProduct, setOfProduct] = useState('')
  const [ofMolecule, setOfMolecule] = useState('')
  const [ofQty, setOfQty] = useState('')
  const [ofPrice, setOfPrice] = useState('')
  const [ofDate, setOfDate] = useState(new Date().toISOString().slice(0, 10))
  // Checklist
  const [clText, setClText] = useState('')
  const [clClient, setClClient] = useState('')
  // Articles
  const [artTitle, setArtTitle] = useState('')
  const [artCat, setArtCat] = useState('حماية النباتات')
  const [artExcerpt, setArtExcerpt] = useState('')
  const [artBody, setArtBody] = useState('')
  const [artKw, setArtKw] = useState('')
  // Calendar form
  const [evtClient, setEvtClient] = useState('')
  const [evtType, setEvtType] = useState('visit')
  const [evtDate, setEvtDate] = useState(new Date().toISOString().slice(0, 10))
  const [evtTime, setEvtTime] = useState('09:00')
  const [evtNote, setEvtNote] = useState('')
  // Settings
  const [newEmail, setNewEmail] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  // Filters
  const [clSearch, setClSearch] = useState('')
  const [clStatusFilter, setClStatusFilter] = useState('all')
  const [ordClientFilter, setOrdClientFilter] = useState('all')
  const [ordSearch, setOrdSearch] = useState('')

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2800) }

  const loadAll = useCallback(async () => {
    const [c, p, ch, n, e, o, a] = await Promise.all([getClients(), getPosts(), getChecklistItems(), getNotifications(), getCalendarEvents(), getOrders(), getArticles()])
    if (c.data) setClients(c.data)
    if (p.data) setPosts(p.data)
    if (ch.data) setCheckItems(ch.data as ChecklistItem[])
    if (n.data) setNotifs(n.data)
    if (e.data) setEvents(e.data as CalendarEvent[])
    if (o.data) setOrders(o.data as Order[])
    if (a.data) setArticles(a.data)
  }, [])

  const login = async () => {
    const s = await getOwnerSettings()
    if (s && loginEmail === s.email && loginPw === s.password) {
      setSettings(s); setAuthed(true); setLoginErr(false)
      if (clients.length === 0) loadAll()
    } else { setLoginErr(true) }
  }

  useEffect(() => { if (authed) loadAll() }, [authed, loadAll])

  const unread = notifs.filter(n => !n.read).length

  // ── CLIENTS ─────────────────────────────────────────────
  const openAdd = () => { setEditClient(null); setCfName(''); setCfPhone(''); setCfRegion(''); setCfType('زراعة حبوب'); setCfNotes(''); setCfStatus('active'); setNewCode(''); setShowClientModal(true) }
  const openEdit = (c: Client) => { setEditClient(c); setCfName(c.name); setCfPhone(c.phone); setCfRegion(c.region); setCfType(c.type); setCfNotes(c.notes); setCfStatus(c.status); setNewCode(c.code); setShowClientModal(true) }
  const saveClient = async () => {
    if (!cfName.trim()) { showToast('الاسم مطلوب'); return }
    if (editClient) {
      await updateClient_db(editClient.id, { name: cfName, phone: cfPhone, region: cfRegion, type: cfType, notes: cfNotes, status: cfStatus })
      showToast('تم تحديث بيانات العميل ✓')
    } else {
      const code = generateCode()
      await createClient_db({ name: cfName, phone: cfPhone, region: cfRegion, type: cfType, notes: cfNotes, status: cfStatus, code })
      setNewCode(code); showToast('تم إنشاء العميل ✓')
    }
    const { data } = await getClients(); if (data) setClients(data)
    if (editClient) setShowClientModal(false)
  }
  const delClient = async (id: string) => { await deleteClient_db(id); const { data } = await getClients(); if (data) setClients(data); showToast('تم حذف العميل') }
  const regenCode = async (c: Client) => { const code = generateCode(); await updateClient_db(c.id, { code }); const { data } = await getClients(); if (data) setClients(data); showToast('تم توليد رمز جديد: ' + code) }
  const shareWA = (name: string, code: string) => { const msg = encodeURIComponent(`السلام عليكم ${name}،\nرمز دخولك لبوابة aminefraya.ing:\n\n🔑 ${code}\n\nادخل الرمز في الموقع.`); window.open('https://wa.me/213774182227?text=' + msg, '_blank') }
const importExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  setImporting(true)
  const reader = new FileReader()
  reader.onload = async (evt) => {
    const data = evt.target?.result
    const wb = XLSX.read(data, { type: 'binary' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws) as Record<string, string>[]
    let count = 0
    for (const row of rows) {
      const name = row['الاسم'] || row['name'] || ''
      if (!name.trim()) continue
      const code = generateCode()
      await createClient_db({
        name: name.trim(),
        phone: (row['الهاتف'] || row['phone'] || '').trim(),
        region: (row['الولاية'] || row['region'] || '').trim(),
        type: (row['نوع النشاط'] || row['type'] || 'زراعة حبوب').trim(),
        notes: '',
        status: (row['الحالة'] || row['status'] || 'active').trim() as 'active' | 'inactive',
        code
      })
      count++
    }
    const { data: cd } = await getClients()
    if (cd) setClients(cd)
    setImporting(false)
    showToast(`تم استيراد ${count} عميل ✔`)
  }
  reader.readAsBinaryString(file)
  e.target.value = ''
}
  const filteredClients = clients.filter(c => {
    const mq = !clSearch || c.name.toLowerCase().includes(clSearch) || c.phone.includes(clSearch)
    const ms = clStatusFilter === 'all' || c.status === clStatusFilter
    return mq && ms
  })

  // ── POSTS ────────────────────────────────────────────────
  const publishPost = async () => {
    if (!postText.trim() && !postFile) { showToast('اكتب محتوى أو أرفق ملفاً'); return }
    let media_url: string | null = null
    let media_label: string | null = null
    if (postFile) {
      setUploading(true)
      showToast('جارٍ رفع الملف...')
      media_url = await uploadPostMedia(postFile)
      setUploading(false)
      if (!media_url) { showToast('فشل رفع الملف ✗'); return }
      media_label = postFile.name
    }
    await createPost({ client_id: postClient, type: postType, content: postText, media_url, media_label })
    setPostText(''); setPostFile(null)
    const { data } = await getPosts(); if (data) setPosts(data)
    showToast('تم نشر المنشور ✔')
  }
  const delPost = async (id: string) => { await deletePost(id); const { data } = await getPosts(); if (data) setPosts(data) }
  // ── CHECKLIST ────────────────────────────────────────────
  const addCl = async () => {
    if (!clText.trim() || !clClient) { showToast('اكتب البند واختر العميل'); return }
    await createChecklistItem({ client_id: clClient, text: clText })
    setClText(''); const { data } = await getChecklistItems(); if (data) setCheckItems(data as ChecklistItem[]); showToast('تم إضافة البند ✓')
  }
  const toggleCl = async (item: ChecklistItem) => {
    await toggleChecklistItem(item.id, !item.done)
    if (!item.done) {
      const cl = clients.find(c => c.id === item.client_id)
      await createNotification(`${cl?.name || 'عميل'} أكمل بند "${item.text}"`)
      const { data: nd } = await getNotifications(); if (nd) setNotifs(nd)
    }
    const { data } = await getChecklistItems(); if (data) setCheckItems(data as ChecklistItem[])
  }
  const delCl = async (id: string) => { await deleteChecklistItem(id); const { data } = await getChecklistItems(); if (data) setCheckItems(data as ChecklistItem[]) }
  const clGrouped = checkItems.reduce((acc, item) => { const cl = clients.find(c => c.id === item.client_id); const name = cl?.name || item.client_id; if (!acc[item.client_id]) acc[item.client_id] = { name, items: [] }; acc[item.client_id].items.push(item); return acc }, {} as Record<string, { name: string; items: ChecklistItem[] }>)

  // ── NOTIFICATIONS ─────────────────────────────────────────
  const markRead = async (id: string) => { await markNotificationRead(id); const { data } = await getNotifications(); if (data) setNotifs(data) }
  const markAll = async () => { await markAllNotificationsRead(); const { data } = await getNotifications(); if (data) setNotifs(data) }

  // ── CALENDAR ─────────────────────────────────────────────
  const addEvt = async () => {
    if (!evtDate || !evtClient) { showToast('اختر العميل والتاريخ'); return }
    await createCalendarEvent({ client_id: evtClient, type: evtType as CalendarEvent['type'], date: evtDate, time: evtTime, note: evtNote })
    setEvtNote(''); const { data } = await getCalendarEvents(); if (data) setEvents(data as CalendarEvent[]); showToast('تم إضافة الموعد ✓')
  }
  const delEvt = async (id: string) => { await deleteCalendarEvent(id); const { data } = await getCalendarEvents(); if (data) setEvents(data as CalendarEvent[]) }

  const renderCal = () => {
    const today = new Date().toISOString().slice(0, 10)
    const first = new Date(calYear, calMonth, 1).getDay()
    const dim = new Date(calYear, calMonth + 1, 0).getDate()
    const prev = new Date(calYear, calMonth, 0).getDate()
    const cells = []
    for (let i = 0; i < first; i++)cells.push(<div key={`p${i}`} style={{ minHeight: 52, borderRadius: 6, padding: 4, background: '#F8F5F0', opacity: .3 }}><div style={{ fontSize: 11, color: '#9CA89C' }}>{prev - first + i + 1}</div></div>)
    for (let d = 1; d <= dim; d++) {
      const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dayEvts = events.filter(e => e.date === ds && (calFilter === 'all' || e.client_id === calFilter))
      const isT = ds === today
      cells.push(
        <div key={d} style={{ minHeight: 52, borderRadius: 6, padding: 4, background: isT ? '#EAF3DE' : '#F8F5F0', border: isT ? '.5px solid #C0DD97' : dayEvts.length ? '.5px solid #2D6A4F' : 'none' }}>
          <div style={{ fontSize: 11, color: isT ? '#2D6A4F' : '#9CA89C', fontWeight: isT ? 700 : 400, marginBottom: 2 }}>{d}</div>
          {dayEvts.slice(0, 2).map((e, i) => <div key={i} style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, marginBottom: 1, background: EVT_CLS[e.type], color: EVT_TC[e.type], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{EVT_LABELS[e.type]?.slice(0, 4)}</div>)}
        </div>
      )
    }
    const rem = (7 - ((first + dim) % 7)) % 7
    for (let i = 1; i <= rem; i++)cells.push(<div key={`n${i}`} style={{ minHeight: 52, borderRadius: 6, padding: 4, background: '#F8F5F0', opacity: .3 }}><div style={{ fontSize: 11, color: '#9CA89C' }}>{i}</div></div>)
    return cells
  }

  const upcomingEvts = events.filter(e => { const t = new Date().toISOString().slice(0, 10); return e.date >= t && (calFilter === 'all' || e.client_id === calFilter) }).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6)

  // ── ORDERS ────────────────────────────────────────────────
  const addOrder = async () => {
    if (!ofProduct || !ofMolecule || !ofClient) { showToast('المنتج والمادة الفعالة والعميل مطلوبون'); return }
    await createOrder({ client_id: ofClient, product: ofProduct, molecule: ofMolecule, qty: ofQty, price: parseFloat(ofPrice) || 0, date: ofDate })
    setShowOrderModal(false); setOfProduct(''); setOfMolecule(''); setOfQty(''); setOfPrice('')
    const { data } = await getOrders(); if (data) setOrders(data as Order[]); showToast('تم حفظ الطلب ✓')
  }
  const delOrder = async (id: string) => { await deleteOrder(id); const { data } = await getOrders(); if (data) setOrders(data as Order[]) }
  const filteredOrders = orders.filter(o => { const mc = ordClientFilter === 'all' || o.client_id === ordClientFilter; const mq = !ordSearch || o.product.toLowerCase().includes(ordSearch) || o.molecule.toLowerCase().includes(ordSearch); return mc && mq })
  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || id

  // ── ARTICLES ────────────────────────────────────────────
  const pubArt = async () => {
    if (!artTitle || !artExcerpt || !artBody) { showToast('العنوان والملخص والمحتوى مطلوبة'); return }
    await createArticle({ category: artCat, title: artTitle, excerpt: artExcerpt, body: artBody, keywords: artKw.split(',').map(k => k.trim()).filter(Boolean) })
    setArtTitle(''); setArtExcerpt(''); setArtBody(''); setArtKw('')
    const { data } = await getArticles(); if (data) setArticles(data); showToast('تم نشر المقالة ✓')
  }
  const delArt = async (id: string) => { await deleteArticle(id); const { data } = await getArticles(); if (data) setArticles(data) }

  // ── SETTINGS ─────────────────────────────────────────────
  const saveSettings = async () => {
    if (newPw && newPw !== confirmPw) { showToast('كلمتا المرور غير متطابقتين'); return }
    const updates: Partial<OwnerSettings> = {}
    if (newEmail) updates.email = newEmail
    if (newPw) updates.password = newPw
    await updateOwnerSettings(updates)
    showToast('تم حفظ التغييرات ✓'); setNewEmail(''); setNewPw(''); setConfirmPw('')
  }

  // ── STYLES ────────────────────────────────────────────────
  const B = { background: '#fff', border: '.5px solid #E4E0DA', borderRadius: 14, padding: '1rem', marginBottom: '1rem' } as React.CSSProperties
  const FI = { width: '100%', padding: '8px 10px', border: '.5px solid #D0CCC6', borderRadius: 6, fontSize: 12, background: '#F8F5F0', color: '#1A2E1A', direction: 'rtl' as const, fontFamily: 'inherit' } as React.CSSProperties
  const BSave = { padding: '8px 20px', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' } as React.CSSProperties
  const BDel = { padding: '5px', fontSize: 11, border: '.5px solid #D0CCC6', borderRadius: 6, background: 'transparent', color: '#5F6B5F', cursor: 'pointer', flex: 1 } as React.CSSProperties

  // ── LOGIN ─────────────────────────────────────────────────
  if (!authed) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8F5F0' }}>
      <div style={{ background: '#fff', border: '.5px solid #E4E0DA', borderRadius: 14, padding: '2.2rem', width: '100%', maxWidth: 360, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: 28 }}>🌿</div>
        <div style={{ fontSize: 18, fontWeight: 600, textAlign: 'center', marginBottom: 4 }}>لوحة تحكم المدير</div>
        <div style={{ fontSize: 12, color: '#5F6B5F', textAlign: 'center', marginBottom: '1.8rem', lineHeight: 1.6 }}>للوصول المخصص لصاحب العمل فقط</div>
        <div style={{ marginBottom: '1rem' }}><label className="f-label">البريد الإلكتروني</label><input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="example@gmail.com" style={{ ...FI, direction: 'ltr', textAlign: 'right' }} /></div>
        <div style={{ marginBottom: '1rem' }}><label className="f-label">كلمة المرور</label><input type="password" value={loginPw} onChange={e => setLoginPw(e.target.value)} placeholder="••••••••" onKeyDown={e => { if (e.key === 'Enter') login() }} style={{ ...FI, direction: 'ltr', textAlign: 'right' }} /></div>
        <button onClick={login} style={{ width: '100%', padding: 11, background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>دخول ←</button>
        {loginErr && <div style={{ fontSize: 12, color: '#A32D2D', background: '#FCEBEB', border: '.5px solid #F09595', borderRadius: 6, padding: '8px 12px', marginTop: '.8rem', textAlign: 'center' }}>بريد إلكتروني أو كلمة مرور خاطئة</div>}
      </div>
    </div>
  )

  // ── DASHBOARD ─────────────────────────────────────────────
  const PANELS = [
    { id: 'overview', icon: '📊', label: 'نظرة عامة' },
    { id: 'clients', icon: '👥', label: 'العملاء' },
    { id: 'posts', icon: '📝', label: 'المنشورات' },
    { id: 'checklist', icon: '✅', label: 'قوائم المهام' },
    { id: 'notifications', icon: '🔔', label: 'الإشعارات', badge: unread },
    { id: 'calendar', icon: '📅', label: 'التقويم' },
    { id: 'orders', icon: '📦', label: 'الطلبات' },
    { id: 'articles', icon: '📚', label: 'المقالات' },
    { id: 'settings', icon: '⚙️', label: 'الإعدادات' },
  ]

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '.5px solid #E4E0DA', background: '#fff', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => router.push('/')}><Logo /><span style={{ fontSize: 14, fontWeight: 600, color: '#2D6A4F' }}>aminefraya.ing</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, background: '#EAF3DE', color: '#27500A', padding: '3px 10px', borderRadius: 10, fontWeight: 500 }}>مدير النظام</span>
          <button onClick={() => setAuthed(false)} style={{ fontSize: 11, padding: '4px 12px', border: '.5px solid #D0CCC6', borderRadius: 10, background: 'transparent', cursor: 'pointer', color: '#5F6B5F' }}>خروج</button>
        </div>
      </nav>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 53px)' }}>
        {/* Sidebar */}
        <div style={{ width: 190, flexShrink: 0, borderLeft: '.5px solid #E4E0DA', background: '#fff', padding: '1rem 0' }}>
          {PANELS.map(p => (
            <div key={p.id} onClick={() => setPanel(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 16px', fontSize: 13, cursor: 'pointer', color: panel === p.id ? '#2D6A4F' : '#5F6B5F', borderRight: panel === p.id ? '3px solid #2D6A4F' : '3px solid transparent', background: panel === p.id ? '#EAF3DE' : 'transparent' }}>
              <span>{p.icon}</span>
              <span>{p.label}</span>
              {p.badge && p.badge > 0 ? <span style={{ marginRight: 'auto', width: 16, height: 16, background: '#E05A2B', color: 'white', borderRadius: '50%', fontSize: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{p.badge}</span> : null}
            </div>
          ))}
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>

          {/* OVERVIEW */}
          {panel === 'overview' && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: '1.2rem' }}>نظرة عامة</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: '1.5rem' }}>
                {[{ n: clients.filter(c => c.status === 'active').length, l: 'عملاء نشطون' }, { n: posts.length, l: 'منشور' }, { n: checkItems.filter(i => !i.done).length, l: 'مهام معلّقة' }, { n: orders.filter(o => o.date.startsWith(new Date().toISOString().slice(0, 7))).length, l: 'طلبات الشهر' }].map((s, i) => (
                  <div key={i} style={{ background: '#F8F5F0', borderRadius: 10, padding: '.8rem', textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 600, color: '#2D6A4F' }}>{s.n}</div><div style={{ fontSize: 11, color: '#9CA89C', marginTop: 3 }}>{s.l}</div></div>
                ))}
              </div>
              <div className="section-sep">آخر الإشعارات</div>
              {notifs.slice(0, 5).map(n => (
                <div key={n.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '.7rem 1rem', background: n.read ? '#fff' : '#EAF3DE', border: `.5px solid ${n.read ? '#E4E0DA' : '#C0DD97'}`, borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.read ? '#D0CCC6' : '#2D6A4F', flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 13 }}>{n.text}</div>
                  <div style={{ fontSize: 10, color: '#9CA89C' }}>{new Date(n.created_at).toLocaleDateString('ar-DZ')}</div>
                </div>
              ))}
            </div>
          )}

          {/* CLIENTS */}
          {panel === 'clients' && (
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
  <div style={{fontSize:15,fontWeight:600}}>إدارة العملاء</div>
  <div style={{display:'flex',gap:8}}>
   <label style={{...BSave, opacity: importing ? 0.6 : 1, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4}}>
      {importing ? 'جارٍ الاستيراد...' : '📥 استيراد Excel'}
      <input type="file" accept=".xlsx,.xls" onChange={importExcel} style={{display:'none'}}/>
    </label>
    <button onClick={openAdd} style={BSave}>+ عميل جديد</button>
  </div>
</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input value={clSearch} onChange={e => setClSearch(e.target.value)} placeholder="ابحث بالاسم أو الهاتف..." style={{ ...FI, flex: 1, maxWidth: 260 }} />
                <select value={clStatusFilter} onChange={e => setClStatusFilter(e.target.value)} style={FI}><option value="all">الكل</option><option value="active">نشط</option><option value="inactive">غير نشط</option></select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                {filteredClients.map(c => (
                  <div key={c.id} style={B}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '.8rem' }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#2D6A4F', flexShrink: 0 }}>{initials(c.name)}</div>
                      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 11, color: '#5F6B5F' }}>{c.phone}</div></div>
                      <span className={c.status === 'active' ? 'badge-active' : 'badge-inactive'}>{c.status === 'active' ? 'نشط' : 'غير نشط'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: '.7rem' }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: '#F8F5F0', color: '#5F6B5F' }}>📍 {c.region}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: '#F8F5F0', color: '#5F6B5F' }}>🌾 {c.type}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8F5F0', borderRadius: 6, padding: '6px 10px', marginBottom: '.7rem' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.12em', color: '#2D6A4F', flex: 1, fontFamily: 'monospace' }}>{c.code}</span>
                      <button onClick={() => { navigator.clipboard.writeText(c.code); showToast('تم نسخ الرمز ✓') }} style={{ fontSize: 10, padding: '3px 8px', border: '.5px solid #D0CCC6', borderRadius: 5, background: 'transparent', cursor: 'pointer', color: '#5F6B5F' }}>نسخ</button>
                      <button onClick={() => shareWA(c.name, c.code)} style={{ fontSize: 10, padding: '3px 8px', border: '.5px solid #D0CCC6', borderRadius: 5, background: 'transparent', cursor: 'pointer', color: '#5F6B5F' }}>واتساب</button>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(c)} style={BDel}>✏️ تعديل</button>
                      <button onClick={() => regenCode(c)} style={BDel}>🔄 رمز</button>
                      <button onClick={() => delClient(c.id)} style={{ ...BDel, color: '#A32D2D' }}>🗑 حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* POSTS */}
          {panel === 'posts' && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: '1.2rem' }}>المنشورات</div>
              <div style={B}>
                <div style={{ display: 'flex', gap: 6, marginBottom: '.8rem', flexWrap: 'wrap' }}>
                  {(['text', 'image', 'video', 'file'] as const).map(t => (
                    <button key={t} onClick={() => setPostType(t)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', border: '.5px solid #D0CCC6', borderRadius: 20, fontSize: 11, background: postType === t ? '#2D6A4F' : 'transparent', color: postType === t ? 'white' : '#5F6B5F', cursor: 'pointer' }}>
                      {t === 'text' ? '✏️ نص' : t === 'image' ? '🖼 صورة' : t === 'video' ? '🎥 فيديو' : '📎 ملف'}
                    </button>
                  ))}
                </div>
                <textarea value={postText} onChange={e => setPostText(e.target.value)} placeholder="اكتب منشورك هنا..." style={{ ...FI, height: 80, resize: 'none', marginBottom: '.8rem' }} />
                {postType !== 'text' && (
                  <div style={{ marginBottom: '.8rem' }}>
                    <label style={{ fontSize: 11, color: '#5F6B5F', display: 'block', marginBottom: 4 }}>
                      {postType === 'image' ? '📷 اختر صورة' : postType === 'video' ? '🎥 اختر فيديو' : '📎 اختر ملفاً'}
                    </label>
                    <input
                      type="file"
                      accept={postType === 'image' ? 'image/*' : postType === 'video' ? 'video/*' : '*/*'}
                      onChange={e => setPostFile(e.target.files?.[0] || null)}
                      style={{ fontSize: 12, color: '#5F6B5F', width: '100%' }}
                    />
                    {postFile && (
                      <div style={{ fontSize: 11, color: '#2D6A4F', marginTop: 4 }}>
                        ✔ {postFile.name} ({(postFile.size / 1024).toFixed(0)} KB)
                      </div>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <select value={postClient} onChange={e => setPostClient(e.target.value)} style={{ ...FI, width: 'auto' }}>
                    <option value="all">📢 جميع العملاء</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button onClick={publishPost} disabled={uploading} style={{ ...BSave, opacity: uploading ? .6 : 1 }}>{uploading ? 'جارٍ الرفع...' : 'نشر'}</button>
                </div>
              </div>
              <div className="section-sep">المنشورات الأخيرة</div>
              {posts.map(p => {
                const TB: { [k: string]: { cls: string; lbl: string } } = { text: { cls: '#EAF3DE|#3B6D11', lbl: 'نص' }, image: { cls: '#E6F1FB|#185FA5', lbl: 'صورة' }, video: { cls: '#FBEAF0|#993556', lbl: 'فيديو' }, file: { cls: '#FAEEDA|#854F0B', lbl: 'ملف' } }
                const tb = TB[p.type] || TB.text; const [tbg, tc] = tb.cls.split('|')
                const cl = clients.find(c => c.id === p.client_id)
                return (
                  <div key={p.id} style={{ ...B, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '.6rem' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#2D6A4F' }}>{(cl?.name || 'ع').slice(0, 2)}</div>
                      <div><div style={{ fontSize: 12, fontWeight: 600 }}>إلى: {cl?.name || 'جميع العملاء'}</div><div style={{ fontSize: 10, color: '#9CA89C' }}>{new Date(p.created_at).toLocaleString('ar-DZ')}</div></div>
                      <span style={{ marginRight: 'auto', fontSize: 10, padding: '2px 7px', borderRadius: 8, background: tbg, color: tc }}>{tb.lbl}</span>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.7, color: '#5F6B5F', marginBottom: '.5rem' }}>{p.content}</div>
                    {p.media_url && p.type === 'image' && (
                      <img src={p.media_url} alt={p.media_label || ''} style={{ maxWidth: '100%', borderRadius: 8, marginBottom: '.5rem', display: 'block' }} />
                    )}
                    {p.media_url && p.type === 'video' && (
                      <video src={p.media_url} controls style={{ maxWidth: '100%', borderRadius: 8, marginBottom: '.5rem', display: 'block' }} />
                    )}
                    {p.media_url && p.type === 'file' && (
                      <a href={p.media_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#185FA5', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: '.5rem' }}>
                        📎 {p.media_label || 'تحميل الملف'}
                      </a>
                    )}
                    <button onClick={() => delPost(p.id)} style={{ fontSize: 11, padding: '4px 10px', border: '.5px solid #D0CCC6', borderRadius: 6, background: 'transparent', cursor: 'pointer', color: '#5F6B5F' }}>🗑 حذف</button>
                  </div>
                )
              })}
            </div>
          )}

          {/* CHECKLIST */}
          {panel === 'checklist' && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: '1.2rem' }}>قوائم المهام</div>
              <div style={B}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '.8rem' }}>إضافة بند جديد</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: '.7rem', flexWrap: 'wrap' }}>
                  <input value={clText} onChange={e => setClText(e.target.value)} placeholder="مثال: رش المبيد الأول..." style={{ ...FI, flex: 1 }} />
                  <select value={clClient} onChange={e => setClClient(e.target.value)} style={{ ...FI, width: 'auto' }}>
                    <option value="">اختر العميل</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button onClick={addCl} style={BSave}>+ إضافة</button>
                </div>
                <div style={{ fontSize: 11, color: '#5F6B5F' }}>عند إكمال العميل أي بند تصلك إشعار فوري.</div>
              </div>
              <div className="section-sep">قوائم المهام النشطة</div>
              {Object.entries(clGrouped).map(([cid, g]) => {
                const done = g.items.filter(i => i.done).length; const pct = Math.round(done / g.items.length * 100)
                return (
                  <div key={cid} style={{ ...B, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.7rem' }}><div style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</div><div style={{ fontSize: 11, color: '#5F6B5F' }}>{done}/{g.items.length} ({pct}%)</div></div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                    {g.items.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '.5px solid #E4E0DA' }}>
                        <div onClick={() => toggleCl(item)} style={{ width: 18, height: 18, border: `.5px solid ${item.done ? '#2D6A4F' : '#D0CCC6'}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: item.done ? '#2D6A4F' : 'transparent', cursor: 'pointer' }}>
                          {item.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                        </div>
                        <div style={{ flex: 1, fontSize: 13, textDecoration: item.done ? 'line-through' : 'none', color: item.done ? '#9CA89C' : '#1A2E1A' }}>{item.text}</div>
                        <button onClick={() => delCl(item.id)} style={{ background: 'none', border: 'none', fontSize: 12, color: '#9CA89C', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {/* NOTIFICATIONS */}
          {panel === 'notifications' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>الإشعارات</div>
                <button onClick={markAll} style={{ fontSize: 11, padding: '4px 12px', border: '.5px solid #D0CCC6', borderRadius: 10, background: 'transparent', cursor: 'pointer', color: '#5F6B5F' }}>تحديد الكل كمقروء</button>
              </div>
              {notifs.map(n => (
                <div key={n.id} onClick={() => markRead(n.id)} style={{ display: 'flex', gap: 10, padding: '.8rem', background: n.read ? '#fff' : '#EAF3DE', border: `.5px solid ${n.read ? '#E4E0DA' : '#C0DD97'}`, borderRadius: 14, marginBottom: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.read ? '#D0CCC6' : '#2D6A4F', flexShrink: 0, marginTop: 4 }} />
                  <div><div style={{ fontSize: 13, lineHeight: 1.6 }}>{n.text}</div><div style={{ fontSize: 10, color: '#9CA89C', marginTop: 2 }}>{new Date(n.created_at).toLocaleString('ar-DZ')}</div></div>
                </div>
              ))}
            </div>
          )}

          {/* CALENDAR */}
          {panel === 'calendar' && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: '1.2rem' }}>التقويم</div>
              <div style={B}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '.8rem' }}>إضافة موعد</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '.8rem' }}>
                  <div><label className="f-label">العميل</label><select value={evtClient} onChange={e => setEvtClient(e.target.value)} style={FI}><option value="">اختر عميل</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                  <div><label className="f-label">نوع الموعد</label><select value={evtType} onChange={e => setEvtType(e.target.value)} style={FI}><option value="visit">زيارة ميدانية</option><option value="spray">موعد رش</option><option value="delivery">تسليم طلب</option><option value="followup">متابعة</option></select></div>
                  <div><label className="f-label">التاريخ</label><input type="date" value={evtDate} onChange={e => setEvtDate(e.target.value)} style={FI} /></div>
                  <div><label className="f-label">الوقت</label><input type="time" value={evtTime} onChange={e => setEvtTime(e.target.value)} style={FI} /></div>
                </div>
                <div style={{ marginBottom: '.8rem' }}><label className="f-label">ملاحظة</label><input value={evtNote} onChange={e => setEvtNote(e.target.value)} placeholder="تفاصيل الموعد..." style={FI} /></div>
                <button onClick={addEvt} style={BSave}>+ إضافة للتقويم</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }} style={{ width: 28, height: 28, border: '.5px solid #D0CCC6', borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#5F6B5F' }}>‹</button>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{MONTHS_AR[calMonth]} {calYear}</span>
                  <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }} style={{ width: 28, height: 28, border: '.5px solid #D0CCC6', borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#5F6B5F' }}>›</button>
                </div>
                <select value={calFilter} onChange={e => setCalFilter(e.target.value)} style={{ ...FI, width: 'auto' }}>
                  <option value="all">جميع العملاء</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: '1rem' }}>
                {DAYS_AR.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#9CA89C', padding: '4px 0', fontWeight: 500 }}>{d}</div>)}
                {renderCal()}
              </div>
              <div className="section-sep">المواعيد القادمة</div>
              {upcomingEvts.map(e => {
                const cl = clients.find(c => c.id === e.client_id); const d = new Date(e.date)
                return (
                  <div key={e.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '.7rem', background: '#fff', border: '.5px solid #E4E0DA', borderRadius: 10, marginBottom: 8 }}>
                    <div style={{ textAlign: 'center', background: '#EAF3DE', borderRadius: 6, padding: '4px 8px', minWidth: 44, flexShrink: 0 }}><div style={{ fontSize: 17, fontWeight: 600, color: '#2D6A4F', lineHeight: 1 }}>{d.getDate()}</div><div style={{ fontSize: 10, color: '#3B6D11' }}>{MONTHS_AR[d.getMonth()].slice(0, 3)}</div></div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{EVT_LABELS[e.type]} — {cl?.name}</div><div style={{ fontSize: 11, color: '#5F6B5F', marginTop: 2 }}>{e.time}{e.note ? ` · ${e.note}` : ''}</div></div>
                    <button onClick={() => delEvt(e.id)} style={{ background: 'none', border: 'none', fontSize: 12, color: '#9CA89C', cursor: 'pointer' }}>✕</button>
                  </div>
                )
              })}
            </div>
          )}

          {/* ORDERS */}
          {panel === 'orders' && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: '1rem' }}>سجل الطلبات</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: '1rem' }}>
                {[{ n: orders.length, l: 'إجمالي الطلبات' }, { n: orders.filter(o => o.date.startsWith(new Date().toISOString().slice(0, 7))).length, l: 'هذا الشهر' }, { n: orders.reduce((s, o) => s + Number(o.price), 0).toLocaleString(), l: 'الإيرادات (دج)' }].map((s, i) => (
                  <div key={i} style={{ background: '#F8F5F0', borderRadius: 10, padding: '.8rem', textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 600, color: '#2D6A4F' }}>{s.n}</div><div style={{ fontSize: 10, color: '#9CA89C', marginTop: 2 }}>{s.l}</div></div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
                <select value={ordClientFilter} onChange={e => setOrdClientFilter(e.target.value)} style={{ ...FI, width: 'auto' }}><option value="all">جميع العملاء</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <input value={ordSearch} onChange={e => setOrdSearch(e.target.value)} placeholder="ابحث بالمنتج أو المادة..." style={{ ...FI, flex: 1 }} />
                <button onClick={() => { setOfClient(clients[0]?.id || ''); setShowOrderModal(true) }} style={BSave}>+ طلب جديد</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr>{['العميل', 'المنتج', 'المادة الفعالة', 'الكمية', 'السعر (دج)', 'التاريخ', ''].map(h => <th key={h} style={{ textAlign: 'right', padding: '8px 10px', borderBottom: '.5px solid #E4E0DA', fontSize: 11, color: '#9CA89C', fontWeight: 600, background: '#F8F5F0' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o.id} style={{ borderBottom: '.5px solid #E4E0DA' }}>
                        <td style={{ padding: '8px 10px' }}>{getClientName(o.client_id)}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{o.product}</td>
                        <td style={{ padding: '8px 10px' }}><span className="mol-badge">{o.molecule}</span></td>
                        <td style={{ padding: '8px 10px' }}>{o.qty || '—'}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#2D6A4F' }}>{Number(o.price).toLocaleString()}</td>
                        <td style={{ padding: '8px 10px' }}>{o.date}</td>
                        <td style={{ padding: '8px 10px' }}><button onClick={() => delOrder(o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#9CA89C' }}>🗑</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.8rem 1rem', background: '#EAF3DE', borderRadius: 10, marginTop: '.8rem', fontSize: 13 }}>
                <span>الإجمالي المعروض</span>
                <span style={{ fontWeight: 600, color: '#2D6A4F', fontSize: 15 }}>{filteredOrders.reduce((s, o) => s + Number(o.price), 0).toLocaleString()} دج</span>
              </div>
            </div>
          )}

          {/* ARTICLES */}
          {panel === 'articles' && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: '1.2rem' }}>إدارة المقالات</div>
              <div style={B}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '.9rem', paddingBottom: '.6rem', borderBottom: '.5px solid #E4E0DA' }}>نشر مقالة جديدة</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '.8rem' }}>
                  <div><label className="f-label">عنوان المقالة *</label><input value={artTitle} onChange={e => setArtTitle(e.target.value)} placeholder="عنوان المقالة..." style={FI} /></div>
                  <div><label className="f-label">التصنيف</label><select value={artCat} onChange={e => setArtCat(e.target.value)} style={FI}>{Object.keys(CAT_STYLES).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <div style={{ marginBottom: '.8rem' }}><label className="f-label">ملخص قصير *</label><textarea value={artExcerpt} onChange={e => setArtExcerpt(e.target.value)} placeholder="ملخص يظهر في بطاقة المقالة..." style={{ ...FI, height: 65, resize: 'none' }} /></div>
                <div style={{ marginBottom: '.8rem' }}><label className="f-label">المحتوى الكامل *</label><textarea value={artBody} onChange={e => setArtBody(e.target.value)} placeholder="المحتوى العلمي الكامل..." style={{ ...FI, height: 100, resize: 'none' }} /></div>
                <div style={{ marginBottom: '.8rem' }}><label className="f-label">الكلمات المفتاحية (مفصولة بفاصلة)</label><input value={artKw} onChange={e => setArtKw(e.target.value)} placeholder="مثال: قمح، مبيدات، تربة" style={FI} /></div>
                <button onClick={pubArt} style={BSave}>نشر المقالة</button>
              </div>
              <div className="section-sep">المقالات المنشورة</div>
              {articles.map(a => {
                const cs = CAT_STYLES[a.category] || { bg: '#F1EFE8', c: '#5F5E5A' }; return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '.8rem 1rem', background: '#fff', border: '.5px solid #E4E0DA', borderRadius: 10, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{a.title}</div><span style={{ fontSize: 10, padding: '1px 8px', borderRadius: 8, background: cs.bg, color: cs.c, fontWeight: 500 }}>{a.category}</span></div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: '#9CA89C' }}>{new Date(a.created_at).toLocaleDateString('ar-DZ')}</span>
                      <button onClick={() => delArt(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9CA89C' }}>🗑</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* SETTINGS */}
          {panel === 'settings' && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: '1.2rem' }}>الإعدادات</div>
              <div style={B}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '1rem', paddingBottom: '.6rem', borderBottom: '.5px solid #E4E0DA' }}>تغيير بيانات الحساب</div>
                <div style={{ marginBottom: '.8rem' }}><label className="f-label">البريد الإلكتروني الجديد</label><input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder={settings?.email || 'example@gmail.com'} style={{ ...FI, direction: 'ltr', textAlign: 'right' }} /></div>
                <div style={{ marginBottom: '.8rem' }}><label className="f-label">كلمة المرور الجديدة</label><input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" style={{ ...FI, direction: 'ltr', textAlign: 'right' }} /></div>
                <div style={{ marginBottom: '.8rem' }}><label className="f-label">تأكيد كلمة المرور</label><input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" style={{ ...FI, direction: 'ltr', textAlign: 'right' }} /></div>
                <button onClick={saveSettings} style={BSave}>حفظ التغييرات</button>
              </div>
              <div style={B}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '1rem', paddingBottom: '.6rem', borderBottom: '.5px solid #E4E0DA' }}>معلومات العمل</div>
                <div style={{ marginBottom: '.8rem' }}><label className="f-label">رقم الواتساب</label><input defaultValue="+213774182227" style={{ ...FI, direction: 'ltr', textAlign: 'right' }} /></div>
                <div style={{ marginBottom: '.8rem' }}><label className="f-label">اسم الموقع</label><input defaultValue="aminefraya.ing" style={FI} /></div>
                <button style={BSave}>حفظ</button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* CLIENT MODAL */}
      {showClientModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 20 }} onClick={e => { if (e.target === e.currentTarget && editClient) setShowClientModal(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420, border: '.5px solid #E4E0DA', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.2rem', borderBottom: '.5px solid #E4E0DA' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{editClient ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</div>
              {editClient && <button onClick={() => setShowClientModal(false)} style={{ width: 26, height: 26, border: '.5px solid #D0CCC6', borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#5F6B5F' }}>✕</button>}
            </div>
            <div style={{ padding: '1.2rem' }}>
              <div style={{ marginBottom: '.9rem' }}><label className="f-label">الاسم الكامل *</label><input value={cfName} onChange={e => setCfName(e.target.value)} placeholder="محمد بن علي" style={FI} /></div>
              <div style={{ marginBottom: '.9rem' }}><label className="f-label">رقم الهاتف</label><input value={cfPhone} onChange={e => setCfPhone(e.target.value)} placeholder="+213 6XX XXX XXX" style={{ ...FI, direction: 'ltr', textAlign: 'right' }} /></div>
              <div style={{ marginBottom: '.9rem' }}><label className="f-label">الولاية / المنطقة</label><input value={cfRegion} onChange={e => setCfRegion(e.target.value)} placeholder="قسنطينة..." style={FI} /></div>
              <div style={{ marginBottom: '.9rem' }}><label className="f-label">نوع النشاط</label><select value={cfType} onChange={e => setCfType(e.target.value)} style={FI}>{['زراعة حبوب', 'بستنة وخضروات', 'أشجار مثمرة', 'تربية مواشي', 'زراعة متنوعة'].map(t => <option key={t}>{t}</option>)}</select></div>
              <div style={{ marginBottom: '.9rem' }}><label className="f-label">ملاحظات</label><textarea value={cfNotes} onChange={e => setCfNotes(e.target.value)} placeholder="معلومات إضافية..." style={{ ...FI, height: 65, resize: 'none' }} /></div>
              <div style={{ marginBottom: '.9rem' }}><label className="f-label">الحالة</label><select value={cfStatus} onChange={e => setCfStatus(e.target.value as 'active' | 'inactive')} style={FI}><option value="active">نشط</option><option value="inactive">غير نشط</option></select></div>
              {newCode && (
                <div style={{ background: '#EAF3DE', border: '.5px solid #C0DD97', borderRadius: 14, padding: '1.2rem', textAlign: 'center', marginTop: '1rem' }}>
                  <div style={{ fontSize: 12, color: '#27500A', fontWeight: 600 }}>رمز الدخول الخاص بالعميل</div>
                  <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '.18em', color: '#2D6A4F', fontFamily: 'monospace', margin: '.5rem 0' }}>{newCode}</div>
                  <div style={{ fontSize: 12, color: '#3B6D11', marginBottom: '.5rem' }}>أرسل هذا الرمز للعميل</div>
                  <button onClick={() => { navigator.clipboard.writeText(newCode); showToast('تم نسخ الرمز ✓') }} style={{ fontSize: 12, padding: '5px 14px', border: '.5px solid #D0CCC6', borderRadius: 5, background: 'transparent', cursor: 'pointer', color: '#5F6B5F' }}>نسخ الرمز</button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '1rem 1.2rem', borderTop: '.5px solid #E4E0DA' }}>
              {editClient && <button onClick={() => setShowClientModal(false)} style={{ ...BDel, flex: 'none', padding: '9px 16px' }}>إلغاء</button>}
              <button onClick={saveClient} style={{ ...BSave, flex: 1, padding: 9, fontSize: 13 }}>{editClient ? 'حفظ التغييرات' : newCode ? 'تم — أغلق' : 'حفظ وتوليد الرمز'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER MODAL */}
      {showOrderModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 20 }} onClick={e => { if (e.target === e.currentTarget) setShowOrderModal(false) }}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 400, border: '.5px solid #E4E0DA' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.2rem', borderBottom: '.5px solid #E4E0DA' }}><div style={{ fontSize: 14, fontWeight: 600 }}>إضافة طلب جديد</div><button onClick={() => setShowOrderModal(false)} style={{ width: 26, height: 26, border: '.5px solid #D0CCC6', borderRadius: 6, background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#5F6B5F' }}>✕</button></div>
            <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
              <div><label className="f-label">العميل *</label><select value={ofClient} onChange={e => setOfClient(e.target.value)} style={FI}>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="f-label">اسم المنتج *</label><input value={ofProduct} onChange={e => setOfProduct(e.target.value)} placeholder="مثال: Mancozeb 80WP" style={FI} /></div>
              <div><label className="f-label">المادة الفعالة *</label><input value={ofMolecule} onChange={e => setOfMolecule(e.target.value)} placeholder="مثال: Mancozeb" style={FI} /></div>
              <div><label className="f-label">الكمية</label><input value={ofQty} onChange={e => setOfQty(e.target.value)} placeholder="مثال: 5 كغ" style={FI} /></div>
              <div><label className="f-label">السعر (دج) *</label><input type="number" value={ofPrice} onChange={e => setOfPrice(e.target.value)} placeholder="0" style={{ ...FI, direction: 'ltr', textAlign: 'right' }} /></div>
              <div><label className="f-label">التاريخ</label><input type="date" value={ofDate} onChange={e => setOfDate(e.target.value)} style={FI} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '1rem 1.2rem', borderTop: '.5px solid #E4E0DA' }}>
              <button onClick={() => setShowOrderModal(false)} style={{ ...BDel, flex: 'none', padding: '9px 16px' }}>إلغاء</button>
              <button onClick={addOrder} style={{ ...BSave, flex: 1, padding: 9, fontSize: 13 }}>حفظ الطلب</button>
            </div>
          </div>
        </div>
      )}

      <Toast msg={toast} />
    </div>
  )
}
