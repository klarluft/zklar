import { z } from "zod";

export const ProofInputSchema = z.object({
  a0: z.string(),
  a1: z.string(),
  b00: z.string(),
  b01: z.string(),
  b10: z.string(),
  b11: z.string(),
  c0: z.string(),
  c1: z.string(),
});

export type ProofInput = z.infer<typeof ProofInputSchema>;
