'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getClientByCode,
  getPostsForClient,
  getChecklistForClient,
  toggleChecklistItem,
  createNotification,
  getCalendarEventsForClient,
  getOrdersForClient,
  type Client, type Post, type ChecklistItem, type CalendarEvent, type Order
} from '@/lib/supabase'

const MONTHS_AR=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const EVT_LABELS:{[k:string]:string}={visit:'زيارة ميدانية',spray:'موعد رش',delivery:'تسليم طلب',followup:'متابعة'}
const EVT_BG:{[k:string]:string}={visit:'#C0DD97',spray:'#E6D9F7',delivery:'#FAEEDA',followup:'#E6F1FB'}
const EVT_TC:{[k:string]:string}={visit:'#27500A',spray:'#5B2D8E',delivery:'#854F0B',followup:'#185FA5'}
const TB:{[k:string]:{bg:string;c:string;lbl:string}}={
  text:{bg:'#EAF3DE',c:'#3B6D11',lbl:'نص'},
  image:{bg:'#E6F1FB',c:'#185FA5',lbl:'صورة'},
  video:{bg:'#FBEAF0',c:'#993556',lbl:'فيديو'},
  file:{bg:'#FAEEDA',c:'#854F0B',lbl:'ملف'},
}

function Logo(){return(<svg width="22" height="22" viewBox="0 0 110 120" fill="none"><path d="M55 22 C42 18 20 26 8 38 C18 36 34 38 42 44" stroke="#2D6A4F" strokeWidth="5" strokeLinecap="round" fill="none"/><path d="M55 22 C68 18 90 26 102 38 C92 36 76 38 68 44" stroke="#2D6A4F" strokeWidth="5" strokeLinecap="round" fill="none"/><circle cx="55" cy="32" r="9" fill="#2D6A4F"/><ellipse cx="55" cy="52" rx="6" ry="10" fill="#2D6A4F"/></svg>)}

function Toast({msg}:{msg:string}){return msg?<div style={{position:'fixed',bottom:22,left:'50%',transform:'translateX(-50%)',background:'#1A2E1A',color:'white',padding:'9px 22px',borderRadius:10,fontSize:12,zIndex:9999,whiteSpace:'nowrap',pointerEvents:'none'}}>{msg}</div>:null}

export default function PortalPage(){
  const router=useRouter()
  const [step,setStep]=useState<'login'|'portal'>('login')
  const [code,setCode]=useState('')
  const [codeErr,setCodeErr]=useState(false)
  const [client,setClient]=useState<Client|null>(null)
  const [tab,setTab]=useState('welcome')
  const [toast,setToast]=useState('')
  // Data
  const [posts,setPosts]=useState<Post[]>([])
  const [checklist,setChecklist]=useState<ChecklistItem[]>([])
  const [events,setEvents]=useState<CalendarEvent[]>([])
  const [orders,setOrders]=useState<Order[]>([])

  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(''),3000)}

  const login=async()=>{
    const full='AF-'+code.trim().toUpperCase()
    const {data,error}=await getClientByCode(full)
    if(error||!data){setCodeErr(true);return}
    setCodeErr(false)
    setClient(data)
    setStep('portal')
  }

  const loadClientData=useCallback(async(cid:string)=>{
    const [p,ch,e,o]=await Promise.all([
      getPostsForClient(cid),
      getChecklistForClient(cid),
      getCalendarEventsForClient(cid),
      getOrdersForClient(cid),
    ])
    if(p.data)setPosts(p.data)
    if(ch.data)setChecklist(ch.data)
    if(e.data)setEvents(e.data)
    if(o.data)setOrders(o.data)
  },[])

  useEffect(()=>{if(client)loadClientData(client.id)},[client,loadClientData])

  const logout=()=>{setStep('login');setClient(null);setCode('');setChecklist([]);setPosts([]);setEvents([]);setOrders([])}

  const toggleItem=async(item:ChecklistItem)=>{
    if(item.done)return
    await toggleChecklistItem(item.id,true)
    await createNotification(`${client?.name||'عميل'} أكمل بند "${item.text}"`)
    const {data}=await getChecklistForClient(client!.id)
    if(data)setChecklist(data)
    showToast('✓ تم إرسال إشعار للمدير')
  }

  const pendingTasks=checklist.filter(i=>!i.done).length
  const done=checklist.filter(i=>i.done).length
  const pct=checklist.length?Math.round(done/checklist.length*100):0
  const todayStr=new Date().toISOString().slice(0,10)
  const upcomingEvts=events.filter(e=>e.date>=todayStr).sort((a,b)=>a.date.localeCompare(b.date))
  const ordTotal=orders.reduce((s,o)=>s+Number(o.price),0)

  // ── Styles ──
  const FI={width:'100%',padding:'8px 12px',border:'.5px solid #D0CCC6',borderRadius:10,fontSize:13,background:'#F8F5F0',color:'#1A2E1A',direction:'rtl' as const,fontFamily:'inherit'} as React.CSSProperties
  const B={background:'#fff',border:'.5px solid #E4E0DA',borderRadius:14,padding:'1rem',marginBottom:10} as React.CSSProperties

  // ── POST CARD ──
  const PostCard=({p}:{p:Post})=>{const tb=TB[p.type]||TB.text;return(
    <div style={B}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:'.6rem'}}>
        <div style={{width:30,height:30,borderRadius:'50%',background:'#EAF3DE',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:'#2D6A4F'}}>AF</div>
        <div><div style={{fontSize:12,fontWeight:600}}>أمين فرايا</div><div style={{fontSize:10,color:'#9CA89C'}}>{new Date(p.created_at).toLocaleString('ar-DZ')}</div></div>
        <span style={{marginRight:'auto',fontSize:10,padding:'2px 7px',borderRadius:8,background:tb.bg,color:tb.c}}>{tb.lbl}</span>
      </div>
      <div style={{fontSize:13,lineHeight:1.7,color:'#5F6B5F'}}>{p.content}</div>
      {p.media_label&&<div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'#5F6B5F',background:'#F8F5F0',borderRadius:6,padding:'.7rem',marginTop:'.6rem'}}>{p.media_label}</div>}
    </div>
  )}

  // ── LOGIN ──
  if(step==='login')return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#F8F5F0',padding:'2rem'}}>
      <div style={{background:'#fff',border:'.5px solid #E4E0DA',borderRadius:14,padding:'2.2rem',width:'100%',maxWidth:340,boxShadow:'0 1px 3px rgba(0,0,0,.08)'}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,marginBottom:'1.8rem'}}>
          <div style={{fontSize:36}}>🔐</div>
          <div style={{fontSize:15,fontWeight:600,color:'#2D6A4F'}}>aminefraya.ing</div>
          <div style={{fontSize:11,color:'#5F6B5F'}}>بوابة العميل الخاصة</div>
        </div>
        <div style={{fontSize:17,fontWeight:500,textAlign:'center',marginBottom:4}}>أدخل رمز الدخول</div>
        <div style={{fontSize:12,color:'#5F6B5F',textAlign:'center',marginBottom:'1.5rem',lineHeight:1.6}}>الرمز الخاص بك أرسله إليك أمين فرايا عبر الواتساب</div>
        <div style={{display:'flex',gap:6,marginBottom:'1rem'}}>
          <span style={{padding:'9px 12px',background:'#EAF3DE',border:'.5px solid #C0DD97',borderRadius:10,fontSize:13,fontWeight:700,color:'#2D6A4F',fontFamily:'monospace',flexShrink:0}}>AF-</span>
          <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} maxLength={4} placeholder="XXXX" onKeyDown={e=>{if(e.key==='Enter')login()}}
            style={{...FI,fontSize:16,fontWeight:700,letterSpacing:'.2em',fontFamily:'monospace',textAlign:'center',flex:1}}/>
        </div>
        <button onClick={login} style={{width:'100%',padding:10,background:'#2D6A4F',color:'white',border:'none',borderRadius:10,fontSize:14,cursor:'pointer'}}>دخول ←</button>
        {codeErr&&<div style={{fontSize:12,color:'#A32D2D',background:'#FCEBEB',border:'.5px solid #F09595',borderRadius:6,padding:'8px 12px',marginTop:'.8rem',textAlign:'center'}}>الرمز غير صحيح. تحقق من الرمز المرسل إليك.</div>}
        <div style={{fontSize:11,color:'#5F6B5F',textAlign:'center',marginTop:'1rem',lineHeight:1.7}}>للمساعدة تواصل عبر واتساب<br/>+213 77 418 2227</div>
        <button onClick={()=>router.push('/')} style={{display:'block',margin:'1rem auto 0',fontSize:11,color:'#5F6B5F',background:'transparent',border:'none',cursor:'pointer'}}>← الموقع الرئيسي</button>
      </div>
    </div>
  )

  // ── PORTAL ──
  const TABS=[
    {id:'welcome',icon:'🏠',label:'الرئيسية'},
    {id:'posts',icon:'📝',label:'المنشورات'},
    {id:'checklist',icon:'✅',label:'مهامي'},
    {id:'calendar',icon:'📅',label:'مواعيدي'},
    {id:'orders',icon:'📦',label:'طلباتي'},
  ]

  return(
    <div style={{minHeight:'100vh',background:'#F8F5F0'}}>
      {/* Portal Nav */}
      <nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',borderBottom:'.5px solid #E4E0DA',background:'#fff',position:'sticky',top:0,zIndex:50}}>
        <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,fontWeight:600,color:'#2D6A4F',cursor:'pointer'}} onClick={()=>router.push('/')}><Logo/>aminefraya.ing</div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:12,fontWeight:600}}>{client?.name}</div>
            <div style={{fontSize:10,color:'#9CA89C'}}>رمزك: {client?.code}</div>
          </div>
          <button onClick={logout} style={{fontSize:11,padding:'4px 10px',border:'.5px solid #D0CCC6',borderRadius:10,background:'transparent',cursor:'pointer',color:'#5F6B5F'}}>خروج</button>
        </div>
      </nav>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'.5px solid #E4E0DA',padding:'0 20px',overflowX:'auto',background:'#fff'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:'10px 14px',fontSize:12,cursor:'pointer',color:tab===t.id?'#2D6A4F':'#5F6B5F',borderTop:'none',borderLeft:'none',borderRight:'none',borderBottom:tab===t.id?'2px solid #2D6A4F':'2px solid transparent',background:'none',fontFamily:'inherit',whiteSpace:'nowrap',fontWeight:tab===t.id?600:400}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{padding:'1.2rem 20px',maxWidth:700,margin:'0 auto'}}>

        {/* WELCOME */}
        {tab==='welcome'&&(
          <div>
            <div style={{background:'linear-gradient(135deg,#2D6A4F 0%,#4A9B74 100%)',borderRadius:14,padding:'1.5rem',color:'white',marginBottom:'1rem'}}>
              <div style={{fontSize:12,opacity:.8,marginBottom:4}}>مرحباً بك في بوابتك الخاصة</div>
              <div style={{fontSize:20,fontWeight:600,marginBottom:4}}>{client?.name}</div>
              <div style={{fontSize:12,opacity:.75}}>كل ما يخصك في مكان واحد — برنامجك، مواعيدك، وطلباتك</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:'1.2rem'}}>
              {[{n:posts.length,l:'منشورات'},{n:pendingTasks,l:'مهام معلّقة'},{n:orders.length,l:'طلبات'}].map((s,i)=>(
                <div key={i} style={{background:'#fff',border:'.5px solid #E4E0DA',borderRadius:10,padding:'.9rem',textAlign:'center'}}>
                  <div style={{fontSize:20,fontWeight:600,color:'#2D6A4F'}}>{s.n}</div>
                  <div style={{fontSize:10,color:'#9CA89C',marginTop:3}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div className="section-sep">آخر المنشورات</div>
            {posts.slice(0,2).map(p=><PostCard key={p.id} p={p}/>)}
            {!posts.length&&<div style={{textAlign:'center',padding:'2rem',color:'#5F6B5F',fontSize:13}}>لا توجد منشورات بعد</div>}
          </div>
        )}

        {/* POSTS */}
        {tab==='posts'&&(
          <div>
            <div className="section-sep">منشورات أمين فرايا الخاصة بك</div>
            {posts.map(p=><PostCard key={p.id} p={p}/>)}
            {!posts.length&&<div style={{textAlign:'center',padding:'2rem',color:'#5F6B5F',fontSize:13}}>لا توجد منشورات بعد</div>}
          </div>
        )}

        {/* CHECKLIST */}
        {tab==='checklist'&&(
          <div>
            <div className="section-sep">قائمة مهامك — أكمل كل بند بعد تنفيذه</div>
            {checklist.length?(
              <div style={{background:'#fff',border:'.5px solid #E4E0DA',borderRadius:14,padding:'1rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'.8rem'}}>
                  <div style={{fontSize:13,fontWeight:600}}>قائمة المهام</div>
                  <div style={{fontSize:11,color:'#5F6B5F'}}>{done}/{checklist.length} مكتمل ({pct}%)</div>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{width:`${pct}%`}}/></div>
                {checklist.map(item=>(
                  <div key={item.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'.5px solid #E4E0DA'}}>
                    <div onClick={()=>toggleItem(item)}
                      style={{width:20,height:20,border:`.5px solid ${item.done?'#2D6A4F':'#D0CCC6'}`,borderRadius:5,cursor:item.done?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:item.done?'#2D6A4F':'transparent',transition:'all .2s'}}>
                      {item.done&&<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div style={{flex:1,fontSize:13,textDecoration:item.done?'line-through':'none',color:item.done?'#9CA89C':'#1A2E1A'}}>{item.text}</div>
                    {item.done&&<span style={{fontSize:10,color:'#27500A',background:'#EAF3DE',padding:'2px 7px',borderRadius:8}}>✓ مكتمل</span>}
                  </div>
                ))}
              </div>
            ):<div style={{textAlign:'center',padding:'2rem',color:'#5F6B5F',fontSize:13}}>لا توجد مهام بعد</div>}
          </div>
        )}

        {/* CALENDAR */}
        {tab==='calendar'&&(
          <div>
            <div className="section-sep">مواعيدك القادمة</div>
            {upcomingEvts.length?upcomingEvts.map(e=>{
              const d=new Date(e.date)
              return(
                <div key={e.id} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'.7rem',background:'#fff',border:'.5px solid #E4E0DA',borderRadius:10,marginBottom:8}}>
                  <div style={{textAlign:'center',background:'#EAF3DE',borderRadius:6,padding:'4px 10px',minWidth:46,flexShrink:0}}>
                    <div style={{fontSize:17,fontWeight:600,color:'#2D6A4F',lineHeight:1}}>{d.getDate()}</div>
                    <div style={{fontSize:10,color:'#3B6D11'}}>{MONTHS_AR[d.getMonth()].slice(0,3)}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500}}>
                      {EVT_LABELS[e.type]}
                      <span style={{fontSize:10,padding:'2px 7px',borderRadius:8,background:EVT_BG[e.type],color:EVT_TC[e.type],marginRight:8}}>{EVT_LABELS[e.type]}</span>
                    </div>
                    <div style={{fontSize:11,color:'#5F6B5F',marginTop:2}}>{e.time}{e.note?` · ${e.note}`:''}</div>
                  </div>
                </div>
              )
            }):<div style={{textAlign:'center',padding:'2rem',color:'#5F6B5F',fontSize:13}}>لا توجد مواعيد قادمة</div>}

            {events.filter(e=>e.date<todayStr).length>0&&(
              <>
                <div className="section-sep" style={{marginTop:'1.5rem'}}>المواعيد السابقة</div>
                {events.filter(e=>e.date<todayStr).sort((a,b)=>b.date.localeCompare(a.date)).map(e=>{
                  const d=new Date(e.date)
                  return(
                    <div key={e.id} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'.7rem',background:'#F8F5F0',border:'.5px solid #E4E0DA',borderRadius:10,marginBottom:8,opacity:.7}}>
                      <div style={{textAlign:'center',background:'#F0EDE8',borderRadius:6,padding:'4px 10px',minWidth:46,flexShrink:0}}>
                        <div style={{fontSize:17,fontWeight:600,color:'#9CA89C',lineHeight:1}}>{d.getDate()}</div>
                        <div style={{fontSize:10,color:'#9CA89C'}}>{MONTHS_AR[d.getMonth()].slice(0,3)}</div>
                      </div>
                      <div><div style={{fontSize:13,fontWeight:500,color:'#5F6B5F'}}>{EVT_LABELS[e.type]}</div><div style={{fontSize:11,color:'#9CA89C',marginTop:2}}>{e.time}{e.note?` · ${e.note}`:''}</div></div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* ORDERS */}
        {tab==='orders'&&(
          <div>
            <div className="section-sep">سجل طلباتك</div>
            {orders.length?(
              <>
                {orders.sort((a,b)=>b.date.localeCompare(a.date)).map(o=>(
                  <div key={o.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'.8rem 1rem',background:'#fff',border:'.5px solid #E4E0DA',borderRadius:10,marginBottom:8}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600}}>{o.product}</div>
                      <div style={{marginTop:3}}><span className="mol-badge">{o.molecule}</span>{o.qty?` · ${o.qty}`:''}</div>
                    </div>
                    <div style={{textAlign:'left'}}>
                      <div style={{fontSize:14,fontWeight:600,color:'#2D6A4F'}}>{Number(o.price).toLocaleString()} دج</div>
                      <div style={{fontSize:10,color:'#9CA89C',marginTop:2}}>{o.date}</div>
                    </div>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',padding:'.8rem 1rem',background:'#EAF3DE',borderRadius:10,marginTop:'.5rem',fontSize:13}}>
                  <span>الإجمالي</span>
                  <span style={{fontWeight:600,color:'#2D6A4F',fontSize:15}}>{ordTotal.toLocaleString()} دج</span>
                </div>
              </>
            ):<div style={{textAlign:'center',padding:'2rem',color:'#5F6B5F',fontSize:13}}>لا توجد طلبات بعد</div>}
          </div>
        )}
      </div>

      {/* WA Float */}
      <button className="wa-float" onClick={()=>window.open('https://wa.me/213774182227','_blank')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </button>

      <Toast msg={toast}/>
    </div>
  )
}
