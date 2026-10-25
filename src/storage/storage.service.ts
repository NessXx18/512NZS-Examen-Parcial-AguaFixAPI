import { BadGatewayException, BadRequestException, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { envs } from '../config/envs';

export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

@Injectable()
export class StorageService implements OnModuleDestroy {
  // El SDK obtiene credenciales de variables de entorno o de un rol IAM.
  private readonly client = new S3Client({ region: envs.storage.region });

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException('Debes adjuntar una foto en el campo "photo"');
    }
    if (file.buffer.length > MAX_PHOTO_SIZE) {
      throw new BadRequestException('La foto no debe superar 5 MB');
    }
    const data = file.buffer;
    let extension: string | undefined;
    if (file.mimetype === 'image/jpeg' && data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
      extension = 'jpg';
    } else if (file.mimetype === 'image/png' && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      extension = 'png';
    } else if (file.mimetype === 'image/webp' && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') {
      extension = 'webp';
    }
    if (!extension) {
      throw new BadRequestException('Adjunta una foto JPEG, PNG o WebP válida');
    }
    if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\/?$/.test(folder)) {
      throw new BadRequestException('Carpeta de almacenamiento inválida');
    }

    const key = `${folder.replace(/\/$/, '')}/${randomUUID()}.${extension}`;
    try {
      await this.client.send(new PutObjectCommand({
        Bucket: envs.storage.bucket,
        Key: key,
        Body: data,
        ContentType: file.mimetype,
      }));
    } catch {
      throw new BadGatewayException('No se pudo subir la foto a S3; revisa la configuración del servicio');
    }
    return `https://${envs.storage.bucket}.s3.${envs.storage.region}.amazonaws.com/${key}`;
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }
}
