import { z } from 'zod';

export type LoginFormValues = z.infer<typeof loginSchema>;

export const loginSchema = z.object({
  email: z.string().min(1, 'emailRequired').pipe(z.email('emailInvalid')),
  password: z.string().min(1, 'passwordRequired'),
});
