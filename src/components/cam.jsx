import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";

function CameraLiveAI() {
  const videoRef = useRef(null);
  const [prediction, setPrediction] = useState(null);
  const modelRef = useRef(null);

  useEffect(() => {
    async function loadModel() {
      const model = await tf.loadLayersModel("/model/model.json");
      modelRef.current = model;
      //   console.log("Modelo cargado");
    }
    loadModel();
  }, []);

  const predictFrame = () => {
    const video = videoRef.current;
    const model = modelRef.current;

    if (!video || !model) return;

    const tensor = tf.browser
      .fromPixels(video)
      .resizeNearestNeighbor([180, 180])
      .toFloat()
      .expandDims(0)
      .div(255);

    const pred = model.predict(tensor);
    pred.array().then((data) => {
      setPrediction(data[0]);
    });

    tensor.dispose();
    pred.dispose();
  };

  useEffect(() => {
    let intervalId;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = stream;

        intervalId = setInterval(() => {
          if (!modelRef.current) return;
          predictFrame();
        }, 1000);
      } catch (err) {
        console.error("No se pudo acceder a la cámara", err);
      }
    }

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="w-full h-screen flex flex-col justify-center items-center bg-radial to-black from-gray-700">
      <h2 className="text-3xl p-5 font-bold text-green-200 ">
        ¿Eres un gato o un perro?
      </h2>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="max-w-2/3 border-2 border-white"
      />
      <p className="text-xl p-2 text-green-400">
        Predicción:{prediction && prediction > 0.5 ? " Perro" : " Gato"}.
      </p>
    </div>
  );
}

export default CameraLiveAI;
