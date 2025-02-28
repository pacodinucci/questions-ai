"use client";

import React, { useEffect, useRef, useState } from "react";

const VideoRecorder = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" }, // Cámara frontal
          audio: true, // Capturar audio también
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

  const startRecording = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const recorder = new MediaRecorder(stream, { mimeType: "video/mp4" });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoURL(url);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);

      // Detener grabación después de 20 segundos
      setTimeout(() => {
        recorder.stop();
        setRecording(false);
      }, 10000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full max-w-md rounded-lg shadow-lg"
        muted={recording}
      />

      {!recording ? (
        <button
          onClick={startRecording}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          🎥 Iniciar Grabación (20s)
        </button>
      ) : (
        <p className="mt-4 text-red-400">Grabando... ⏳</p>
      )}

      {videoURL && (
        <div className="mt-4">
          <p className="text-green-400">✅ Video Grabado:</p>
          <video
            src={videoURL}
            controls
            className="w-full max-w-md rounded-lg shadow-lg mt-2"
          />
          <a
            href={videoURL}
            download="video.webm"
            className="mt-2 inline-block bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            ⬇️ Descargar Video
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;
