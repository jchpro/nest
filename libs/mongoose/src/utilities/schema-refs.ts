import mongoose, { Schema } from "mongoose";

/**
 * Extracts all external schema references from the given schema.
 */
export function extractSchemaRefs(
  rootSchema: Schema,
  schemaName: string
): SchemaRefInfo[] {
  const refs: SchemaRefInfo[] = [];

  function walk(prefix: string, schemaObj: Schema) {
    schemaObj.eachPath((pathname, schematype: any) => {
      const fullPath = prefix ? `${prefix}.${pathname}` : pathname;

      // Direct ref
      if (schematype.options?.ref) {
        refs.push({
          schema: schemaName,
          path: fullPath,
          ref: schematype.options.ref
        });
        return;
      }

      // Array – caster may be ref or subdocument
      if (schematype instanceof mongoose.Schema.Types.Array) {
        const caster = schematype.caster;

        // Array of refs
        if (caster?.options?.ref) {
          refs.push({
            schema: schemaName,
            path: fullPath,
            ref: caster.options.ref
          });
          return;
        }

        // Array of subdocuments
        if (caster?.schema) {
          walk(fullPath, caster.schema);
          return;
        }
      }

      // Nested subdocument
      if (schematype.schema) {
        walk(fullPath, schematype.schema);
      }
    });
  }

  walk("", rootSchema);
  return refs;
}

/**
 * Schema reference information.
 */
export interface SchemaRefInfo {

  /**
   * Name of the schema owning external references.
   */
  readonly schema: string;

  /**
   * Path to the referenced schema.
   */
  readonly path: string;

  /**
   * Name of the referenced schema.
   */
  readonly ref: string;
}
