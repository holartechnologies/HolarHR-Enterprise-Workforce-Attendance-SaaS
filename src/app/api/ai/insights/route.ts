import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, serverError } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";
import { hasFeature } from "@/lib/plans";
import OpenAI from "openai";
import { startOfWeek, endOfWeek, subDays } from "date-fns";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

async function generateAISummary(prompt: string): Promise<string> {
  if (!openai) return "AI features require an OpenAI API key. Set OPENAI_API_KEY in your .env file.";
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an HR analytics assistant. Provide concise, data-driven insights about workforce attendance. Keep responses under 200 words.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
    });
    return response.choices[0]?.message?.content || "No insights available.";
  } catch {
    return "AI service unavailable. Please check your API key and try again.";
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    if (!hasPermission(user.role, "ai:access")) return unauthorized();

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: { plan: true },
    });

    if (!company?.plan || !hasFeature(company.plan.name, "aiFeatures")) {
      return ok({
        available: false,
        message: "AI features are available on the Enterprise plan. Upgrade to access AI-powered insights.",
        insights: [],
      });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "daily";

    const today = new Date();
    let startDate: Date;
    let periodLabel: string;

    if (type === "weekly") {
      startDate = startOfWeek(today, { weekStartsOn: 1 });
      periodLabel = "this week";
    } else if (type === "monthly") {
      startDate = subDays(today, 30);
      periodLabel = "the last 30 days";
    } else {
      startDate = subDays(today, 7);
      periodLabel = "the last 7 days";
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        companyId: user.companyId,
        date: { gte: startDate, lte: today },
      },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });

    const totalPresent = attendance.filter((a) => a.status === "PRESENT").length;
    const totalLate = attendance.filter((a) => a.status === "LATE").length;
    const totalAbsent = attendance.filter((a) => a.status === "ABSENT").length;
    const avgHours = attendance.length > 0
      ? attendance.reduce((s, a) => s + Number(a.totalHours || 0), 0) / attendance.length
      : 0;

    const mostLateEmployees = Object.entries(
      attendance
        .filter((a) => a.status === "LATE")
        .reduce((acc: Record<string, number>, a) => {
          const key = `${a.employee.firstName} ${a.employee.lastName}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const prompt = `Analyze this workforce attendance data for ${periodLabel}:
- Total records: ${attendance.length}
- Present: ${totalPresent}
- Late: ${totalLate}
- Absent: ${totalAbsent}
- Average hours: ${avgHours.toFixed(1)}
- Most frequently late employees: ${mostLateEmployees.map(([n, c]) => `${n} (${c}x)`).join(", ") || "None"}

Provide key insights, potential issues, and recommendations.`;

    const aiResponse = await generateAISummary(prompt);

    const insights = [
      {
        type: "insight" as const,
        title: `Attendance Overview (${periodLabel})`,
        description: `${totalPresent} present, ${totalLate} late, ${totalAbsent} absent out of ${attendance.length} total records. Average hours: ${avgHours.toFixed(1)}h.`,
      },
      ...(mostLateEmployees.length > 0
        ? [
            {
              type: "alert" as const,
              title: "Frequent Latecomers",
              description: mostLateEmployees.map(([n, c]) => `${n} (${c} late days)`).join(". "),
              severity: "medium" as const,
            },
          ]
        : []),
      {
        type: "recommendation" as const,
        title: "AI Analysis",
        description: aiResponse,
      },
    ];

    return ok({ available: true, insights });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    if (!hasPermission(user.role, "ai:access")) return unauthorized();

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: { plan: true },
    });

    if (!company?.plan || !hasFeature(company.plan.name, "aiFeatures")) {
      return ok({ response: "AI features require Enterprise plan." });
    }

    const { message } = await req.json();
    if (!message) return ok({ response: "Please provide a question." });

    const response = await generateAISummary(
      `The user asks: "${message}". Provide helpful HR and workforce management advice based on best practices.`
    );

    return ok({ response });
  } catch (error) {
    return serverError(error);
  }
}
