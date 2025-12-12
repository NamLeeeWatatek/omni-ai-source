import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';

export type FileSchemaDocument = HydratedDocument<FileSchemaClass>;

@Schema({
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class FileSchemaClass extends EntityDocumentHelper {
  @Prop()
  path: string;

  @Prop({ default: 'images' })
  bucket: string;
}

export const FileSchema = SchemaFactory.createForClass(FileSchemaClass);
