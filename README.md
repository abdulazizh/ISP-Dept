# نظام إدارة المشتركين - SAS Radius Server

نظام متكامل لإدارة المشتركين والفواتير والديون متصل بسيرفر SAS Radius. يوفر واجهة عربية حديثة لإدارة جميع عمليات مقدمي خدمات الإنترنت.

## 🚀 المميزات الرئيسية

### إدارة السيرفرات
- إضافة وحذف وتعديل السيرفرات
- اختبار الاتصال قبل الحفظ
- تخزين بيانات السيرفرات بشكل آمن
- دعم اتصال متعدد السيرفرات

### إدارة المشتركين
- عرض قائمة المشتركين مع البحث والفلترة
- إنشاء مشتركين جدد
- تفعيل وتعطيل المشتركين
- تجديد الاشتراكات مع خيار واصل/دين
- قطع الاتصال الفوري
- حذف المشتركين (مع حماية من الحذف إذا كان لديهم ديون)

### إدارة الباقات (Profiles)
- عرض جميع الباقات المتاحة
- عرض تفاصيل السرعة والسعر

### إدارة المدراء (Managers)
- عرض قائمة المدراء
- عرض صلاحيات كل مدير

### سجل التفعيلات (Activation Logs)
- عرض سجل كامل لجميع العمليات
- فلترة حسب نوع العملية (تفعيل/تجديد/تعطيل)
- عرض تفاصيل المبلغ والباقة والتاريخ

### إدارة الديون
- تسجيل الديون على المشتركين
- تسجيل المدفوعات الجزئية
- تقارير وإحصائيات الديون
- حماية من حذف المشتركين المديونين

## 🛠️ التقنيات المستخدمة

### Frontend
- **Next.js 15** - إطار عمل React للويب
- **React Native (Expo)** - لتطبيقات الموبايل
- **TypeScript** - للكتابة الآمنة
- **Tailwind CSS** - للتنسيق السريع
- **shadcn/ui** - مكونات UI جاهزة

### Backend
- **Next.js API Routes** - للـ proxy والـ API
- **Prisma** - ORM لقواعد البيانات
- **Axios** - للطلبات HTTP

### التخزين
- **AsyncStorage** - للويب
- **SQLite** - للموبايل
- **localStorage** - للتخزين المؤقت

## 📦 هيكل المشروع

```
├── src/
│   ├── app/
│   │   ├── page.tsx          # الصفحة الرئيسية
│   │   ├── layout.tsx        # تخطيط التطبيق
│   │   └── api/
│   │       └── sas/
│   │           └── route.ts  # API Proxy
│   ├── components/
│   │   ├── sas/              # مكونات SAS
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── UsersTab.tsx
│   │   │   ├── ActivationsTab.tsx
│   │   │   ├── ProfilesTab.tsx
│   │   │   ├── ServersTab.tsx
│   │   │   └── ...
│   │   └── ui/               # مكونات UI
│   ├── hooks/
│   │   ├── useSAS.ts         # Hook للـ SAS API
│   │   └── useServers.ts     # Hook لإدارة السيرفرات
│   ├── types/
│   │   └── index.ts          # تعريفات TypeScript
│   └── utils/
│       ├── constants.ts      # الثوابت
│       └── formatters.ts     # دوال التنسيق
│
└── debt-invoice-app/         # تطبيق React Native (Expo)
    ├── app/
    │   ├── (tabs)/
    │   │   ├── subscribers.tsx
    │   │   ├── debts.tsx
    │   │   ├── servers.tsx
    │   │   └── invoices.tsx
    │   └── _layout.tsx
    ├── src/
    │   ├── api/
    │   │   └── sasApi.ts      # SAS API Client
    │   ├── context/
    │   │   └── AppContext.tsx
    │   └── database/
    │       ├── database.web.ts
    │       └── database.native.ts
    └── package.json
```

## 🔧 التثبيت والتشغيل

### متطلبات التشغيل
- Node.js 18+
- Bun أو npm
- Expo CLI (للموبايل)

### تشغيل التطبيق ويب

```bash
# تثبيت التبعيات
bun install

# تشغيل الخادم
bun run dev
```

### تشغيل تطبيق الموبايل

```bash
cd debt-invoice-app
bun install
bun start
```

## 🔐 إعدادات السيرفر

### الاتصال بسيرفر SAS

```typescript
const serverConfig = {
  name: 'سيرفر الرئيسي',
  url: 'http://your-server-ip',
  username: 'admin',
  password: 'password',
  isDefault: true
};
```

### مفاتيح التشفير

يستخدم النظام تشفير AES للتواصل مع API:

```typescript
const ENCRYPTION_KEY = 'abcdefghijuklmno0123456789012345';
```

## 📡 API Endpoints

### التوثيق
```
POST /api/sas
{
  "action": "login",
  "server": { "url", "username", "password" }
}
```

### مزامنة البيانات
```
POST /api/sas
{
  "action": "syncAll",
  "server": { "url" },
  "token": "..."
}
```

### تفعيل مستخدم
```
POST /api/sas
{
  "action": "activateUser",
  "userId": 123,
  "profileId": 1,
  "months": 1,
  "amount": 25000
}
```

### تجديد اشتراك
```
POST /api/sas
{
  "action": "renewSubscription",
  "userId": 123,
  "months": 1,
  "amount": 25000
}
```

### سجل التفعيلات
```
POST /api/sas
{
  "action": "getActivationLog",
  "page": 1,
  "count": 100
}
```

## 📝 التحديثات الأخيرة

### الإصدار 2.0.0

#### المميزات الجديدة
- ✅ إضافة صفحة سجل التفعيلات (ActivationLog)
- ✅ تحسين واجهة تجديد الاشتراك مع خيار واصل/دين
- ✅ إصلاح حذف الدين (السماح بالحذف مع تأكيد)
- ✅ تسجيل الدين تلقائياً عند التجديد

#### الإصلاحات
- 🐛 إصلاح مشكلة عدم عمل التفعيل والتعطيل
- 🐛 إصلاح مشكلة عدم عمل قطع الاتصال
- 🐛 إصلاح مشكلة عدم تحديث البيانات بعد العمليات
- 🐛 إصلاح مشكلة عدم ظهور سجل التفعيلات

#### التحسينات
- ⚡ تحسين أداء المزامنة
- ⚡ إضافة تحديث تلقائي للبيانات بعد الاتصال
- ⚡ تحسين رسائل التأكيد والخطأ

## 🤝 المساهمة

نرحب بمساهماتكم! يرجى:
1. عمل Fork للمشروع
2. إنشاء branch للميزة الجديدة
3. تقديم Pull Request

## 📄 الرخصة

هذا المشروع مرخص تحت رخصة MIT.

## 📞 الدعم

للدعم والاستفسارات:
- افتح Issue على GitHub
- تواصل عبر البريد الإلكتروني

---

**تم التطوير بواسطة فريق ISP-Dept**
