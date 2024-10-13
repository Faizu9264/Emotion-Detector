import React from "react";
import "./App.css"; 
import EmotionDetector from "./components/EmotionDetector";


function App() {
  return (
    <div className="App">
      <h1>Face Detection Using TensorFlow.js</h1>
      <EmotionDetector/>
    </div>
  );
}

export default App;
