import { Injectable, Logger } from "@nestjs/common";
import { Schema } from "mongoose";
import { extractSchemaRefs, SchemaRefInfo } from '../utilities/schema-refs';

/**
 * Helper for registering schema references.
 * Provided by {@link SingleConnectionSchemaRefsModule}.
 */
@Injectable()
export class SchemaReferencesService {

  private readonly logger = new Logger(SchemaReferencesService.name);

  // Schema → [{ path, ref }]
  private schemaToRefs = new Map<string, SchemaRefEntry[]>();

  // Ref → [{ path, ref, schema }]
  private refToSchemas = new Map<string, SchemaRefInfo[]>();

  /**
   * Registers references by inspecting the schema using extractSchemaRefs().
   */
  register(rootSchema: Schema, schemaName: string): void {
    const refs: SchemaRefInfo[] = extractSchemaRefs(rootSchema, schemaName);
    if (!refs.length) {
      return;
    }
    this.logger.log(`Registered ${refs.length} reference(s) to other schemas from "${schemaName}"`);

    for (const { schema, path, ref } of refs) {
      // schema → refs
      if (!this.schemaToRefs.has(schema)) {
        this.schemaToRefs.set(schema, []);
      }
      this.schemaToRefs.get(schema)!.push({ path, ref });

      // ref → schemas
      if (!this.refToSchemas.has(ref)) {
        this.refToSchemas.set(ref, []);
      }
      this.refToSchemas.get(ref)!.push({ schema, path, ref });
    }
  }

  /**
   * Get all { path, ref } entries for a given schema.
   */
  getRefsForSchema(schema: string): SchemaRefEntry[] {
    return this.schemaToRefs.get(schema) ?? [];
  }

  /**
   * Get all entries for schemas referencing a target schema.
   * Each entry contains: { schema, path, ref }.
   */
  getSchemasReferencing(ref: string): SchemaRefInfo[] {
    return this.refToSchemas.get(ref) ?? [];
  }
}

/**
 * Schema reference entry.
 */
export interface SchemaRefEntry {
  /**
   * Path to the referenced schema.
   */
  readonly path: string;

  /**
   * Name of the referenced schema.
   */
  readonly ref: string;
}
