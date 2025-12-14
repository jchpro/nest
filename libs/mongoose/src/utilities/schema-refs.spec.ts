import { Schema } from 'mongoose';
import { extractSchemaRefs } from './schema-refs';

describe('extractSchemaRefs', () => {
  it('should extract direct ref from a path (Direct ref)', () => {
    const root = new Schema({
      owner: { type: Schema.Types.ObjectId, ref: 'User' },
    });

    const refs = extractSchemaRefs(root, 'Cat');

    expect(refs).toEqual([
      {
        schema: 'Cat',
        path: 'owner',
        ref: 'User',
      },
    ]);
  });

  it('should extract ref from array caster (Array of refs)', () => {
    const root = new Schema({
      friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    });

    const refs = extractSchemaRefs(root, 'User');

    expect(refs).toEqual([
      {
        schema: 'User',
        path: 'friends',
        ref: 'User',
      },
    ]);
  });

  it('should walk array of subdocuments and extract refs inside them (Array of subdocuments)', () => {
    const root = new Schema({
      toys: [
        {
          manufacturer: { type: Schema.Types.ObjectId, ref: 'Company' }, // should be found
          name: { type: String }, // ignored
        },
      ],
    });

    const refs = extractSchemaRefs(root, 'Cat');

    expect(refs).toEqual([
      {
        schema: 'Cat',
        path: 'toys.manufacturer',
        ref: 'Company',
      },
    ]);
  });

  it('should walk nested subdocument and extract refs inside it (Nested subdocument)', () => {
    const root = new Schema({
      profile: {
        vet: { type: Schema.Types.ObjectId, ref: 'Vet' }, // should be found
        nickname: { type: String }, // ignored
      },
    });

    const refs = extractSchemaRefs(root, 'Cat');

    expect(refs).toEqual([
      {
        schema: 'Cat',
        path: 'profile.vet',
        ref: 'Vet',
      },
    ]);
  });

  it('should extract refs from a mix of direct refs, arrays of refs, arrays of subdocuments, and nested subdocuments', () => {
    const root = new Schema({
      owner: { type: Schema.Types.ObjectId, ref: 'User' }, // direct
      tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }], // array of refs
      profile: {
        vet: { type: Schema.Types.ObjectId, ref: 'Vet' }, // nested subdoc
      },
      toys: [
        {
          manufacturer: { type: Schema.Types.ObjectId, ref: 'Company' }, // array of subdocs
          parts: [{ type: Schema.Types.ObjectId, ref: 'Part' }], // nested array of refs inside array of subdocs
        },
      ],
    });

    const refs = extractSchemaRefs(root, 'Cat');

    // Order is determined by mongoose's eachPath traversal; assert as a set.
    expect(refs).toHaveLength(5);
    expect(refs).toEqual(
      expect.arrayContaining([
        { schema: 'Cat', path: 'owner', ref: 'User' },
        { schema: 'Cat', path: 'tags', ref: 'Tag' },
        { schema: 'Cat', path: 'profile.vet', ref: 'Vet' },
        { schema: 'Cat', path: 'toys.manufacturer', ref: 'Company' },
        { schema: 'Cat', path: 'toys.parts', ref: 'Part' },
      ]),
    );
  });

  it('should return empty array when schema has no refs', () => {
    const root = new Schema({
      name: { type: String },
      age: { type: Number },
      nested: {
        foo: { type: String },
      },
      arr: [{ value: { type: Number } }],
    });

    const refs = extractSchemaRefs(root, 'NoRefs');

    expect(refs).toEqual([]);
  });
});
