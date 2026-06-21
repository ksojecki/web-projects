import { z } from 'zod';

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const registerSchema = z.object({
  name: z.string().min(1, 'register.nameRequired'),
  surname: z.string().min(1, 'register.surnameRequired'),
  email: z
    .string()
    .min(1, 'register.emailRequired')
    .pipe(z.email('register.emailInvalid')),
  password: z.string().min(8, 'register.passwordMinLength'),
});
