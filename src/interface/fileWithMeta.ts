export default interface FileWithMeta {
  id: string;
  buffer: ArrayBuffer;
  name: string;
  type: string;
  size: number;
}
