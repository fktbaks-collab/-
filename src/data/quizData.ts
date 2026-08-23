import { Level, AvatarItem, CoinPackage, Question } from '../types';
import { ALL_500_QUIZ_LEVELS } from './quizLevelsData';

export const AVATAR_LIST: AvatarItem[] = [
  {
    id: 'avatar_default_1',
    name: 'شیر دانا',
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=KingLion&backgroundColor=b6e3f4,c0aede,d1d4f9',
    price: 0,
    isDefault: true,
  },
  {
    id: 'avatar_default_2',
    name: 'روباه باهوش',
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=SmartFox&backgroundColor=ffd5dc,ffdfbf',
    price: 0,
    isDefault: true,
  },
  {
    id: 'avatar_user_exclusive',
    name: 'پروفایل ویژه گیمر',
    image: 'https://uploadkon.ir/uploads/889016_261786897310851.png',
    price: 15,
    isDefault: false,
  },
  {
    id: 'avatar_cyber_warrior',
    name: 'سایبورگ قهرمان',
    image: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberHero&backgroundColor=c0aede',
    price: 30,
    isDefault: false,
  }
];

export const COIN_PACKAGES: CoinPackage[] = [
  {
    id: 'pack_starter',
    name: 'کیسه کوچک سکه',
    description: 'مناسب برای شارژ سریع و بازیابی جان',
    coins: 35,
    diamondCost: 1,
  },
  {
    id: 'pack_gold_pouch',
    name: 'کیسه پر از طلا',
    description: 'محبوب‌ترین بسته با ۱۰ سکه جایزه رایگان',
    coins: 80,
    diamondCost: 2,
    bonusTag: '۱۰ سکه هدیه',
    popular: true,
  },
  {
    id: 'pack_royal_chest',
    name: 'صندوقچه سلطنتی',
    description: 'ارزش اقتصادی بالا با ۳۰ سکه اضافه',
    coins: 170,
    diamondCost: 4,
    bonusTag: '۳۰ سکه هدیه',
  },
  {
    id: 'pack_grand_vault',
    name: 'خزانه بزرگ پادشاهی',
    description: 'بزرگترین بسته با بیشترین سود و ۸۰ سکه جایزه ویژه',
    coins: 360,
    diamondCost: 8,
    bonusTag: '۸۰ سکه هدیه ویژه',
  },
];

export const QUIZ_LEVELS: Level[] = ALL_500_QUIZ_LEVELS;

export const LOADING_TIPS = [
  '💡 آیا می‌دانستید؟ مغز انسان در زمان حل معماها انرژی بیشتری مصرف می‌کند!',
  '⚡ هر ۱ ساعت، ۱ عدد جان رایگان به شما تعلق می‌گیرد.',
  '🏆 با برنده شدن در مراحل، سکه و کاپ‌های باارزش به دست آورید.',
  '🎨 می‌توانید از بخش فروشگاه پروفایل ویژه خریداری کنید.',
  '⏱️ برای پاسخ به هر سوال ۱۵ ثانیه فرصت دارید؛ عجله نکنید ولی سریع باشید!',
  '⚔️ در بخش دوئل آنلاین با دوستانتان مسابقه دهید و سرعت هوش خود را به چالش بکشید!'
];

export const ALL_POOLED_QUESTIONS: Question[] = [
  ...QUIZ_LEVELS.flatMap((l) => l.questions),
  {
    id: 'extra_1',
    text: 'کدام کشور بیشترین قهرمانی در تاریخ جام‌های جهانی فوتبال را دارد؟',
    options: ['آلمان', 'برزیل (۵ بار)', 'ایتالیا', 'آرژانتین'],
    correctIndex: 1,
    explanation: 'تیم ملی برزیل با ۵ عنوان قهرمانی پرافتخارترین تیم تاریخ جام جهانی است.',
  },
  {
    id: 'extra_2',
    text: 'کدام سیاره به عنوان درخشان‌ترین جرم آسمانی پس از ماه در آسمان شب دیده می‌شود؟',
    options: ['زهره (ناهید)', 'مریخ', 'مشتری', 'زحل'],
    correctIndex: 0,
    explanation: 'زهره به دلیل ابرهای غلیظ بازتابنده نور خورشید بسیار درخشان است.',
  },
  {
    id: 'extra_3',
    text: 'کدام عنصر شیمیایی با نماد "Au" در جدول تناوبی شناخته می‌شود؟',
    options: ['نقره', 'مس', 'طلا', 'آلومینیوم'],
    correctIndex: 2,
    explanation: 'نماد شیمیایی طلا برگرفته از واژه لاتین Aurum به معنی طلا است.',
  },
  {
    id: 'extra_4',
    text: 'اولین رئیس جمهور کشور ایالات متحده آمریکا چه کسی بود؟',
    options: ['آبراهام لینکلن', 'توماس جفرسون', 'جورج واشنگتن', 'جان اف کندی'],
    correctIndex: 2,
    explanation: 'جورج واشنگتن در سال ۱۷۸۹ به عنوان نخستین رئیس‌جمهور آمریکا برگزیده شد.',
  }
];

