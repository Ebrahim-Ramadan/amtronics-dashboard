declare module 'storj-nodejs' {
  export namespace uplink {
    export class Access {
      static parse(accessKey: string): Promise<Access>
    }

    export class Project {
      ensureBucket(bucketName: string): Promise<Bucket>
      createBucket(bucketName: string): Promise<Bucket>
      uploadObject(bucketName: string, fileName: string, options?: { expires?: Date }): Promise<Upload>
    }

    export class Bucket {
      name: string
    }

    export class Upload {
      write(data: Buffer): Promise<void>
      commit(): Promise<void>
    }
  }
}
