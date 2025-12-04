import {
  HttpStatus,
  Injectable,
  PayloadTooLargeException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { FileRepository } from '../../persistence/file.repository';

import { FileUploadDto } from './dto/file.dto';
import {
  PutObjectCommand,
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import { FileType } from '../../../domain/file';
import { AllConfigType } from '../../../../config/config.type';

@Injectable()
export class FilesS3PresignedService {
  private s3: S3Client;
  private readonly logger = new Logger(FilesS3PresignedService.name);
  private bucketsChecked = new Set<string>();

  constructor(
    private readonly fileRepository: FileRepository,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    const minioEndpoint = configService.get('file.minioEndpoint', {
      infer: true,
    });

    this.s3 = new S3Client({
      region: configService.get('file.awsS3Region', { infer: true }),
      credentials: {
        accessKeyId: configService.getOrThrow('file.accessKeyId', {
          infer: true,
        }),
        secretAccessKey: configService.getOrThrow('file.secretAccessKey', {
          infer: true,
        }),
      },
      ...(minioEndpoint && {
        endpoint: minioEndpoint,
        forcePathStyle: true,
      }),
    });
  }

  private async ensureBucketExists(bucket: string): Promise<void> {
    if (this.bucketsChecked.has(bucket)) {
      return;
    }

    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: bucket }));
      this.logger.log(`✅ Bucket '${bucket}' exists`);
      this.bucketsChecked.add(bucket);
    } catch (error) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        this.logger.log(`📦 Creating bucket '${bucket}'...`);

        try {
          await this.s3.send(new CreateBucketCommand({ Bucket: bucket }));

          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucket}/*`],
              },
            ],
          };

          await this.s3.send(
            new PutBucketPolicyCommand({
              Bucket: bucket,
              Policy: JSON.stringify(policy),
            }),
          );

          this.logger.log(`✅ Bucket '${bucket}' created successfully`);
          this.bucketsChecked.add(bucket);
        } catch (createError) {
          this.logger.error(
            `❌ Failed to create bucket '${bucket}': ${createError.message}`,
          );
          throw createError;
        }
      } else {
        this.logger.error(
          `❌ Error checking bucket '${bucket}': ${error.message}`,
        );
        throw error;
      }
    }
  }

  async create(
    file: FileUploadDto,
  ): Promise<{ file: FileType; uploadSignedUrl: string }> {
    if (!file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: 'selectFile',
        },
      });
    }

    const isImage = file.fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
    const isDocument = file.fileName.match(
      /\.(pdf|doc|docx|txt|csv|xls|xlsx)$/i,
    );

    if (!isImage && !isDocument) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: `cantUploadFileType`,
        },
      });
    }

    if (
      file.fileSize >
      (this.configService.get('file.maxFileSize', {
        infer: true,
      }) || 0)
    ) {
      throw new PayloadTooLargeException({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        error: 'Payload Too Large',
        message: 'File too large',
      });
    }

    const key = `${randomStringGenerator()}.${file.fileName
      .split('.')
      .pop()
      ?.toLowerCase()}`;

    const bucket =
      file.bucket ||
      this.configService.getOrThrow('file.awsDefaultS3Bucket', {
        infer: true,
      });

    await this.ensureBucketExists(bucket);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentLength: file.fileSize,
    });
    const signedUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    const data = await this.fileRepository.create({
      path: key,
    });

    return {
      file: data,
      uploadSignedUrl: signedUrl,
    };
  }

  async generateDownloadUrl(
    filePath: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const bucket = this.configService.getOrThrow('file.awsDefaultS3Bucket', {
      infer: true,
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filePath,
    });

    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const downloadCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: filePath,
    });

    const signedUrl = await getSignedUrl(this.s3, downloadCommand, {
      expiresIn,
    });

    return signedUrl;
  }
}
