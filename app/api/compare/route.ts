import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { userAnswer, systemAnswer } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Eres un evaluador experto en respuestas en español. 
          Tu tarea es comparar la respuesta de un usuario con la respuesta correcta y calcular una similitud en un rango de 0 a 1.
          
          ⚠️ **Criterios de Evaluación**:
          - **Score 1.0** → La respuesta del usuario es **idéntica o tiene variaciones menores** como artículos ("el", "la"), cambios de orden o sinónimos exactos.
          - **Score 0.9 - 0.8** → Respuesta **casi correcta**, pero con ligeras diferencias en estructura o palabras no esenciales.
          - **Score 0.7 - 0.5** → Respuesta **parcialmente correcta**, falta información clave o es imprecisa.
          - **Score < 0.5** → Respuesta **incorrecta o sin relación con la pregunta**.

          🚨 **Ejemplos para evaluar**:
          - **Pregunta:** ¿Contra qué equipo hizo su primer gol?
            - ✅ Usuario: "Albacete" → **1.0**
            - ✅ Usuario: "Contra el Albacete" → **1.0**
            - ⚠️ Usuario: "Albacete CF" → **0.9**
            - ❌ Usuario: "Contra el Real Madrid" → **0.1**

          Devuelve únicamente un número decimal entre 0 y 1 sin explicaciones.
          `,
        },
        {
          role: "user",
          content: `Pregunta: ¿Cuál es la respuesta correcta?
          Respuesta correcta: "${systemAnswer}"
          Respuesta del usuario: "${userAnswer}"

          Devuelve solo un número entre 0 y 1 sin texto adicional.`,
        },
      ],
      max_tokens: 5, // Solo queremos un número
      temperature: 0, // Consistencia en la evaluación
    });

    let similarityScore;
    if (response.choices[0].message.content) {
      similarityScore = parseFloat(response.choices[0].message.content.trim());
    }

    return NextResponse.json({ similarityScore });
  } catch (error) {
    console.error("Error al comparar respuestas:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
