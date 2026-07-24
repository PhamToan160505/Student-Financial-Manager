/**
 * Shared dictionary for Category Icon to Emoji mapping.
 * Prevents "Ă" or broken characters from appearing across charts, modals, lists, and budget cards.
 */
export const ICON_EMOJI = {
  Tag: '🏷️',
  UtensilsCrossed: '🍽️',
  Home: '🏠',
  BookOpen: '📚',
  Bus: '🚌',
  Gamepad2: '🎮',
  ShoppingBag: '🛍️',
  Heart: '💊',
  Users: '👨‍👩‍👧',
  Briefcase: '💼',
  GraduationCap: '🎓',
  Gift: '🎁',
  PiggyBank: '🐷',
  Laptop: '💻',
  Plane: '✈️',
  Phone: '📱',
  Camera: '📷',
  Umbrella: '☂️',
  MoreHorizontal: '⋯',
  Coffee: '☕',
  Car: '🚗',
  Music: '🎵',
  // Fallbacks if backend stores vietnamese names or abbreviations
  AnUong: '🍽️',
  DiChuyen: '🚌',
  NhaO: '🏠',
  HocTap: '📚',
  GiaiTri: '🎮',
  MuaSam: '🛍️',
  SucKhoe: '💊',
  GiaDinh: '👨‍👩‍👧',
  CongViec: '💼',
  Khac: '🏷️'
};

/**
 * Get emoji for a category icon name or fallback cleanly.
 * @param {string} iconName 
 * @returns {string} Emoji string
 */
export function getCategoryEmoji(iconName) {
  if (!iconName) return '🏷️';
  return ICON_EMOJI[iconName] || '🏷️';
}
