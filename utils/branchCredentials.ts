import { EGYPT_GOVERNORATES } from '../types';

/**
 * Helper to generate automatic branch login credentials (username & password)
 * - Username: [CompanyCode]_[branch_slug]_[index]
 * - Password: [branch_first_3_chars]@2026
 */

const EGYPT_CITY_SLUGS: Record<string, string> = {
  'نصر': 'nasr',
  'المعادي': 'maadi',
  'مصر الجديدة': 'heliopolis',
  'التجمع': 'tagamoa',
  'القاهرة الجديدة': 'newcairo',
  'أكتوبر': 'october',
  'اكتوبر': 'october',
  'زايد': 'zayed',
  'الشيخ زايد': 'zayed',
  'الدقي': 'dokki',
  'المهندسين': 'mohandessin',
  'الجيزة': 'giza',
  'جيزة': 'giza',
  'الهرم': 'haram',
  'فيصل': 'faisal',
  'الإسكندرية': 'alex',
  'الاسكندرية': 'alex',
  'اسكندرية': 'alex',
  'سموحة': 'smouha',
  'العجمي': 'agamy',
  'طنطا': 'tanta',
  'المحلة': 'mahalla',
  'المنصورة': 'mansoura',
  'منصورة': 'mansoura',
  'الزقازيق': 'zagazig',
  'زقازيق': 'zagazig',
  'العاشر': 'tenth',
  'الإسماعيلية': 'ismailia',
  'اسماعيلية': 'ismailia',
  'السويس': 'suez',
  'بورسعيد': 'portsaid',
  'أسيوط': 'assiut',
  'اسيوط': 'assiut',
  'سوهاج': 'sohag',
  'قنا': 'qena',
  'الأقصر': 'luxor',
  'الاقصر': 'luxor',
  'أسوان': 'aswan',
  'اسوان': 'aswan',
  'الفيوم': 'fayoum',
  'فيوم': 'fayoum',
  'بني سويف': 'benisuef',
  'المنيا': 'minya',
  'منيا': 'minya',
  'شبين': 'shebin',
  'المنوفية': 'menoufia',
  'بنها': 'banha',
  'القليوبية': 'qalyubia',
  'شبرا': 'shubra',
  'كفر الشيخ': 'kafr',
  'دمياط': 'damietta',
  'مطروح': 'matrouh',
  'الغردقة': 'hurghada',
  'شرم الشيخ': 'sharm'
};

const AR_TO_EN_CHAR_MAP: Record<string, string> = {
  'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th',
  'ج': 'g', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z',
  'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
  'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ئ': 'e', 'ء': 'a', 'ة': 'a'
};

/**
 * Transliterates an Arabic string to clean english letters
 */
export function transliterateArabic(text: string): string {
  if (!text) return 'br';
  
  // Clean prefixes like "فرع"
  const cleaned = text
    .replace(/^فرع\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Check known city mappings
  for (const [key, slug] of Object.entries(EGYPT_CITY_SLUGS)) {
    if (cleaned.includes(key)) {
      return slug;
    }
  }

  // Fallback: character-by-character transliteration
  let out = '';
  for (const char of cleaned) {
    if (AR_TO_EN_CHAR_MAP[char]) {
      out += AR_TO_EN_CHAR_MAP[char];
    } else if (/[a-zA-Z0-9]/.test(char)) {
      out += char.toLowerCase();
    }
  }

  const result = out.replace(/[^a-z0-9]/gi, '').slice(0, 8);
  return result.length >= 2 ? result : 'br';
}

/**
 * Generates automated username and password for a branch:
 * - Username: e.g. tam_nasr_01
 * - Password: e.g. nas@2026
 */
export function generateBranchCredentials(
  branchName: string,
  companyCode: string,
  index = 1
): { username: string; password: string; slug: string } {
  const cleanCode = (companyCode || 'comp').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 4);
  const slug = transliterateArabic(branchName);
  
  // First 3 chars of slug for password
  let shortSlug = slug.slice(0, 3).toLowerCase();
  if (shortSlug.length < 3) {
    shortSlug = (shortSlug + 'xyz').slice(0, 3);
  }

  const formattedIdx = index < 10 ? `0${index}` : `${index}`;
  const username = `${cleanCode}_${slug}_${formattedIdx}`;
  const password = `${shortSlug}@2026`;

  return { username, password, slug };
}

/**
 * Normalizes governorate string for resilient matching (ignoring hamzas, taa marbuta, spaces)
 */
export function normalizeGovernorate(gov?: string): string {
  return (gov || '')
    .trim()
    .replace(/[أإآا]/g, 'ا')
    .replace(/ة$/g, 'ه')
    .replace(/ى$/g, 'ي')
    .replace(/\s+/g, '')
    .toLowerCase();
}

/**
 * Matches an input governorate string against official Egyptian governorates
 */
export function matchGovernorate(inputGov: string): string | null {
  if (!inputGov || !inputGov.trim()) return null;
  const norm = normalizeGovernorate(inputGov);
  const found = EGYPT_GOVERNORATES.find(g => normalizeGovernorate(g) === norm);
  return found || null;
}
