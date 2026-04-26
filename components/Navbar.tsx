'use client'
import { useRouter } from 'next/navigation'

const Logo = () => (
  <svg width="34" height="34" viewBox="0 0 110 120" fill="none">
    <path d="M55 22 C42 18 20 26 8 38 C18 36 34 38 42 44" stroke="#2D6A4F" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
    <path d="M8 38 C14 32 26 30 42 44" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M55 22 C68 18 90 26 102 38 C92 36 76 38 68 44" stroke="#2D6A4F" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
    <path d="M102 38 C96 32 84 30 68 44" stroke="#2D6A4F" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M55 38 C44 35 26 42 16 52 C28 50 42 52 50 58" stroke="#2D6A4F" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <path d="M55 38 C66 35 84 42 94 52 C82 50 68 52 60 58" stroke="#2D6A4F" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <circle cx="55" cy="32" r="9" fill="#2D6A4F"/>
    <circle cx="50" cy="30" r="3.5" fill="white"/><circle cx="60" cy="30" r="3.5" fill="white"/>
    <circle cx="50" cy="30" r="1.8" fill="#2D6A4F"/><circle cx="60" cy="30" r="1.8" fill="#2D6A4F"/>
    <path d="M51 22 Q46 15 42 11" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M59 22 Q64 15 68 11" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="42" cy="10" r="2.5" fill="#2D6A4F"/>
    <circle cx="68" cy="10" r="2.5" fill="#2D6A4F"/>
    <ellipse cx="55" cy="52" rx="6" ry="10" fill="#2D6A4F"/>
    <path d="M52 65 L58 65 L58 72 L52 72Z" fill="#2D6A4F"/>
    <path d="M52 74 L58 74 L58 80 L52 80Z" fill="#2D6A4F"/>
    <path d="M53 82 L57 82 L55 92Z" fill="#2D6A4F"/>
  </svg>
)

interface NavbarProps {
  variant?: 'public' | 'dashboard' | 'portal'
  clientName?: string
  clientCode?: string
  onLogout?: () => void
  unreadCount?: number
}

export default function Navbar({ variant = 'public', clientName, clientCode, onLogout, unreadCount = 0 }: NavbarProps) {
  const router = useRouter()

  const s: Record<string, React.CSSProperties> = {
    nav: { display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 20px',borderBottom:'.5px solid #E4E0DA',background:'#fff',position:'sticky',top:0,zIndex:100 },
    brand: { display:'flex',alignItems:'center',gap:10,cursor:'pointer' },
    brandName: { fontSize:15,fontWeight:600,color:'#2D6A4F' },
    navLinks: { display:'flex',gap:22,fontSize:13,color:'#5F6B5F' },
    navLink: { cursor:'pointer' },
    btnGhost: { fontSize:12,padding:'6px 14px',border:'.5px solid #D0CCC6',borderRadius:20,background:'transparent',color:'#5F6B5F',cursor:'pointer' },
    btnPrimary: { fontSize:12,padding:'6px 16px',background:'#2D6A4F',color:'white',border:'none',borderRadius:20,cursor:'pointer' },
    badge: { display:'inline-flex',alignItems:'center',justifyContent:'center',width:16,height:16,background:'#E05A2B',color:'white',borderRadius:'50%',fontSize:9,marginRight:4 },
    userBadge: { fontSize:11,background:'#EAF3DE',color:'#27500A',padding:'3px 10px',borderRadius:10,fontWeight:500 },
  }

  return (
    <nav style={s.nav}>
      <div style={s.brand} onClick={() => router.push('/')}>
        <Logo />
        <span style={s.brandName}>aminefraya.ing</span>
      </div>

      {variant === 'public' && (
        <>
          <div style={s.navLinks} className="hide-mobile">
            <a href="#alerts" style={s.navLink}>التنبيهات</a>
            <a href="#articles" style={s.navLink}>الأبحاث</a>
            <a href="#contact" style={s.navLink}>تواصل معنا</a>
          </div>
          <div style={{ display:'flex',gap:8 }}>
            <button style={s.btnGhost} onClick={() => router.push('/portal')}>بوابة العميل</button>
            <button style={s.btnPrimary} onClick={() => router.push('/dashboard')}>لوحة المدير</button>
          </div>
        </>
      )}

      {variant === 'dashboard' && (
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          {unreadCount > 0 && <span style={s.badge}>{unreadCount}</span>}
          <span style={s.userBadge}>مدير النظام</span>
          <button style={s.btnGhost} onClick={onLogout}>خروج</button>
        </div>
      )}

      {variant === 'portal' && (
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:12,fontWeight:600 }}>{clientName}</div>
            <div style={{ fontSize:10,color:'#9CA89C' }}>رمزك: {clientCode}</div>
          </div>
          <button style={s.btnGhost} onClick={onLogout}>خروج</button>
        </div>
      )}
    </nav>
  )
}
