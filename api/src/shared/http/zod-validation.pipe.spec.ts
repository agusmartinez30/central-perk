import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe.js';

const schema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().positive(),
});

const metadata = { type: 'body' as const };

describe('ZodValidationPipe', () => {
  it('returns the parsed value when input is valid', () => {
    const pipe = new ZodValidationPipe(schema);

    expect(pipe.transform({ name: 'Latte', price: '3.5' }, metadata)).toEqual({
      name: 'Latte',
      price: 3.5,
    });
  });

  it('throws a 400 with flattened issues when input is invalid', () => {
    const pipe = new ZodValidationPipe(schema);

    let error: unknown;
    try {
      pipe.transform({ name: '', price: -1 }, metadata);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(BadRequestException);
    const response = (error as BadRequestException).getResponse() as {
      statusCode: number;
      message: string;
      errors: { formErrors: string[]; fieldErrors: Record<string, string[]> };
    };
    expect(response.statusCode).toBe(400);
    expect(response.message).toBe('Validation failed');
    expect(Object.keys(response.errors.fieldErrors).sort()).toEqual(['name', 'price']);
    expect(response.errors.formErrors).toEqual([]);
  });
});
