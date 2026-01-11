export interface FileWithMeta {
  id: string;
  buffer: ArrayBuffer;
  name: string;
  type: string;
  size: number;
}

export interface FileData {
  data: string; // MIME type
  base64: string;
}
