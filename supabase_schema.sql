-- ============================================================
-- aminefraya.ing — Supabase Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- 1. OWNER SETTINGS (single row, id=1 always)
CREATE TABLE IF NOT EXISTS owner_settings (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  email       TEXT NOT NULL DEFAULT 'islemteboul8@gmail.com',
  password    TEXT NOT NULL DEFAULT 'islemteboul8',
  whatsapp    TEXT NOT NULL DEFAULT '+213774182227',
  site_name   TEXT NOT NULL DEFAULT 'aminefraya.ing',
  tagline_ar  TEXT NOT NULL DEFAULT 'شريكك الزراعي الموثوق',
  tagline_fr  TEXT NOT NULL DEFAULT 'Votre Partenaire Agricole de Confiance',
  shop1_url   TEXT NOT NULL DEFAULT 'https://maps.app.goo.gl/oQGHmRmDEpthsTS79?g_st=ai',
  shop2_url   TEXT NOT NULL DEFAULT 'https://maps.app.goo.gl/8LJepAtLxjEP3Tyo8?g_st=ai',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default row
INSERT INTO owner_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 2. CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT DEFAULT '',
  region      TEXT DEFAULT '',
  type        TEXT DEFAULT 'زراعة حبوب',
  notes       TEXT DEFAULT '',
  status      TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  code        TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Sample clients
INSERT INTO clients (name, phone, region, type, notes, status, code) VALUES
  ('محمد بن علي',   '+213 661 234 567', 'قسنطينة', 'زراعة حبوب',       'مزرعة 50 هكتار قمح صلب',          'active',   'AF-7X3K'),
  ('فاطمة زروق',    '+213 770 987 654', 'عنابة',    'بستنة وخضروات',    'بيوت محمية طماطم وفلفل',           'active',   'AF-2M9P'),
  ('عمر حمداني',    '+213 555 112 233', 'سكيكدة',   'أشجار مثمرة',      'بستان زيتون وتفاح',                'active',   'AF-5R1Q'),
  ('نورة بلقاسم',   '+213 698 445 778', 'قالمة',    'زراعة متنوعة',     '',                                  'inactive', 'AF-8T6W')
ON CONFLICT (code) DO NOTHING;

-- 3. POSTS
CREATE TABLE IF NOT EXISTS posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   TEXT NOT NULL DEFAULT 'all', -- 'all' or client UUID
  type        TEXT DEFAULT 'text' CHECK (type IN ('text','image','video','file')),
  content     TEXT NOT NULL,
  media_label TEXT DEFAULT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHECKLIST ITEMS
CREATE TABLE IF NOT EXISTS checklist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  done        BOOLEAN DEFAULT FALSE,
  done_at     TIMESTAMPTZ DEFAULT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Sample checklist items
INSERT INTO checklist_items (client_id, text, done, done_at)
SELECT id, 'رش الدورة الأولى من Mancozeb', TRUE, NOW() FROM clients WHERE code='AF-7X3K'
ON CONFLICT DO NOTHING;
INSERT INTO checklist_items (client_id, text, done)
SELECT id, 'قياس رطوبة التربة قطعة A', FALSE FROM clients WHERE code='AF-7X3K'
ON CONFLICT DO NOTHING;
INSERT INTO checklist_items (client_id, text, done)
SELECT id, 'إجراء الفحص الأسبوعي للأوراق', FALSE FROM clients WHERE code='AF-7X3K'
ON CONFLICT DO NOTHING;
INSERT INTO checklist_items (client_id, text, done, done_at)
SELECT id, 'تركيب شبكة الري الجديدة', TRUE, NOW() FROM clients WHERE code='AF-2M9P'
ON CONFLICT DO NOTHING;
INSERT INTO checklist_items (client_id, text, done)
SELECT id, 'تطبيق السماد الورقي', FALSE FROM clients WHERE code='AF-2M9P'
ON CONFLICT DO NOTHING;
INSERT INTO checklist_items (client_id, text, done)
SELECT id, 'تقليم الأشجار وفق الجدول', FALSE FROM clients WHERE code='AF-5R1Q'
ON CONFLICT DO NOTHING;

-- 5. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text        TEXT NOT NULL,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Sample notifications
INSERT INTO notifications (text, read) VALUES
  ('محمد بن علي أكمل بند "رش الدورة الأولى من Mancozeb"', FALSE),
  ('فاطمة زروق أكملت بند "تركيب شبكة الري الجديدة"', FALSE),
  ('عمر حمداني دخل بوابته الشخصية', TRUE);

-- 6. CALENDAR EVENTS
CREATE TABLE IF NOT EXISTS calendar_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type        TEXT DEFAULT 'visit' CHECK (type IN ('visit','spray','delivery','followup')),
  date        DATE NOT NULL,
  time        TIME DEFAULT '09:00',
  note        TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Sample events
INSERT INTO calendar_events (client_id, type, date, time, note)
SELECT id, 'visit', '2025-04-28', '09:00', 'فحص الحقل القطعة A' FROM clients WHERE code='AF-7X3K'
ON CONFLICT DO NOTHING;
INSERT INTO calendar_events (client_id, type, date, time, note)
SELECT id, 'spray', '2025-04-30', '07:00', 'رش Mancozeb الدورة 2' FROM clients WHERE code='AF-2M9P'
ON CONFLICT DO NOTHING;
INSERT INTO calendar_events (client_id, type, date, time, note)
SELECT id, 'delivery', '2025-05-02', '10:00', 'تسليم 10 كغ أسمدة' FROM clients WHERE code='AF-7X3K'
ON CONFLICT DO NOTHING;
INSERT INTO calendar_events (client_id, type, date, time, note)
SELECT id, 'followup', '2025-05-05', '14:00', 'متابعة بعد تقليم الأشجار' FROM clients WHERE code='AF-5R1Q'
ON CONFLICT DO NOTHING;

-- 7. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  product     TEXT NOT NULL,
  molecule    TEXT NOT NULL,
  qty         TEXT DEFAULT '',
  price       NUMERIC(10,2) DEFAULT 0,
  date        DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Sample orders
INSERT INTO orders (client_id, product, molecule, qty, price, date)
SELECT id, 'Mancozeb 80WP', 'Mancozeb', '5 كغ', 2800, '2025-04-10' FROM clients WHERE code='AF-7X3K'
ON CONFLICT DO NOTHING;
INSERT INTO orders (client_id, product, molecule, qty, price, date)
SELECT id, 'Imidacloprid 35SC', 'Imidacloprid', '1 لتر', 4500, '2025-04-12' FROM clients WHERE code='AF-2M9P'
ON CONFLICT DO NOTHING;
INSERT INTO orders (client_id, product, molecule, qty, price, date)
SELECT id, 'NPK 20-20-20', 'N-P-K', '25 كغ', 3200, '2025-04-15' FROM clients WHERE code='AF-7X3K'
ON CONFLICT DO NOTHING;
INSERT INTO orders (client_id, product, molecule, qty, price, date)
SELECT id, 'Cypermethrin 10EC', 'Cypermethrin', '500 مل', 1800, '2025-04-18' FROM clients WHERE code='AF-5R1Q'
ON CONFLICT DO NOTHING;
INSERT INTO orders (client_id, product, molecule, qty, price, date)
SELECT id, 'Glyphosate 48SL', 'Glyphosate', '2 لتر', 2200, '2025-04-20' FROM clients WHERE code='AF-2M9P'
ON CONFLICT DO NOTHING;
INSERT INTO orders (client_id, product, molecule, qty, price, date)
SELECT id, 'Sulfur 80WG', 'Sulfur', '3 كغ', 950, '2025-04-22' FROM clients WHERE code='AF-8T6W'
ON CONFLICT DO NOTHING;

-- 8. ARTICLES
CREATE TABLE IF NOT EXISTS articles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL DEFAULT 'حماية النباتات',
  title       TEXT NOT NULL,
  excerpt     TEXT NOT NULL,
  body        TEXT NOT NULL,
  keywords    TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Sample articles
INSERT INTO articles (category, title, excerpt, body, keywords) VALUES
('حماية النباتات', 'المقاومة للمبيدات الحشرية — آليات التطور وطرق الوقاية',
 'تطور مقاومة الآفات للمبيدات هو أحد أكبر التحديات في الزراعة الحديثة.',
 '<b>تعريف المقاومة:</b> هي قدرة مكتسبة لدى مجموعة من الآفات على تحمّل جرعات من المبيد كانت تقتلها سابقاً.<br><br><b>آليات التطور:</b> تشمل التحولات الجينية في المستقبلات العصبية، زيادة نشاط الإنزيمات المحللة، وتقليل نفاذية الجلد الخارجي للآفة.<br><br><b>إستراتيجية التناوب:</b> تغيير المادة الفعالة دورياً وفق مجموعات المبيدات (IRAC) يُبطئ تطور المقاومة بشكل ملحوظ.<br><br><b>التوصية العملية:</b> لا تستخدم نفس المادة الفعالة أكثر من مرتين في الموسم الواحد.',
 ARRAY['مبيدات','مقاومة','آفات','حماية النباتات','IRAC']),

('التغذية الزراعية', 'دور النيتروجين في تكوين البروتين النباتي وزيادة الغلة',
 'النيتروجين هو العنصر الأكثر تأثيراً على إنتاجية المحاصيل.',
 '<b>وظيفة النيتروجين:</b> يدخل في تركيب الأحماض الأمينية والبروتينات والكلوروفيل.<br><br><b>علامات النقص:</b> اصفرار الأوراق القديمة أولاً، تقزّم النبات، وضعف الفروع الجانبية.<br><br><b>توقيت التسميد:</b> 30% عند الزراعة، 40% عند التفريع، 30% عند بداية الإسبال.',
 ARRAY['نيتروجين','أسمدة','غلة','قمح','تسميد']),

('الري والمياه', 'الري بالتنقيط في الخضروات — كفاءة المياه وتقليل الأمراض',
 'الري بالتنقيط يقلل استهلاك المياه بنسبة تصل إلى 50% مقارنة بالري التقليدي.',
 '<b>المبدأ:</b> توصيل الماء مباشرة لمنطقة الجذور بكميات صغيرة ومتكررة.<br><br><b>فوائد إضافية:</b> إبقاء الأوراق جافة يقلل الأمراض الفطرية بنسبة 35-40%.<br><br><b>Fertigation:</b> إمكانية إضافة الأسمدة الذائبة مع ماء الري تزيد كفاءة الامتصاص لـ 90%.',
 ARRAY['ري بالتنقيط','خضروات','مياه','fertigation','توفير']),

('المحاصيل الحقلية', 'القمح الصلب في شرق الجزائر — أفضل الأصناف وكثافة البذر',
 'اختيار الصنف المناسب وكثافة البذر الصحيحة من أهم عوامل نجاح محصول القمح الصلب.',
 '<b>الأصناف الموصى بها:</b> Mohamed Ben Bachir (MBB) وGTA Dur — متكيفان مع ظروف الجفاف النسبي.<br><br><b>كثافة البذر:</b> 180-220 كغ/هكتار للزراعة المبكرة، 220-260 كغ/هكتار للزراعة المتأخرة.<br><br><b>التناوب المحصولي:</b> تناوب القمح مع البقوليات يُحسّن خصوبة التربة.',
 ARRAY['قمح صلب','قسنطينة','بذور','كثافة البذر','صنف']),

('حماية النباتات', 'حشرة ذبابة الفاكهة — التعرف والمكافحة المتكاملة',
 'ذبابة الفاكهة من أشد آفات بستان شرق الجزائر ضراوةً — خسائرها تبلغ 40-70%.',
 '<b>التعرف:</b> حشرة صغيرة، اليرقات تتغذى داخل الثمار مُسببةً تعفّنها.<br><br><b>المكافحة الجاذبة:</b> فخاخ البروتين الهيدروليزي تجذب الإناث وتقلل الكثافة العددية بنسبة 60%.<br><br><b>المبيدات الفعالة:</b> Spinosad (عضوي)، Malathion (تقليدي).',
 ARRAY['ذبابة الفاكهة','بستان','مبيدات','spinosad','مكافحة متكاملة']),

('التغذية الزراعية', 'نقص الحديد في الأراضي الكلسية — التشخيص والعلاج',
 'التربة الكلسية الشائعة في شرق الجزائر تُقيّد امتصاص الحديد رغم وجوده.',
 '<b>السبب:</b> في التربة القلوية، يتحول الحديد إلى أشكال غير ذائبة.<br><br><b>الأعراض:</b> اصفرار الأوراق الحديثة مع بقاء العروق خضراء.<br><br><b>العلاج:</b> رش ورقي بـ FeSO₄ 3-4 غ/لتر، أو استخدام مخلّبات الحديد EDDHA.',
 ARRAY['حديد','تربة كلسية','اصفرار','pH','مخلبات']),

('الري والمياه', 'جدولة الري بناءً على احتياجات المحصول وبيانات الطقس',
 'الري الزائد أضرّ بالزراعة الجزائرية من الري الناقص.',
 '<b>مفهوم ET₀:</b> التبخر-النتح المرجعي يُحسب من بيانات الطقس.<br><br><b>معامل المحصول Kc:</b> القمح: Kc=0.3 بداية → 1.15 ذروة → 0.25 نضج.<br><br><b>أدوات مجانية:</b> FAO AquaCrop يُعطي جداول ري دقيقة.',
 ARRAY['جدولة الري','ET0','AquaCrop','كفاءة الري','FAO']),

('المحاصيل الحقلية', 'الشعير كمحصول استراتيجي — تكيّفه مع الجفاف في شرق الجزائر',
 'الشعير يتميز بتحمّل الجفاف والملوحة مما يجعله خياراً استراتيجياً.',
 '<b>الميزة التنافسية:</b> الشعير يُكمل دورته الحياتية بـ 350 مم من الأمطار فقط.<br><br><b>الأصناف:</b> Rihane و Saida 183 — متكيفان مع قسنطينة والأوراس.<br><br><b>مقاومة الملوحة:</b> يتحمل حتى 8 dS/m ملوحة التربة.',
 ARRAY['شعير','جفاف','أعلاف','ملوحة','قسنطينة']);

-- ============================================================
-- ROW LEVEL SECURITY — allow anon read/write for this app
-- (owner auth is handled in-app, not via Supabase Auth)
-- ============================================================
ALTER TABLE owner_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles         ENABLE ROW LEVEL SECURITY;

-- Allow anon full access (app-level auth controls access)
CREATE POLICY "anon_all" ON owner_settings   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON clients          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON posts            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON checklist_items  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON notifications    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON calendar_events  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON orders           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON articles         FOR ALL USING (true) WITH CHECK (true);
