import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RefreshCw } from 'lucide-react';

const SwiftRead = () => {
  const [text, setText] = useState('');
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(300); // Words per minute
  const intervalRef = useRef(null);

  // Clean up text before processing
  const cleanupText = (inputText) => {
    // Remove extra whitespaces
    let cleanedText = inputText.replace(/\s+/g, ' ').trim();

    // Remove special characters and numbers (optional, can be customized)
    cleanedText = cleanedText.replace(/[^a-zA-Z\s]/g, '');

    return cleanedText;
  };

  // Process text into words when input changes
  const handleTextChange = (e) => {
    const inputText = e.target.value;
    const cleanedText = cleanupText(inputText);

    setText(cleanedText);
    setWords(cleanedText.split(' ').filter((word) => word.trim() !== ''));
    setCurrentWordIndex(0);
  };

  // Highlight center of word logic
  const highlightCenterWord = (word) => {
    if (!word) return '';

    // Calculate the center index
    const centerIndex = Math.floor(word.length / 2);

    return (
      <>
        {word.slice(0, centerIndex)}
        <span className="text-blue-600">{word[centerIndex]}</span>
        {word.slice(centerIndex + 1)}
      </>
    );
  };

  // Start reading
  const startReading = () => {
    if (words.length === 0) return;

    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      setCurrentWordIndex((prevIndex) => {
        if (prevIndex >= words.length - 1) {
          clearInterval(intervalRef.current);
          setIsPlaying(false);
          return prevIndex;
        }
        return prevIndex + 1;
      });
    }, 60000 / speed);
  };

  // Pause reading
  const pauseReading = () => {
    setIsPlaying(false);
    clearInterval(intervalRef.current);
  };

  // Reset reading
  const resetReading = () => {
    setCurrentWordIndex(0);
    setIsPlaying(false);
    clearInterval(intervalRef.current);
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold text-blue-600">SwiftRead</h1>

        {/* Text Input Area */}
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Paste your text here to start speed reading..."
          className="mb-4 h-40 w-full rounded-md border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Word Display */}
        <div className="mb-6 mt-4 text-center">
          {words.length > 0 ? (
            <div className="rounded-md bg-blue-50 p-4 text-4xl font-bold text-gray-800">
              {highlightCenterWord(words[currentWordIndex])}
            </div>
          ) : (
            <p className="text-gray-500">Enter text to begin</p>
          )}
        </div>

        {/* Controls */}
        <div className="mb-4 flex items-center justify-center space-x-4">
          {/* Speed Control */}
          <div className="flex items-center">
            <label className="mr-2 text-gray-700">Speed:</label>
            <input
              type="range"
              min="100"
              max="800"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-32"
            />
            <span className="ml-2 text-gray-700">{speed} WPM</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {!isPlaying ? (
            <button
              onClick={startReading}
              disabled={words.length === 0}
              className="flex items-center rounded-full bg-green-500 p-3 text-white transition hover:bg-green-600 disabled:opacity-50"
            >
              <Play className="mr-2" /> Start
            </button>
          ) : (
            <button
              onClick={pauseReading}
              className="flex items-center rounded-full bg-yellow-500 p-3 text-white transition hover:bg-yellow-600"
            >
              <Pause className="mr-2" /> Pause
            </button>
          )}

          <button
            onClick={resetReading}
            disabled={words.length === 0}
            className="flex items-center rounded-full bg-red-500 p-3 text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            <RefreshCw className="mr-2" /> Reset
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-4 text-center text-gray-600">
          {words.length > 0 && (
            <p>
              Word {currentWordIndex + 1} of {words.length}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwiftRead;
