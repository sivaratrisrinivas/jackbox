import { buildReadme } from "@/lib/generation/build-readme";
import type { DemoPackage } from "@/lib/generation/demo-package";

const encoder = new TextEncoder();
const CRC_TABLE = new Uint32Array(256).map((_, tableIndex) => {
  let value = tableIndex;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

interface ZipEntryInput {
  path: string;
  content: string;
  mediaType?: string;
}

interface PreparedZipEntry extends ZipEntryInput {
  nameBytes: Uint8Array;
  contentBytes: Uint8Array;
  crc32: number;
  localHeaderOffset: number;
}

export interface DemoExport {
  archive: Uint8Array;
  filename: string;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(output: number[], value: number) {
  output.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(output: number[], value: number) {
  output.push(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  );
}

function writeBytes(output: number[], bytes: Uint8Array) {
  for (const byte of bytes) {
    output.push(byte);
  }
}

function assertExportPath(path: string) {
  if (
    path.startsWith("/") ||
    path.includes("..") ||
    path.includes("\\") ||
    /[\u0000-\u001f]/.test(path)
  ) {
    throw new Error(`Export file path is not allowed: ${path}`);
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function getTemplateFileContent(file: DemoPackage["files"][number]) {
  if (typeof file.content === "string") {
    return file.content;
  }

  return `${file.description}\n`;
}

function buildEntries(demoPackage: DemoPackage): ZipEntryInput[] {
  const metadata = JSON.stringify(demoPackage, null, 2);
  const templateEntries = demoPackage.files.map((file) => {
    assertExportPath(file.path);

    return {
      path: file.path,
      content: getTemplateFileContent(file),
      mediaType: file.mediaType,
    };
  });

  return [
    {
      path: "README.md",
      content: buildReadme(demoPackage),
      mediaType: "text/markdown",
    },
    {
      path: "metadata/demo-package.json",
      content: metadata,
      mediaType: "application/json",
    },
    ...templateEntries,
  ];
}

export function buildDemoExport(demoPackage: DemoPackage): DemoExport {
  const output: number[] = [];
  const centralDirectory: number[] = [];
  const entries: PreparedZipEntry[] = buildEntries(demoPackage).map((entry) => {
    const contentBytes = encoder.encode(entry.content);

    return {
      ...entry,
      nameBytes: encoder.encode(entry.path),
      contentBytes,
      crc32: crc32(contentBytes),
      localHeaderOffset: 0,
    };
  });

  for (const entry of entries) {
    entry.localHeaderOffset = output.length;

    writeUint32(output, 0x04034b50);
    writeUint16(output, 20);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint32(output, entry.crc32);
    writeUint32(output, entry.contentBytes.length);
    writeUint32(output, entry.contentBytes.length);
    writeUint16(output, entry.nameBytes.length);
    writeUint16(output, 0);
    writeBytes(output, entry.nameBytes);
    writeBytes(output, entry.contentBytes);
  }

  const centralDirectoryOffset = output.length;

  for (const entry of entries) {
    writeUint32(centralDirectory, 0x02014b50);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 20);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint32(centralDirectory, entry.crc32);
    writeUint32(centralDirectory, entry.contentBytes.length);
    writeUint32(centralDirectory, entry.contentBytes.length);
    writeUint16(centralDirectory, entry.nameBytes.length);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint16(centralDirectory, 0);
    writeUint32(centralDirectory, 0);
    writeUint32(centralDirectory, entry.localHeaderOffset);
    writeBytes(centralDirectory, entry.nameBytes);
  }

  writeBytes(output, Uint8Array.from(centralDirectory));
  writeUint32(output, 0x06054b50);
  writeUint16(output, 0);
  writeUint16(output, 0);
  writeUint16(output, entries.length);
  writeUint16(output, entries.length);
  writeUint32(output, centralDirectory.length);
  writeUint32(output, centralDirectoryOffset);
  writeUint16(output, 0);

  return {
    archive: Uint8Array.from(output),
    filename: `jackbox-${demoPackage.templateId}-${slugify(demoPackage.input.companyUrl)}.zip`,
  };
}
