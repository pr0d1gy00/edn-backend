import { randomUUID } from 'crypto';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Media, MediaEntityType } from '@prisma/client';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

@Injectable()
export class MediaService {
  private s3: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private readonly prisma: PrismaService) {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID ?? '';
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? '',
      },
      forcePathStyle: true,
    });
    this.bucket = process.env.CLOUDFLARE_R2_BUCKET ?? 'edn';
    this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL ?? '';
  }

  async upload(
    file: Express.Multer.File,
    entityType: string,
    entityId: string,
    isPrimary: boolean = false,
    sortOrder: number = 0,
  ): Promise<Media> {
    this.validateFile(file);

    const mediaEntityType = entityType as MediaEntityType;
    if (!Object.values(MediaEntityType).includes(mediaEntityType)) {
      throw new BadRequestException(
        `Invalid entityType: ${entityType}. Must be one of: ${Object.values(MediaEntityType).join(', ')}`,
      );
    }

    const ext = this.getExtension(file.originalname);
    const key = `${entityType}/${entityId}/${randomUUID()}${ext}`;

    try {
      const upload = new Upload({
        client: this.s3,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        },
      });

      await upload.done();
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload file to S3: ${(error as Error).message}`,
      );
    }

    const url = `${this.publicUrl}/${key}`;

    return this.prisma.media.create({
      data: {
        entityType: mediaEntityType,
        entityId,
        url,
        key,
        isPrimary,
        sortOrder,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const media = await this.prisma.media.findUnique({ where: { id } });

    if (!media) {
      throw new NotFoundException(`Media with ID "${id}" not found`);
    }

    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: media.key,
        }),
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete file from S3: ${(error as Error).message}`,
      );
    }

    await this.prisma.media.delete({ where: { id } });
  }

  async findByEntity(entityType: string, entityId: string): Promise<Media[]> {
    const mediaEntityType = entityType as MediaEntityType;
    if (!Object.values(MediaEntityType).includes(mediaEntityType)) {
      throw new BadRequestException(
        `Invalid entityType: ${entityType}. Must be one of: ${Object.values(MediaEntityType).join(', ')}`,
      );
    }

    return this.prisma.media.findMany({
      where: {
        entityType: mediaEntityType,
        entityId,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findAllByEntityIds(
    entityType: string,
    entityIds: string[],
  ): Promise<Media[]> {
    if (entityIds.length === 0) return [];

    const mediaEntityType = entityType as MediaEntityType;
    if (!Object.values(MediaEntityType).includes(mediaEntityType)) {
      throw new BadRequestException(
        `Invalid entityType: ${entityType}. Must be one of: ${Object.values(MediaEntityType).join(', ')}`,
      );
    }

    return this.prisma.media.findMany({
      where: {
        entityType: mediaEntityType,
        entityId: { in: entityIds },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const ext = this.getExtension(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `Invalid file extension: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid MIME type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }
  }

  private getExtension(filename: string): string {
    const dotIndex = filename.lastIndexOf('.');
    if (dotIndex === -1) return '';
    return filename.slice(dotIndex);
  }
}
