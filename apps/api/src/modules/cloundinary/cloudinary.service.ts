// cloudinary.service.ts
import { Injectable, Inject } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import { CLOUDINARY } from './cloudinary.constants';
import { Express } from 'express';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(@Inject(CLOUDINARY) private readonly cloud: typeof cloudinary) {}

  private bufferToStream(buffer: Buffer): Readable {
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    return readable;
  }

    async uploadFile(file: Express.Multer.File, folder = 'stayra/uploads'): Promise<UploadApiResponse> {
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    return this.cloud.uploader.upload(dataUri, { folder });
  }

  async deleteByPublicId(publicId: string): Promise<{ result: string }> {
    return new Promise((resolve, reject) => {
      this.cloud.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result as { result: string });
      });
    });
  }
}
