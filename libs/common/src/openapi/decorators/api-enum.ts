import { ApiProperty } from '../internal/swagger';
import type { ApiPropertyOptions } from '@nestjs/swagger';

type EnumType = Record<string, any>;

const map = new Map<EnumType, string>();
const lookup = new Set<string>();

/**
 * Registers reusable enum, which means passing it in {@link ApiEnum} and {@link ApiEnumOptional} inside DTO classes
 * will result in OpenAPI document containing reference to the same entity, instead of repeating the definition.
 */
export function reusableApiEnum<T extends EnumType>(
  /**
   * Enum object
   */
  enumeration: T,

  /**
   * Name as which the enum will be referenced in the OpenAPI document.
   */
  as: string
): T {
  if (lookup.has(as)) {
    throw new Error(`Other enum already registered as "${as}"`);
  }
  map.set(enumeration, as);
  lookup.add(as);
  return enumeration;
}

/**
 * Marks the required API property with type of reusable enum registered with {@link reusableApiEnum}.
 */
export function ApiEnum(enumeration: EnumType,
                        options?: Omit<ApiPropertyOptions, 'enum' | 'enumName' | 'required'>): PropertyDecorator {
  return EnumDecorator(enumeration, false, options);
}

/**
 * Marks the optional API property with type of reusable enum registered with {@link reusableApiEnum}.
 */
export function ApiEnumOptional(enumeration: EnumType,
                                options?: Omit<ApiPropertyOptions, 'enum' | 'enumName' | 'required'>): PropertyDecorator {
  return EnumDecorator(enumeration, true, options);
}

function EnumDecorator(enumeration: EnumType,
                       optional: boolean,
                       options?: Omit<ApiPropertyOptions, 'enum' | 'enumName' | 'required'>) {
  const name = map.get(enumeration);
  if (!name) {
    throw new Error(`Enum with name "${name}" not registered`);
  }
  return ApiProperty({
    enum: enumeration,
    enumName: name,
    required: !optional,
    ...options
  });
}
