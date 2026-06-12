export const CATEGORIES = [
  'All',
  'Milk',
  'Curd',
  'Butter',
  'Ghee',
  'Paneer',
  'Others',
] as const;

export type ProductCategory = (typeof CATEGORIES)[number];
