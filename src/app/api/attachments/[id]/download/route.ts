import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) {
      return new NextResponse("Attachment not found", { status: 404 });
    }

    const buffer = await readFile(attachment.path);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${attachment.filename}"`,
        "Content-Length": String(attachment.size),
      },
    });
  } catch (error) {
    console.error("Failed to download attachment:", error);
    return new NextResponse("Failed to download attachment", { status: 500 });
  }
}
