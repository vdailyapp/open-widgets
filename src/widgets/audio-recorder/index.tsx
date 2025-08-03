import React, { useEffect, useRef, useState } from "react";
import { Download, Mic, StopCircle, Trash2 } from "lucide-react";

const VoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);

        // Add to recordings list
        const newRecording = {
          id: Date.now(),
          url: audioUrl,
          duration: recordingTime,
        };
        setRecordings((prev) => [...prev, newRecording]);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone", error);
      alert("Unable to access microphone. Please check permissions.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  // Delete current recording
  const deleteRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
    }
  };

  // Delete a specific recording from the list
  const deleteStoredRecording = (id) => {
    const recordingToDelete = recordings.find((r) => r.id === id);
    if (recordingToDelete) {
      URL.revokeObjectURL(recordingToDelete.url);
    }
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  // Download recording
  const downloadRecording = (url, id) => {
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `recording_${id}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Clean up resources
  useEffect(() => {
    return () => {
      if (audioURL) URL.revokeObjectURL(audioURL);
      recordings.forEach((r) => URL.revokeObjectURL(r.url));
    };
  }, [audioURL, recordings]);

  return (
    <div className="page-center">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 shadow-2xl">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-indigo-800">Voice Recorder</h2>
          <div className="mt-2 font-mono text-3xl text-indigo-600">
            {formatTime(recordingTime)}
          </div>
        </div>

        <div className="mb-6 flex justify-center space-x-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="rounded-full bg-green-500 p-3 text-white transition-colors hover:bg-green-600"
            >
              <Mic size={24} />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="rounded-full bg-red-500 p-3 text-white transition-colors hover:bg-red-600"
            >
              <StopCircle size={24} />
            </button>
          )}

          {audioURL && (
            <>
              <button
                onClick={deleteRecording}
                className="rounded-full bg-gray-200 p-3 text-gray-700 transition-colors hover:bg-gray-300"
              >
                <Trash2 size={24} />
              </button>
              <audio src={audioURL} controls className="w-full" />
            </>
          )}
        </div>

        <div className="max-h-48 overflow-y-auto rounded-lg bg-white p-4">
          <h3 className="mb-2 text-lg font-semibold text-indigo-700">
            Recordings
          </h3>
          {recordings.length === 0 ? (
            <p className="text-center text-gray-500">No recordings yet</p>
          ) : (
            <ul className="space-y-2">
              {recordings.map((recording) => (
                <li
                  key={recording.id}
                  className="flex items-center justify-between rounded-lg bg-gray-100 p-2"
                >
                  <span className="text-sm">
                    Recording {formatTime(recording.duration)}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        downloadRecording(recording.url, recording.id)
                      }
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Download size={20} />
                    </button>
                    <button
                      onClick={() => deleteStoredRecording(recording.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;
