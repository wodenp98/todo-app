import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Type for route parameters
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Schema for validating todo data
const todoUpdateSchema = z.object({
  title: z.string().optional(),
  completed: z.boolean().optional(),
  // Add other todo fields as needed
});

// Error handler utility
function handleError(error: unknown) {
  console.error("API Error:", error);
  const message =
    error instanceof Error ? error.message : "Unknown error occurred";
  return NextResponse.json(
    { error: message },
    { status: error instanceof z.ZodError ? 400 : 500 }
  );
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const todoId = parseInt(id);

    if (isNaN(todoId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const body = await req.json();
    const validatedData = todoUpdateSchema.parse(body);

    const todo = await prisma.todo.update({
      where: { id: todoId },
      data: validatedData,
    });

    return NextResponse.json(todo);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const todoId = parseInt(id);

    if (isNaN(todoId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    await prisma.todo.delete({
      where: { id: todoId },
    });

    return NextResponse.json(
      { message: "Todo deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
