export const UNITS = ['litre', 'ml', 'kg', 'g', 'pack', 'piece', 'cup'] as const;

export type ProductUnit = (typeof UNITS)[number];
