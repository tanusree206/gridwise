import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      monthlyKwh,
      monthlyBill,
      people,
      appliances,
    } = body;

    if (!monthlyKwh || !monthlyBill || !people) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const prompt = `
You are GridWise, an electricity-saving assistant.

Create a personalized energy-saving plan for this household.

Household information:
- Monthly electricity usage: ${monthlyKwh} kWh
- Monthly electricity bill: ${monthlyBill} BDT
- Number of people: ${people}
- Air conditioner: ${appliances?.ac}
- Water heater: ${appliances?.waterHeater}
- Washing machine: ${appliances?.washingMachine}
- Refrigerator: ${appliances?.refrigerator}

Give practical advice that this household can actually follow.

Include:
1. A short assessment of their electricity usage.
2. The 3 most important things they should do.
3. Ways they could reduce electricity use.
4. Simple daily habits.
5. A short conclusion.

Keep the answer concise and easy to understand.
Do not invent exact savings amounts unless they can reasonably be estimated from the information provided.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        { error: `Gemini API error: ${errorText}` },
        { status: response.status },
      );
    }

    const data = await response.json();

    const plan =
      data.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || "")
        .join("") || "No plan was generated.";

    return NextResponse.json({ plan });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Something went wrong while generating the plan." },
      { status: 500 },
    );
  }
}