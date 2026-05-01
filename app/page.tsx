'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getArticles, type Article } from '@/lib/supabase'

const CAT_STYLES = {
  'حماية النباتات':{bg:'#EAF3DE',c:'#3B6D11'},
  'التغذية الزراعية':{bg:'#FAEEDA',c:'#854F0B'},
  'الري والمياه':{bg:'#E6F1FB',c:'#185FA5'},
  'المحاصيل الحقلية':{bg:'#FBEAF0',c:'#993556'},
}

export default function HomePage(){
  const router = useRouter()
  const [articles,setArticles] = useState<Article[]>([])
  const [modal,setModal] = useState<Article|null>(null)

  useEffect(()=>{
    getArticles().then(({data})=>{
      if(data) setArticles(data)
    })
  },[])

  return(
    <div>

      {/* NAVBAR */}
      <nav style={{
        display:'flex',
        flexWrap:'wrap',
        justifyContent:'space-between',
        padding:'12px 20px',
        borderBottom:'1px solid #eee'
      }}>
        <div style={{fontWeight:600}}>aminefraya.ing</div>

        <div style={{
          display:'flex',
          gap:10,
          flexWrap:'wrap',
          justifyContent:'center',
          width:'100%',
          marginTop:10
        }}>
          <button onClick={()=>router.push('/portal')}>بوابة العميل</button>
          <button onClick={()=>router.push('/dashboard')}>لوحة المدير</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        maxWidth:700,
        margin:'0 auto',
        padding:'2rem 20px',
        textAlign:'center',
        width:'100%'
      }}>
        <div style={{
          fontSize:14,
          color:'#5F6B5F',
          marginBottom:'2rem'
        }}>
          مستلزمات زراعية، استشارات، ومتابعة كاملة
        </div>

        <div style={{
          display:'flex',
          flexDirection:'column',
          gap:10,
          alignItems:'center'
        }}>
          <button
            onClick={()=>router.push('/portal')}
            style={{
              width:'100%',
              maxWidth:300,
              padding:'10px',
              background:'#2D6A4F',
              color:'#fff',
              border:'none'
            }}
          >
            دخول
          </button>

          <button
            style={{
              width:'100%',
              maxWidth:300,
              padding:'10px',
              border:'1px solid #2D6A4F'
            }}
          >
            الخدمات
          </button>
        </div>
      </div>

      {/* ARTICLES */}
      <div style={{maxWidth:1100,margin:'0 auto',padding:'2rem 20px'}}>
        <h2>الأبحاث</h2>

        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit, minmax(250px,1fr))',
          gap:12
        }}>
          {articles.map(a=>{
            const cs = CAT_STYLES[a.category] || {bg:'#eee',c:'#333'}
            return(
              <div
                key={a.id}
                onClick={()=>setModal(a)}
                style={{
                  border:'1px solid #eee',
                  padding:'1rem',
                  cursor:'pointer'
                }}
              >
                <span style={{
                  background:cs.bg,
                  color:cs.c,
                  padding:'2px 8px',
                  fontSize:10
                }}>
                  {a.category}
                </span>

                <div style={{fontWeight:600,marginTop:10}}>
                  {a.title}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div
          style={{
            position:'fixed',
            inset:0,
            background:'rgba(0,0,0,.5)',
            display:'flex',
            justifyContent:'center',
            alignItems:'center',
            padding:20
          }}
          onClick={(e)=>{
            if(e.target===e.currentTarget) setModal(null)
          }}
        >
          <div style={{
            background:'#fff',
            width:'100%',
            maxWidth:500,
            maxHeight:'80vh',
            overflow:'auto',
            padding:20
          }}>
            <h3>{modal.title}</h3>

            <div
              dangerouslySetInnerHTML={{__html:modal.body}}
            />

            <div style={{marginTop:10}}>
              {modal.keywords.map(k=>(
                <span key={k} style={{marginRight:6}}>
                  #{k}
                </span>
              ))}
            </div>

            <button onClick={()=>setModal(null)}>close</button>
          </div>
        </div>
      )}

    </div>
  )
}
