import { z } from 'zod';

export const FinnhubQuoteSchema = z.object({
  c: z.number().positive('Current price must be positive'),
  d: z.number().nullable().optional(),
  dp: z.number().nullable().optional(),
  h: z.number().positive().optional(),
  l: z.number().positive().optional(),
  o: z.number().positive().optional(),
  pc: z.number().positive().optional(),
  t: z.number().positive('Timestamp must be positive'),
  v: z.number().nonnegative().optional(),
});

export type FinnhubQuote = z.infer<typeof FinnhubQuoteSchema>;
