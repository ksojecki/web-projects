import { z } from 'zod';

export type PasswordFormValues = z.infer<typeof passwordSchema>;

export const passwordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(8, 'password.newMinLength'),
    confirmPassword: z.string().min(1, 'password.confirmRequired'),
  })
  .superRefine((value, context) => {
    if (
      value.currentPassword.length === 0 &&
      value.confirmPassword.length === 0 &&
      value.newPassword.length === 0
    ) {
      return;
    }

    if (value.newPassword !== value.confirmPassword) {
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'password.confirmMismatch',
      });
    }
  });
