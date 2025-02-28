"use client";

import React, { useEffect, useRef, useState } from "react";
import "regenerator-runtime/runtime";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const interviewQuestions = [
  {
    id: 1,
    question: "¿Dónde nació Messi?",
    systemAnswer: "Rosario",
  },
  {
    id: 2,
    question: "¿A que edad se fue a vivir a Barcelona?",
    systemAnswer: "A los 13 años.",
  },
  {
    id: 3,
    question: "¿Contra que equipo hizo su primer gol?",
    systemAnswer: "Albacete.",
  },
];

const VirtualInterview = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [listening, setListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState<string | null>(null);
  const {
    transcript,
    resetTranscript,
    // listening: isListening,
  } = useSpeechRecognition();
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<
    {
      pregunta: string;
      userAnswer: string;
      systemAnswer: string;
      score: number;
    }[]
  >([]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error al acceder a la cámara:", error);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  const startListening = () => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      alert("Tu navegador no soporta reconocimiento de voz.");
      return;
    }

    resetTranscript();
    setFinalTranscript(null);
    SpeechRecognition.startListening({ continuous: true, language: "es-ES" });
    setListening(true);

    // Detener automáticamente después de 20 segundos
    stopTimeoutRef.current = setTimeout(() => {
      stopListening();
    }, 20000);
  };

  const stopListening = async () => {
    SpeechRecognition.stopListening();
    setListening(false);

    setTimeout(async () => {
      const userAnswer = transcript || "";
      const systemAnswer =
        interviewQuestions[currentQuestionIndex].systemAnswer;
      const score = await compareAnswers(userAnswer, systemAnswer);

      setFinalTranscript(userAnswer);
      setResponses((prevResponses) => [
        ...prevResponses,
        {
          pregunta: interviewQuestions[currentQuestionIndex].question,
          userAnswer,
          systemAnswer,
          score,
        },
      ]);
    }, 1000);

    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setFinalTranscript(null);
      resetTranscript();
    } else {
      console.log("Entrevista finalizada, respuestas:", responses);
    }
  };

  // 🔹 Función para comparar respuestas usando OpenAI
  const compareAnswers = async (
    userAnswer: string,
    systemAnswer: string
  ): Promise<number> => {
    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAnswer, systemAnswer }),
      });

      const data = await response.json();
      return data.similarityScore;
    } catch (error) {
      console.error("Error al comparar respuestas:", error);
      return 0; // Retorna 0 si hay un error
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-900 text-white">
      {/* Video */}
      <div className="md:w-1/2 md:h-screen flex">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover rounded-lg shadow-lg"
        />
      </div>

      {/* Entrevista */}
      <div className="md:w-1/2 flex flex-col items-center justify-center p-8">
        {currentQuestionIndex < interviewQuestions.length ? (
          <>
            <p className="text-xl font-bold text-white mb-4">
              {interviewQuestions[currentQuestionIndex].question}
            </p>

            {!listening ? (
              <button
                onClick={startListening}
                className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                🎙️ Responder (20s)
              </button>
            ) : (
              <button
                onClick={stopListening}
                className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                ⏹️ Detener Respuesta
              </button>
            )}

            {finalTranscript && (
              <div className="mt-4 bg-gray-800 p-4 rounded-lg">
                <p className="text-blue-400">📝 Respuesta:</p>
                <p className="text-white">{finalTranscript}</p>
                <p className="text-green-400">
                  ✅ Respuesta Correcta:{" "}
                  {interviewQuestions[currentQuestionIndex].systemAnswer}
                </p>
                <p className="text-yellow-400">
                  🔹 Similitud:{" "}
                  {responses[currentQuestionIndex]?.score ?? "Calculando..."}
                </p>
                <button
                  onClick={nextQuestion}
                  className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  ➡️ Siguiente Pregunta
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-4 bg-gray-800 p-4 rounded-lg">
            <p className="text-blue-400 text-lg font-bold">
              ✅ Entrevista Finalizada
            </p>
            {responses.map((response, index) => (
              <p key={index} className="text-white mt-2">
                <strong>{response.pregunta}:</strong> {response.userAnswer}
                <br />✅ Correcta: {response.systemAnswer}
                <br />
                🔹 Similitud: {response.score}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualInterview;
