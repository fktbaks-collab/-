// Script to generate 500 highly diverse, non-repetitive Persian quiz levels
import fs from 'fs';
import path from 'path';

// Let's create an expansive database of categories and distinct questions
const categories = [
  { id: 'space', name: 'نجوم و فضا', icon: 'Sparkles' },
  { id: 'iran_history', name: 'تاریخ ایران', icon: 'Crown' },
  { id: 'world_history', name: 'تاریخ جهان', icon: 'Compass' },
  { id: 'geography_iran', name: 'جغرافیای ایران', icon: 'MapPin' },
  { id: 'geography_world', name: 'جغرافیای جهان', icon: 'Globe' },
  { id: 'nature_animals', name: 'حیات وحش و جانوران', icon: 'Eye' },
  { id: 'plants_forests', name: 'گیاهان و طبیعت', icon: 'TreePine' },
  { id: 'physics_chemistry', name: 'فیزیک و شیمی', icon: 'FlaskConical' },
  { id: 'human_body', name: 'بدن انسان و زیست‌شناسی', icon: 'HeartPulse' },
  { id: 'medicine_health', name: 'پزشکی و سلامت', icon: 'Activity' },
  { id: 'persian_lit', name: 'ادبیات و شعر فارسی', icon: 'BookOpen' },
  { id: 'world_lit', name: 'ادبیات جهان و شاهکارها', icon: 'BookMarked' },
  { id: 'art_painting', name: 'هنر و نقاشی', icon: 'Palette' },
  { id: 'architecture', name: 'معماری و بناهای تاریخی', icon: 'Landmark' },
  { id: 'cinema_movie', name: 'سینما و فیلم‌های برتر', icon: 'Film' },
  { id: 'music_instruments', name: 'موسیقی و سازها', icon: 'Music' },
  { id: 'football_world', name: 'فوتبال جهان و جام جهانی', icon: 'Trophy' },
  { id: 'football_iran', name: 'فوتبال و ورزش ایران', icon: 'Medal' },
  { id: 'olympic_sports', name: 'ورزش‌های المپیک و رکوردی', icon: 'Target' },
  { id: 'tech_computing', name: 'فناوری و علوم کامپیوتر', icon: 'Cpu' },
  { id: 'inventions', name: 'اختراعات و نوآوری‌ها', icon: 'Zap' },
  { id: 'mythology', name: 'اساطیر و افسانه‌های کهن', icon: 'Shield' },
  { id: 'culinary_food', name: 'آشپزی، خوراک و ادویه‌ها', icon: 'Coffee' },
  { id: 'oceans_seas', name: 'دریاها و اقیانوس‌شناسی', icon: 'Waves' },
  { id: 'gaming_pop', name: 'بازی‌های ویدیویی و پاپ‌کالچر', icon: 'Gamepad2' },
  { id: 'philosophy', name: 'فلسفه و اندیشه', icon: 'Brain' },
  { id: 'aviation_space', name: 'هوانوردی و مأموریت‌های فضایی', icon: 'Rocket' },
  { id: 'earth_geology', name: 'زمین‌شناسی، کوه‌ها و آتشفشان‌ها', icon: 'Mountain' },
  { id: 'world_records', name: 'رکوردهای شگفت‌انگیز گینس', icon: 'Award' },
  { id: 'general_know', name: 'دانستنی‌های عمومی و شگفتی‌ها', icon: 'Lightbulb' }
];

console.log(`Configured ${categories.length} categories.`);
