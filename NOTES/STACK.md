# Стек: хаана, юунд ашиглах вэ

_Шинэчилсэн: 2026-11-12. Үе шатны дугаар нь `PLAN.md`-тэй ижил._

## Ерөнхий бүтэц

```
Хэрэглэгчийн браузер
      │
      ▼
Next.js апп (хуудсууд + /api серверийн хэсэг)
      │
      ├── Clerk ............ хэн нэвтэрсэн бэ, эзэн мөн үү
      ├── Drizzle → Supabase Postgres ... видео, гишүүн, like, үнэлгээ, сэтгэгдэл
      ├── Supabase Storage . видео файл, thumbnail (хаалттай)
      ├── Hugging Face ..... яриаг текст болгох, утгыг вектор болгох
      ├── Pinecone ......... утгаар хайх
      ├── Wire.mn .......... төлбөр
      └── n8n (арын ажил) ── Facebook API (пост)
```

## Сервис бүр хаана, юунд хэрэглэгдэх вэ

| Сервис                     | Энэ төсөлд юу хийх                                                                                   | Кодын байршил                                                            | Төлөв         |
| -------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------- |
| **Next.js**                | Бүх хуудас, API                                                                                      | `src/app/`                                                               | ✅            |
| **Clerk**                  | Нэвтрэх, бүртгүүлэх; эзнийг таних (`publicMetadata.role = "admin"`)                                  | `src/middleware.ts`, `src/lib/auth.ts`, `src/components/site-header.tsx` | ✅            |
| **Supabase Postgres**      | Өгөгдлийн сан (RLS асаалттай, зөвхөн манай сервер хандана)                                           | Supabase төсөл `ivmjsfbvnqixnzcmmedq`                                    | ✅            |
| **Drizzle**                | Өгөгдлийн сантай TypeScript-ээр ажиллах; хүснэгтийн бүтэц                                            | `src/db/schema.ts`, `src/db/index.ts`, `drizzle/`                        | ✅            |
| **Supabase Storage**       | Видео, thumbnail хадгалах. Түр хугацааны (1 цаг) линкээр үзүүлнэ                                     | `src/lib/supabase.ts`, `src/app/api/videos/upload-url/`                  | ✅            |
| **Hugging Face**           | Яриаг текст болгох (Whisper); текстийг утгын вектор болгох (multilingual MiniLM, 384)                | `src/lib/hf.ts`                                                          | 8-р шат       |
| **Pinecone**               | Асуултаар **утгаар** хайх; төстэй видео санал болгох                                                 | `src/lib/pinecone.ts`                                                    | 8-р шат       |
| **n8n**                    | Арын ажил: видеог текст болгох, шинэ хүсэлтийн имэйл, Facebook пост. Апп руу нууц header-тэй webhook | n8n workflow                                                             | 4, 8, 9-р шат |
| **Facebook Graph API**     | Шинэ **нээлттэй** видеог эзний хуудсанд нийтлэх (гишүүн татах)                                       | n8n дотор                                                                | 9а            |
| **Wire.mn**                | Дэмжлэг, төлбөртэй видео. "Төлсөн" төлөвийг **зөвхөн** баталгаат webhook-оор өөрчилнө                | `src/lib/wire.ts`                                                        | 9б            |
| **GitHub Actions + Husky** | PR бүрт lint, typecheck, build; commit-оос өмнө шалгах                                               | `.github/workflows/ci.yml`, `.husky/`                                    | ✅            |

## Бодит урсгал

**1. Эзэн видео оруулах** ✅
Clerk эзэн гэж шалгана → браузер Supabase Storage руу шууд файл илгээнэ (signed upload URL) → Drizzle `videos` хүснэгтэд мөр нэмнэ.
_8-р шатаас:_ n8n → Hugging Face текст болгоно → вектор → Pinecone.

**2. Хүн видео үзэх** ✅
Drizzle видеог уншина → нээлттэй эсвэл гишүүн мөн эсэхийг шалгана (4-р шат) → Storage-оос 1 цагийн линк → тоглуулна.

**3. Гишүүн болох** (4-р шат)
Clerk-ээр нэвтэрнэ → `/join` хүсэлт → Drizzle `members` (`pending`) → n8n эзэнд мэдэгдэнэ → эзэн `/admin/members` дээр батална.

**4. Хайх** (8-р шат)
Асуулт → Hugging Face вектор → Pinecone ойр утгатай видео → Drizzle дэлгэрэнгүй → үр дүн (видеоны яг тэр секунд).

## Яагаад хоёр газар хадгалах вэ?

- **Supabase:** нарийн баримт. Ямар видео, хэн like дарсан, хэдэн од өгсөн.
- **Pinecone:** утга. "Энэ видео трейдингийн алдааны тухай" гэдгийг ойлгож хайх.

## Түлхүүрүүд, хэзээ хэрэгтэй вэ

| Хэзээ    | Бүртгүүлэх                  | `.env.local`                                                                                                         |
| -------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| ✅ Бэлэн | Clerk, Supabase             | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| 4-р шат  | n8n (имэйл мэдэгдэл хүсвэл) | `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`                                                                              |
| 8-р шат  | Hugging Face, Pinecone      | `HF_TOKEN`, `PINECONE_API_KEY`, `PINECONE_INDEX`                                                                     |
| 9-р шат  | Facebook Page, Wire.mn      | `FB_PAGE_ID`, `FB_PAGE_TOKEN`, `WIRE_API_KEY`, `WIRE_WEBHOOK_SECRET`                                                 |

**Дүрэм:** нууц түлхүүрийг зөвхөн `src/lib/` болон `src/app/api/` ашиглана. `NEXT_PUBLIC_`-ээр эхэлсэн түлхүүр л браузерт очно.
