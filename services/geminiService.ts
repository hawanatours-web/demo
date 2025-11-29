
import { GoogleGenAI } from "@google/genai";

const getClient = () => {
    const key = process.env.API_KEY;
    if (!key) {
        console.error("API Key missing");
        return null;
    }
    return new GoogleGenAI({ apiKey: key });
};

export const analyzeFinancialQuery = async (query: string, contextData: string): Promise<string> => {
  try {
    const ai = getClient();
    if (!ai) return "عذراً، مفتاح الربط مع الذكاء الاصطناعي مفقود.";

    const model = 'gemini-2.5-flash';
    const systemInstruction = `
      أنت مساعد مالي ذكي ومتخصص في أنظمة المحاسبة لشركات السياحة.
      تتحدث اللغة العربية بطلاقة ومهنية.
      
      دورك هو مساعدة المستخدم في فهم البيانات المالية، تقديم نصائح لتحسين الربحية، أو الإجابة عن أسئلة محاسبية.
      استخدم البيانات السياقية المقدمة (JSON) للإجابة بدقة عن وضع الشركة الحالي.
      
      إذا كان السؤال خارج نطاق البيانات المالية أو السياحة، اعتذر بلطف ووجه المستخدم للأسئلة ذات الصلة.
      اجعل إجاباتك موجزة ومفيدة.
    `;

    const prompt = `
      سياق البيانات المالية الحالية (JSON):
      ${contextData}

      سؤال المستخدم:
      ${query}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 } 
      },
    });

    return response.text || "عذراً، لم أتمكن من تحليل البيانات في الوقت الحالي.";
  } catch (error: any) {
    console.error("Gemini API Connection Error:", error);
    return "حدث خطأ أثناء الاتصال بالمساعد الذكي.";
  }
};

// --- NEW FUNCTION: Flight Details Fetcher ---
export const getFlightDetails = async (flightNo: string, date: string): Promise<any> => {
    try {
        const ai = getClient();
        if (!ai) return null;

        // Using Pro model for better search reasoning + grounding
        const model = 'gemini-2.5-flash'; 
        
        const prompt = `
            Find the flight schedule/status for flight number "${flightNo}" on date "${date}".
            
            I need the standard scheduled departure and arrival times, the airline name, and the route (Origin Airport Code - Destination Airport Code).
            
            Return ONLY a raw JSON object (no markdown, no explanation) with this exact structure:
            {
                "airline": "String (e.g. Royal Jordanian)",
                "departureTime": "HH:MM (24-hour format)",
                "arrivalTime": "HH:MM (24-hour format)",
                "route": "XXX-YYY (e.g. AMM-DXB)",
                "aircraft": "String (optional, e.g. Airbus A320)"
            }
            
            If you cannot find specific details, try to infer the standard schedule for this flight number.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }], // Enable Grounding
                // responseMimeType: "application/json" // Removed: Cannot use responseMimeType with tools
            }
        });

        const text = response.text;
        if (!text) return null;

        try {
            // Clean up json markdown if present
            let cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            
            // Extract JSON object if there's extra text
            const firstBrace = cleanJson.indexOf('{');
            const lastBrace = cleanJson.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
            }

            return JSON.parse(cleanJson);
        } catch (e) {
            console.error("Failed to parse flight JSON", e);
            console.log("Raw response text:", text);
            return null;
        }

    } catch (error) {
        console.error("Flight Fetch Error:", error);
        return null;
    }
};
