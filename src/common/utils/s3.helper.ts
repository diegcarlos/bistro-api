import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

export const s3Client = new S3Client({
  endpoint: process.env.S3,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_AKEY,
    secretAccessKey: process.env.S3_SKEY,
  },
  forcePathStyle: true,
});

const bucketName = process.env.S3_BUCKET;

export const s3Helper = {
  get: async (Key: string, sub = '', time = 3600) => {
    const keyFolder = `${sub.length > 0 ? sub + '/' : ''}${Key}`;

    const indexObj = new GetObjectCommand({
      Bucket: bucketName,
      Key: keyFolder,
    });

    const signedUrl = await getSignedUrl(s3Client, indexObj, {
      expiresIn: time,
    });

    return {
      uid: Key,
      name: Key,
      status: 'done',
      url: signedUrl,
    };
  },
  post: async (file: File, sub = '') => {
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const name = `${uuid()}.${file?.name.split('.').pop()}`;
      const fileName = `${sub.length > 0 ? sub + '/' : ''}${name}`;

      const putObj = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      });

      await s3Client.send(putObj);
      return {
        fileName,
        url: `${process.env.S3}/${bucketName}/${fileName}`,
      };
    }
  },
  del: async (Key: string) => {
    if (Key) {
      const deleteObj = new DeleteObjectCommand({
        Bucket: bucketName,
        Key,
      });
      const res = await s3Client.send(deleteObj);

      return res;
    }
    return null;
  },
};
