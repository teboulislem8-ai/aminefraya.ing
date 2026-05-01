'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { getArticles, type Article } from '@/lib/supabase'

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const DAYS_AR = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت']
const CAT_STYLES: Record<string,{bg:string;c:string}> = {
  'حماية النباتات':{bg:'#EAF3DE',c:'#3B6D11'},
  'التغذية الزراعية':{bg:'#FAEEDA',c:'#854F0B'},
  'الري والمياه':{bg:'#E6F1FB',c:'#185FA5'},
  'المحاصيل الحقلية':{bg:'#FBEAF0',c:'#993556'},
}
function wIcon(c:number){if(c===0)return'☀️';if(c<=2)return'🌤️';if(c<=3)return'☁️';if(c<=49)return'🌫️';if(c<=67)return'🌧️';if(c<=77)return'❄️';return'⛈️'}
function wDesc(c:number){if(c===0)return'صافٍ';if(c<=2)return'قليل الغيوم';if(c<=3)return'غائم';if(c<=49)return'ضباب';if(c<=67)return'أمطار';if(c<=77)return'ثلج';return'عاصفة'}
function wDir(d:number){return['شمال','شمال شرق','شرق','جنوب شرق','جنوب','جنوب غرب','غرب','شمال غرب'][Math.round(d/45)%8]}
interface WData{temp:number;humidity:number;windSpeed:number;windDir:number;code:number;maxTemp:number;minTemp:number;rain:number;forecast:Array<{date:string;code:number;max:number;rain:number}>}
function genAlerts(w:WData){
  const a:Array<{type:string;icon:string;title:string;desc:string}>=[]
  if(w.windSpeed>35)a.push({type:'danger',icon:'💨',title:'خطر رياح شديدة — وقف الرش',desc:`سرعة الرياح ${Math.round(w.windSpeed)} كم/س. يُمنع رش المبيدات والأسمدة السائلة.`})
  else if(w.windSpeed>20)a.push({type:'warning',icon:'💨',title:'رياح معتدلة — احتياط',desc:`سرعة الرياح ${Math.round(w.windSpeed)} كم/س.`})
  if(w.humidity>85)a.push({type:'danger',icon:'🍄',title:'خطر فطريات — رطوبة مرتفعة',desc:`الرطوبة ${w.humidity}%. طبّق المبيدات الفطرية وقائياً.`})
  else if(w.humidity>70)a.push({type:'warning',icon:'🍄',title:'مراقبة الأمراض الفطرية',desc:`الرطوبة ${w.humidity}%.`})
  if(w.maxTemp>38)a.push({type:'danger',icon:'🌡️',title:'موجة حر — إجهاد حراري',desc:`الحرارة القصوى ${Math.round(w.maxTemp)}°م. تجنب الرش بين 11ص و4م.`})
  else if(w.maxTemp>33)a.push({type:'warning',icon:'🌡️',title:'حرارة مرتفعة',desc:`الحرارة القصوى ${Math.round(w.maxTemp)}°م. انقل الري للصباح الباكر.`})
  if(w.minTemp<2)a.push({type:'danger',icon:'🌨️',title:'خطر صقيع — حماية المحاصيل',desc:`الحرارة الدنيا ${Math.round(w.minTemp)}°م.`})
  if(w.rain>20)a.push({type:'warning',icon:'🌧️',title:'أمطار غزيرة',desc:`متوقع ${Math.round(w.rain)} مم اليوم.`})
  else if(w.rain>5)a.push({type:'info',icon:'🌧️',title:'أمطار خفيفة — فرصة للأسمدة',desc:`متوقع ${Math.round(w.rain)} مم.`})
  if(!a.length)a.push({type:'safe',icon:'✅',title:'ظروف زراعية مواتية',desc:'الطقس مستقر في قسنطينة. ظروف جيدة للعمل الميداني.'})
  return a
}
const AC:Record<string,{bg:string;border:string;title:string;iconBg:string}>={
  danger:{bg:'#FCEBEB',border:'#F09595',title:'#791F1F',iconBg:'#F7C1C1'},
  warning:{bg:'#FAEEDA',border:'#FAC775',title:'#633806',iconBg:'#FAC775'},
  info:{bg:'#EAF3DE',border:'#C0DD97',title:'#27500A',iconBg:'#C0DD97'},
  safe:{bg:'#E1F5EE',border:'#9FE1CB',title:'#085041',iconBg:'#9FE1CB'},
}

function Logo(){return(<svg width="34" height="34" viewBox="0 0 110 120" fill="none"><path d="M55 22 C42 18 20 26 8 38 C18 36 34 38 42 44" stroke="#2D6A4F" strokeWidth="3.5" strokeLinecap="round" fill="none"/><path d="M55 22 C68 18 90 26 102 38 C92 36 76 38 68 44" stroke="#2D6A4F" strokeWidth="3.5" strokeLinecap="round" fill="none"/><path d="M55 38 C44 35 26 42 16 52 C28 50 42 52 50 58" stroke="#2D6A4F" strokeWidth="3" strokeLinecap="round" fill="none"/><path d="M55 38 C66 35 84 42 94 52 C82 50 68 52 60 58" stroke="#2D6A4F" strokeWidth="3" strokeLinecap="round" fill="none"/><circle cx="55" cy="32" r="9" fill="#2D6A4F"/><circle cx="50" cy="30" r="3.5" fill="white"/><circle cx="60" cy="30" r="3.5" fill="white"/><circle cx="50" cy="30" r="1.8" fill="#2D6A4F"/><circle cx="60" cy="30" r="1.8" fill="#2D6A4F"/><ellipse cx="55" cy="52" rx="6" ry="10" fill="#2D6A4F"/><path d="M52 65 L58 65 L58 72 L52 72Z" fill="#2D6A4F"/><path d="M52 74 L58 74 L58 80 L52 80Z" fill="#2D6A4F"/><path d="M53 82 L57 82 L55 92Z" fill="#2D6A4F"/></svg>)}

export default function HomePage(){
  const router=useRouter()
  const [weather,setWeather]=useState<WData|null>(null)
  const [loading,setLoading]=useState(true)
  const [wTime,setWTime]=useState('')
  const [articles,setArticles]=useState<Article[]>([])
  const [filter,setFilter]=useState('all')
  const [search,setSearch]=useState('')
  const [page,setPage]=useState(1)
  const [modal,setModal]=useState<Article|null>(null)
  const PER=4

  const loadWeather=useCallback(async()=>{
    setLoading(true)
    try{
      const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude=36.365&longitude=6.6147&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=Africa%2FAlgiers&forecast_days=7')
      const d=await r.json()
      const cur=d.current,daily=d.daily
      setWeather({temp:cur.temperature_2m,humidity:cur.relative_humidity_2m,windSpeed:cur.wind_speed_10m,windDir:cur.wind_direction_10m,code:cur.weather_code,maxTemp:daily.temperature_2m_max[0],minTemp:daily.temperature_2m_min[0],rain:daily.precipitation_sum[0],forecast:daily.time.map((t:string,i:number)=>({date:t,code:daily.weather_code[i],max:daily.temperature_2m_max[i],rain:daily.precipitation_sum[i]}))})
      const n=new Date();setWTime(`${n.toLocaleTimeString('ar-DZ',{hour:'2-digit',minute:'2-digit'})} — ${n.getDate()} ${MONTHS_AR[n.getMonth()]}`)
    }catch{/**/}finally{setLoading(false)}
  },[])

  useEffect(()=>{loadWeather();const i=setInterval(loadWeather,600000);return()=>clearInterval(i)},[loadWeather])
  useEffect(()=>{getArticles().then(({data})=>{if(data)setArticles(data)})},[])

  const filtered=articles.filter(a=>{
    const mc=filter==='all'||a.category===filter
    const mq=!search||a.title.includes(search)||a.excerpt.includes(search)||a.keywords.some(k=>k.includes(search))
    return mc&&mq
  })
  const paged=filtered.slice((page-1)*PER,page*PER)
  const totalPg=Math.ceil(filtered.length/PER)
  const alerts=weather?genAlerts(weather):[]
  const ticker=alerts[0]?`تنبيه زراعي — ${alerts[0].title}`:`الطقس مستقر في قسنطينة${weather?` · ${Math.round(weather.temp)}°م`:''}`

  return(
    <div>
      {/* FIX 2 — hide nav links on mobile */}
      <style>{`@media(max-width:640px){.nav-links{display:none!important}}`}</style>

      {/* Ticker */}
      <div style={{background:'#1A2E1A',color:'white',padding:'8px 20px',display:'flex',alignItems:'center',gap:10,fontSize:12}}>
        <div style={{width:6,height:6,borderRadius:'50%',background:'#E05A2B',flexShrink:0,animation:'blink 1.5s infinite'}}/>
        <div style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ticker}</div>
        <div style={{fontSize:10,color:'#E8B85A',whiteSpace:'nowrap'}}>قسنطينة · الشرق الجزائري</div>
      </div>

      {/* Navbar */}
      <nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 20px',borderBottom:'.5px solid #E4E0DA',background:'#fff',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>router.push('/')}><Logo/><span style={{fontSize:15,fontWeight:600,color:'#2D6A4F'}}>aminefraya.ing</span></div>
        {/* FIX 2 — className="nav-links" collapses this on mobile */}
        <div className="nav-links" style={{display:'flex',gap:22,fontSize:13}}>
          <a href="#alerts" style={{color:'#5F6B5F'}}>التنبيهات</a>
          <a href="#articles" style={{color:'#5F6B5F'}}>الأبحاث</a>
          <a href="#contact" style={{color:'#5F6B5F'}}>تواصل معنا</a>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>router.push('/portal')} style={{fontSize:12,padding:'6px 14px',border:'.5px solid #D0CCC6',borderRadius:20,background:'transparent',color:'#5F6B5F',cursor:'pointer'}}>بوابة العميل</button>
          <button onClick={()=>router.push('/dashboard')} style={{fontSize:12,padding:'6px 16px',background:'#2D6A4F',color:'white',border:'none',borderRadius:20,cursor:'pointer'}}>لوحة المدير</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
  maxWidth:1100,
  margin:'0 auto',
  padding:'2rem 16px',
  textAlign:'center'
}}>
        <div style={{fontSize:11,letterSpacing:'.12em',color:'#C9963A',fontWeight:600,textTransform:'uppercase',marginBottom:'1rem'}}>زراعة ذكية · شرق الجزائر</div>
        <div style={{fontSize:38,fontWeight:600,lineHeight:1.25,marginBottom:6}}>شريكك الزراعي الموثوق</div>
        <div style={{fontSize:15,color:'#5F6B5F',fontStyle:'italic',marginBottom:'1.2rem'}}>Votre Partenaire Agricole de Confiance</div>
        {/* FIX 1 — added margin:'0 auto 2rem' so the block centers on desktop */}
        <div style={{fontSize:14,color:'#5F6B5F',lineHeight:1.8,maxWidth:520,margin:'0 auto 2rem'}}>مستلزمات زراعية، استشارات متخصصة، ومتابعة فردية لكل عميل — كل ما تحتاجه في مكان واحد.</div>
        <div style={{
  display:'flex',
  flexDirection:'column',
  gap:10,
  alignItems:'center'
}}>
          <button onClick={()=>router.push('/portal')} style={{padding:'11px 28px',background:'#2D6A4F',color:'white',border:'none',borderRadius:10,fontSize:14,cursor:'pointer'}}>
  دخول بوابة العميل
</button>
          <button onClick={()=>document.getElementById('alerts')?.scrollIntoView({behavior:'smooth'})} style={{padding:'11px 28px',background:'transparent',color:'#2D6A4F',border:'1px solid #2D6A4F',borderRadius:10,fontSize:14,cursor:'pointer'}}>
  اكتشف الخدمات
</button>
        </div>
      </div>

      <div style={{height:.5,background:'#E4E0DA',margin:'0 20px'}}/>

      {/* Services */}
      <div style={{maxWidth:1100,margin:'0 auto',padding:'3rem 20px'}}>
        <div className="section-sep">خدماتنا</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))',gap:14}}>
          {[{icon:'🌤️',title:'التنبيهات الزراعية',desc:'بيانات فورية عن الطقس والمخاطر لمنطقة قسنطينة.',badge:'مباشر · بيانات حية',bg:'#EAF3DE',c:'#3B6D11',id:'alerts'},{icon:'📋',title:'الأبحاث العلمية',desc:'ملخصات علمية موثقة لأفضل القرارات الزراعية.',badge:'معرفة · علم · تطبيق',bg:'#FAEEDA',c:'#854F0B',id:'articles'},{icon:'🔐',title:'بوابة العميل الخاصة',desc:'برامجك، جداولك، وطلباتك في مساحة آمنة.',badge:'مشفّر · خاص · آمن',bg:'#E1F5EE',c:'#0F6E56',id:'portal'}].map((m,i)=>(
            <div key={i} onClick={()=>m.id==='portal'?router.push('/portal'):document.getElementById(m.id)?.scrollIntoView({behavior:'smooth'})}
              style={{background:'#fff',border:`.5px solid ${i===2?'#2D6A4F':'#E4E0DA'}`,borderRadius:14,padding:'1.4rem',cursor:'pointer'}}>
              <div style={{width:40,height:40,borderRadius:10,background:m.bg,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'1rem',fontSize:18}}>{m.icon}</div>
              <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>{m.title}</div>
              <div style={{fontSize:12,color:'#5F6B5F',lineHeight:1.7}}>{m.desc}</div>
              <span style={{display:'inline-block',fontSize:10,padding:'2px 9px',borderRadius:10,marginTop:10,fontWeight:500,background:m.bg,color:m.c}}>{m.badge}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{height:.5,background:'#E4E0DA',margin:'0 20px'}}/>

      {/* Alerts */}
      <div id="alerts" style={{maxWidth:1100,margin:'0 auto',padding:'3rem 20px'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'1.5rem',flexWrap:'wrap',gap:10}}>
          <div><div className="section-sep">بيانات حية</div><div style={{fontSize:22,fontWeight:600}}>التنبيهات الزراعية</div><div style={{fontSize:13,color:'#5F6B5F',marginTop:4}}>منطقة قسنطينة والشرق الجزائري — تحديث كل 10 دقائق</div></div>
          <div style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,color:'#27500A',background:'#EAF3DE',padding:'3px 10px',borderRadius:10,fontWeight:500}}><div style={{width:6,height:6,borderRadius:'50%',background:'#2D6A4F',animation:'blink 1.5s infinite'}}/>مباشر</div>
        </div>
        {loading?<div style={{textAlign:'center',padding:'3rem',color:'#5F6B5F',fontSize:13}}>⏳ جاري جلب بيانات الطقس من Open-Meteo...</div>:weather?(
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))',gap:10,marginBottom:'1.5rem'}}>
              {[{l:'الحرارة',v:`${Math.round(weather.temp)}°`,u:'مئوية'},{l:'الرطوبة',v:`${weather.humidity}%`,u:'نسبة مئوية'},{l:'الرياح',v:`${Math.round(weather.windSpeed)}`,u:`كم/س · ${wDir(weather.windDir)}`},{l:'الطقس',v:wIcon(weather.code),u:wDesc(weather.code)}].map((w,i)=>(
                <div key={i} style={{background:'#F8F5F0',borderRadius:10,padding:'.9rem',textAlign:'center'}}>
                  <div style={{fontSize:10,color:'#9CA89C',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:4}}>{w.l}</div>
                  <div style={{fontSize:i===3?26:22,fontWeight:600}}>{w.v}</div>
                  <div style={{fontSize:10,color:'#9CA89C',marginTop:2}}>{w.u}</div>
                </div>
              ))}
            </div>
            <div className="section-sep">التنبيهات الزراعية</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:'1.5rem'}}>
              {alerts.map((a,i)=>{const ac=AC[a.type];return(
                <div key={i} style={{background:ac.bg,border:`.5px solid ${ac.border}`,borderRadius:14,padding:'.9rem 1rem',display:'flex',gap:12,alignItems:'flex-start'}}>
                  <div style={{width:34,height:34,borderRadius:6,background:ac.iconBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{a.icon}</div>
                  <div><div style={{fontSize:13,fontWeight:600,marginBottom:3,color:ac.title}}>{a.title}</div><div style={{fontSize:12,lineHeight:1.6,color:'#5F6B5F'}}>{a.desc}</div></div>
                </div>
              )})}
            </div>
            <div className="section-sep">توقعات 7 أيام</div>
            <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}}>
              {weather.forecast.map((f,i)=>{const d=new Date(f.date);const n=i===0?'اليوم':i===1?'غداً':DAYS_AR[d.getDay()];return(
                <div key={i} style={{flexShrink:0,width:70,background:'#F8F5F0',borderRadius:10,padding:'.7rem .4rem',textAlign:'center'}}>
                  <div style={{fontSize:10,color:'#9CA89C',marginBottom:4}}>{n}</div>
                  <div style={{fontSize:18,marginBottom:4}}>{wIcon(f.code)}</div>
                  <div style={{fontSize:13,fontWeight:600}}>{Math.round(f.max)}°</div>
                  <div style={{fontSize:10,color:'#5BAEC7',marginTop:2}}>{f.rain>0?`${Math.round(f.rain)}مم`:''}</div>
                </div>
              )})}
            </div>
          </>
        ):<div style={{background:'#FCEBEB',border:'.5px solid #F09595',borderRadius:10,padding:'1rem',fontSize:13,color:'#A32D2D'}}>تعذّر جلب البيانات.</div>}
        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#9CA89C',paddingTop:'.8rem',borderTop:'.5px solid #E4E0DA',marginTop:'1rem'}}>
          <span>{wTime?`آخر تحديث: ${wTime}`:'جاري التحديث...'}</span>
          <button onClick={loadWeather} style={{padding:'4px 12px',border:'.5px solid #D0CCC6',borderRadius:6,background:'transparent',fontSize:11,cursor:'pointer',color:'#5F6B5F'}}>تحديث ↻</button>
        </div>
      </div>

      <div style={{height:.5,background:'#E4E0DA',margin:'0 20px'}}/>

      {/* Articles */}
      <div id="articles" style={{maxWidth:1100,margin:'0 auto',padding:'3rem 20px'}}>
        <div className="section-sep">معرفة علمية</div>
        <div style={{fontSize:22,fontWeight:600,marginBottom:4}}>الأبحاث العلمية الزراعية</div>
        <div style={{fontSize:13,color:'#5F6B5F',marginBottom:'1.5rem'}}>ملخصات علمية موثقة — تُضاف وتُحدَّث من لوحة تحكم المدير</div>
        <div style={{
  display:'grid',
  gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',
  gap:12,
  marginBottom:'1.5rem'
}}>
          {[{n:articles.length,l:'مقالة منشورة'},{n:4,l:'تصنيف'},{n:new Set(articles.flatMap(a=>a.keywords)).size,l:'كلمة مفتاحية SEO'}].map((s,i)=>(
            <div key={i} style={{background:'#F8F5F0',borderRadius:10,padding:'.8rem',textAlign:'center'}}><div style={{fontSize:22,fontWeight:600,color:'#2D6A4F'}}>{s.n}</div><div style={{fontSize:10,color:'#9CA89C',marginTop:3}}>{s.l}</div></div>
          ))}
        </div>
        <input className="f-input" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="ابحث في المقالات... مثال: مبيدات، قمح، ري" style={{marginBottom:'1rem'}}/>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:'1rem'}}>
          {['all','حماية النباتات','التغذية الزراعية','الري والمياه','المحاصيل الحقلية'].map(f=>(
            <button key={f} onClick={()=>{setFilter(f);setPage(1)}} style={{fontSize:11,padding:'5px 14px',borderRadius:20,border:'.5px solid #D0CCC6',background:filter===f?'#2D6A4F':'transparent',color:filter===f?'white':'#5F6B5F',cursor:'pointer'}}>{f==='all'?'الكل':f}</button>
          ))}
        </div>
        <div style={{
  display:'grid',
  gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',
  gap:12,
  marginBottom:'1.5rem'
}}>
          {paged.length ? paged.map(a=>{const cs=CAT_STYLES[a.category]||{bg:'#F1EFE8',c:'#5F5E5A'};return(
            <div key={a.id} onClick={()=>setModal(a)} style={{background:'#fff',border:'.5px solid #E4E0DA',borderRadius:14,overflow:'hidden',cursor:'pointer'}}>
              <div style={{padding:'.9rem 1rem .6rem'}}>
                <span style={{display:'inline-block',fontSize:10,padding:'2px 9px',borderRadius:10,marginBottom:8,fontWeight:600,background:cs.bg,color:cs.c}}>{a.category}</span>
                <div style={{fontSize:13,fontWeight:600,lineHeight:1.5,marginBottom:6}}>{a.title}</div>
                <div style={{fontSize:11,color:'#5F6B5F',lineHeight:1.7}}>{a.excerpt}</div>
              </div>
              <div style={{padding:'.6rem 1rem .8rem',borderTop:'.5px solid #E4E0DA',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',gap:4}}>{a.keywords.slice(0,2).map(k=><span key={k} style={{fontSize:10,padding:'1px 7px',borderRadius:8,background:'#F8F5F0',color:'#5F6B5F'}}>{k}</span>)}</div>
                <span style={{fontSize:10,color:'#9CA89C'}}>{new Date(a.created_at).toLocaleDateString('ar-DZ')}</span>
              </div>
            </div>
          )}) : (<div style={{gridColumn:'1/-1',textAlign:'center',padding:'2rem',color:'#5F6B5F'}}>لا توجد مقالات مطابقة</div>)}
        </div>
        {totalPg>1&&<div style={{display:'flex',gap:6,justifyContent:'center'}}>{Array.from({length:totalPg},(_,i)=><button key={i} onClick={()=>setPage(i+1)} style={{width:32,height:32,borderRadius:6,border:'.5px solid #D0CCC6',background:page===i+1?'#2D6A4F':'transparent',color:page===i+1?'white':'#5F6B5F',fontSize:12,cursor:'pointer'}}>{i+1}</button>)}</div>}
      </div>

      {/* Footer */}
      <div id="contact" style={{height:.5,background:'#E4E0DA',margin:'0 20px'}}/>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <footer style={{borderTop:'.5px solid #E4E0DA',padding:'2.5rem 20px 1.5rem'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'2rem',marginBottom:'2rem'}}>
            <div><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:'1rem'}}><Logo/><span style={{fontSize:14,fontWeight:700,color:'#2D6A4F'}}>aminefraya.ing</span></div><div style={{fontSize:12,color:'#5F6B5F',lineHeight:1.8}}>شريكك الزراعي الموثوق<br/>في شرق الجزائر</div></div>
            <div><div style={{fontSize:11,letterSpacing:'.08em',color:'#C9963A',fontWeight:600,textTransform:'uppercase',marginBottom:'.8rem'}}>تواصل معنا</div><div style={{fontSize:12,color:'#5F6B5F',lineHeight:2}}><div>📱 +213 77 418 2227</div><div style={{color:'#5BAEC7',fontSize:11}}>واتساب متاح</div></div></div>
            <div><div style={{fontSize:11,letterSpacing:'.08em',color:'#C9963A',fontWeight:600,textTransform:'uppercase',marginBottom:'.8rem'}}>محلاتنا</div><div style={{fontSize:12,lineHeight:2}}><a href="https://maps.app.goo.gl/oQGHmRmDEpthsTS79?g_st=ai" target="_blank" style={{color:'#5BAEC7'}}>📍 المحل الأول</a><br/><a href="https://maps.app.goo.gl/8LJepAtLxjEP3Tyo8?g_st=ai" target="_blank" style={{color:'#5BAEC7'}}>📍 المحل الثاني</a></div></div>
            <div><div style={{fontSize:11,letterSpacing:'.08em',color:'#C9963A',fontWeight:600,textTransform:'uppercase',marginBottom:'.8rem'}}>الأقسام</div><div style={{fontSize:12,color:'#5F6B5F',lineHeight:2}}><div>التنبيهات الزراعية</div><div>الأبحاث العلمية</div><div onClick={()=>router.push('/portal')} style={{cursor:'pointer',color:'#5BAEC7'}}>بوابة العميل</div><div onClick={()=>router.push('/dashboard')} style={{cursor:'pointer',color:'#5BAEC7'}}>لوحة المدير</div></div></div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'1.2rem',borderTop:'.5px solid #E4E0DA'}}>
            <div style={{fontSize:11,color:'#9CA89C'}}>© 2025 aminefraya.ing — جميع الحقوق محفوظة</div>
            <button onClick={()=>window.open('https://wa.me/213774182227','_blank')} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'white',background:'#25D366',border:'none',borderRadius:10,padding:'7px 16px',cursor:'pointer'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              تواصل عبر واتساب
            </button>
          </div>
        </footer>
      </div>

      {/* WA Float */}
      <button className="wa-float" onClick={()=>window.open('https://wa.me/213774182227','_blank')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </button>

      {/* Article modal */}
      {modal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:500,padding:20}} onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
          <div style={{background:'#fff',borderRadius:14,width:'100%',maxWidth:560,maxHeight:'85vh',overflowY:'auto',border:'.5px solid #E4E0DA'}}>
            <div style={{padding:'1.2rem 1.4rem .8rem',borderBottom:'.5px solid #E4E0DA',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <span style={{display:'inline-block',fontSize:10,padding:'2px 9px',borderRadius:10,marginBottom:6,fontWeight:600,background:CAT_STYLES[modal.category]?.bg||'#F1EFE8',color:CAT_STYLES[modal.category]?.c||'#5F5E5A'}}>{modal.category}</span>
                <div style={{fontSize:16,fontWeight:600,lineHeight:1.4}}>{modal.title}</div>
              </div>
              <button onClick={()=>setModal(null)} style={{width:28,height:28,border:'.5px solid #D0CCC6',borderRadius:6,background:'transparent',cursor:'pointer',fontSize:14,color:'#5F6B5F'}}>✕</button>
            </div>
            <div style={{padding:'1.2rem 1.4rem',fontSize:13,lineHeight:1.9,color:'#5F6B5F'}} dangerouslySetInnerHTML={{__html:modal.body}}/>
            <div style={{padding:'.8rem 1.4rem',borderTop:'.5px solid #E4E0DA',display:'flex',gap:6,flexWrap:'wrap'}}>
              {modal.keywords.map(k=><span key={k} style={{fontSize:11,padding:'3px 10px',borderRadius:10,background:'#F8F5F0',color:'#5F6B5F'}}>#{k}</span>)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
