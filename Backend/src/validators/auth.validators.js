import { z } from 'zod';

const email = z.string().trim().toLowerCase().max(255).email();

export const registerBody = z
  .object({
    username: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(/^[A-Za-z0-9_.]+$/, 'Solo letras, números, punto y guion bajo'),
    email,
    password: z
      .string()
      .min(8)
      // bcrypt ignora lo que pase de 72 bytes
      .max(72)
      .regex(/[A-Za-z]/, 'Tiene que tener al menos una letra')
      .regex(/[0-9]/, 'Tiene que tener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

export const loginBody = z.object({
  email,
  password: z.string().min(1).max(72),
});
