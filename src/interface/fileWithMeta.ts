export default interface FileWithMeta {
  id: string;
  buffer: ArrayBuffer | string;
  name: string;
  type: string;
  size: number;
}
