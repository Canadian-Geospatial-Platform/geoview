import { AbstractGVVector } from './abstract-gv-vector';

/**
 * Manages an OGC-Feature layer.
 *
 * @exports
 * @class GVOGCFeature
 */
export class GVOGCFeature extends AbstractGVVector {
  /**
   * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
   * @param {string} fieldName - The field name for which we want to get the type.
   * @returns {'string' | 'date' | 'number'} The type of the field.
   */
  protected override getFieldType(fieldName: string): 'string' | 'date' | 'number' {
    const fieldDefinitions = this.getLayerConfig().getMetadata()!;
    const fieldEntryType = (fieldDefinitions[fieldName].type as string).split(':').slice(-1)[0] as string;
    if (fieldEntryType === 'date') return 'date';
    if (['int', 'number'].includes(fieldEntryType)) return 'number';
    return 'string';
  }
}
