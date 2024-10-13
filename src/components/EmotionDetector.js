import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const EmotionDetector = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [emotion, setEmotion] = useState(null);
  const [age, setAge] = useState(null);
  const [gender, setGender] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceExpressionNet.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.ageGenderNet.loadFromUri('/models'); 
    };

    const startVideo = async () => {
      await loadModels();
      navigator.mediaDevices.getUserMedia({ video: {} })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch((err) => console.error("Error accessing webcam: ", err));
    };

    startVideo();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      detectEmotions();
    }, 1000); 
    return () => clearInterval(interval); 
  }, []);

  const detectEmotions = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    const detections = await faceapi.detectAllFaces(
      videoRef.current,
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceExpressions().withAgeAndGender(); 

    if (detections.length > 0) {
      setFaceDetected(true);
      const expressions = detections[0].expressions;
      const highestEmotion = Object.keys(expressions).reduce((a, b) =>
        expressions[a] > expressions[b] ? a : b
      );
      setEmotion(highestEmotion);

      const { age, gender } = detections[0]; 
      setAge(Math.round(age)); 
      setGender(gender); 

      const { x, y, width, height } = detections[0].detection.box;
      context.strokeStyle = 'green';
      context.lineWidth = 2;
      context.strokeRect(x, y, width, height);

      const landmarks = detections[0].landmarks.positions;
      context.strokeStyle = 'red';
      context.lineWidth = 2;

      for (let i = 0; i < landmarks.length - 1; i++) {
        context.beginPath();
        context.moveTo(landmarks[i].x, landmarks[i].y);
        context.lineTo(landmarks[i + 1].x, landmarks[i + 1].y);
        context.stroke();
      }

      context.fillStyle = 'red'; 
      landmarks.forEach(point => {
        context.beginPath();
        context.arc(point.x, point.y, 3, 0, Math.PI * 2, true); 
        context.fill();
      });

      context.fillStyle = 'white';
      context.fillText(`Emotion: ${highestEmotion}`, x, y > 10 ? y - 10 : 10);
      context.fillText(`Probabilities:`, x, y + height + 15);
      Object.entries(expressions).forEach(([emotion, probability], index) => {
        context.fillText(`${emotion}: ${Math.round(probability * 100)}%`, x, y + height + 30 + index * 15);
      });
    } else {
      setFaceDetected(false);
      setEmotion(null);
      setAge(null);
      setGender(null);
    }
  };

  return (
    <div>
      <h1>Emotion Detector</h1>
      <video ref={videoRef} autoPlay muted width="500" height="300" />
      <canvas ref={canvasRef} width="640" height="480" style={{ position: 'absolute', top: 0, left: 0 }} />
      {faceDetected ? (
        <div>
          <h2>Detected Emotion: {emotion}</h2>
          <h2>Estimated Age: {age}</h2>
          <h2>Estimated Gender: {gender}</h2>
        </div>
      ) : (
        <h2>No face detected. Please adjust your position.</h2>
      )}
    </div>
  );
};

export default EmotionDetector;
