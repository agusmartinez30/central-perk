import { BadRequestException, type ArgumentMetadata, type PipeTransform } from '@nestjs/common';
import { z } from 'zod';

/**
 * Validates and parses a request value with a Zod schema.
 * Usage: `@Body(new ZodValidationPipe(createProductSchema)) body: CreateProduct`.
 */
export class ZodValidationPipe<TSchema extends z.ZodType> implements PipeTransform<
  unknown,
  z.output<TSchema>
> {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): z.output<TSchema> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: z.flattenError(result.error),
      });
    }
    return result.data;
  }
}
