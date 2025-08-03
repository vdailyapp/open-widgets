import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Clock,
  RefreshCw,
  Bell,
  BarChart2,
  Settings,
} from "lucide-react";
import { Modal } from "antd";
const PomodoroWidget = () => {
  // Timer configurations
  const [settings, setSettings] = useState({
    workDuration: 25, // minutes
    breakDuration: 5, // minutes
    longBreakDuration: 15, // minutes
    cyclesUntilLongBreak: 4,
  });

  // Timer state
  const [time, setTime] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [cycleCount, setCycleCount] = useState(0);

  // Tracking completed pomodoros
  const [completedPomodoros, setCompletedPomodoros] = useState([]);

  // References
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  // Start/Pause Timer
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Reset Timer
  const resetTimer = () => {
    setIsRunning(false);
    setTime(
      isWorkSession ? settings.workDuration * 60 : settings.breakDuration * 60
    );
  };

  // Timer Logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 0) {
            // Play sound
            if (audioRef.current) {
              audioRef.current.play();
            }

            // Switch between work and break
            if (isWorkSession) {
              // Track completed pomodoro
              const newCompletedPomodoro = {
                date: new Date(),
                duration: settings.workDuration,
              };
              setCompletedPomodoros((prev) => [...prev, newCompletedPomodoro]);

              // Increment cycle count
              setCycleCount((prev) => prev + 1);

              // Determine next session type
              if (cycleCount + 1 === settings.cyclesUntilLongBreak) {
                setTime(settings.longBreakDuration * 60);
                setIsWorkSession(false);
                setCycleCount(0);
              } else {
                setTime(settings.breakDuration * 60);
                setIsWorkSession(false);
              }
            } else {
              // Return to work session
              setTime(settings.workDuration * 60);
              setIsWorkSession(true);
            }

            // Stop the interval
            clearInterval(timerRef.current);
            setIsRunning(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    // Cleanup
    return () => clearInterval(timerRef.current);
  }, [isRunning, isWorkSession, cycleCount, settings]);

  // Format time
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Settings Modal Component
  const [showSettings, setShowSettings] = useState(false);
  const SettingsModal = () => {
    const [tempSettings, setTempSettings] = useState(settings);

    const handleSave = () => {
      setSettings(tempSettings);
      setShowSettings(false);
      // Reset timer to new duration
      setTime(
        isWorkSession
          ? tempSettings.workDuration * 60
          : tempSettings.breakDuration * 60
      );
    };

    return (
      <Modal
        open={showSettings}
        onCancel={() => setShowSettings(false)}
        footer={null}
      >
        <div className="w-full rounded-lg bg-white p-6">
          <h2 className="mb-4 flex items-center text-xl font-bold">
            <Settings className="mr-2" /> Timer Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block">Work Duration (minutes)</label>
              <input
                type="number"
                value={tempSettings.workDuration}
                onChange={(e) =>
                  setTempSettings((prev) => ({
                    ...prev,
                    workDuration: parseInt(e.target.value),
                  }))
                }
                className="w-full rounded border px-3 py-2"
                min="1"
                max="60"
              />
            </div>

            <div>
              <label className="mb-2 block">Break Duration (minutes)</label>
              <input
                type="number"
                value={tempSettings.breakDuration}
                onChange={(e) =>
                  setTempSettings((prev) => ({
                    ...prev,
                    breakDuration: parseInt(e.target.value),
                  }))
                }
                className="w-full rounded border px-3 py-2"
                min="1"
                max="30"
              />
            </div>

            <div>
              <label className="mb-2 block">
                Long Break Duration (minutes)
              </label>
              <input
                type="number"
                value={tempSettings.longBreakDuration}
                onChange={(e) =>
                  setTempSettings((prev) => ({
                    ...prev,
                    longBreakDuration: parseInt(e.target.value),
                  }))
                }
                className="w-full rounded border px-3 py-2"
                min="1"
                max="45"
              />
            </div>

            <div>
              <label className="mb-2 block">Cycles Until Long Break</label>
              <input
                type="number"
                value={tempSettings.cyclesUntilLongBreak}
                onChange={(e) =>
                  setTempSettings((prev) => ({
                    ...prev,
                    cyclesUntilLongBreak: parseInt(e.target.value),
                  }))
                }
                className="w-full rounded border px-3 py-2"
                min="1"
                max="10"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-2">
            <button
              onClick={() => setShowSettings(false)}
              className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  // Productivity Stats Component
  const ProductivityStats = () => {
    const totalPomodoros = completedPomodoros.length;
    const totalWorkTime = completedPomodoros.reduce(
      (sum, pomodoro) => sum + pomodoro.duration,
      0
    );

    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 flex items-center text-xl font-bold">
          <BarChart2 className="mr-2" /> Productivity Stats
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Total Pomodoros</p>
            <p className="text-2xl font-bold">{totalPomodoros}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Work Time</p>
            <p className="text-2xl font-bold">{totalWorkTime} mins</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6">
      {/* Audio for timer complete */}
      <audio ref={audioRef} src="/timer-complete.mp3" />

      {/* Settings Modal */}
      {showSettings && <SettingsModal />}

      <div className="w-full max-w-xl">
        <div className="overflow-hidden rounded-xl bg-white shadow-2xl">
          {/* Timer Display */}
          <div
            className={`
            p-6 text-center 
            ${isWorkSession ? "bg-red-500" : "bg-green-500"} 
            text-white
          `}
          >
            <h2 className="mb-2 flex items-center justify-center text-xl">
              <Clock className="mr-2" />
              {isWorkSession ? "Work Session" : "Break Time"}
            </h2>
            <div className="text-6xl font-bold">{formatTime(time)}</div>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4 bg-gray-50 p-6">
            <button
              onClick={toggleTimer}
              className={`
                rounded-full p-3 
                ${
                  isRunning
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-blue-500 hover:bg-blue-600"
                } 
                text-white transition-colors
              `}
            >
              {isRunning ? <Pause /> : <Play />}
            </button>
            <button
              onClick={resetTimer}
              className="rounded-full bg-gray-200 p-3 transition-colors hover:bg-gray-300"
            >
              <RefreshCw />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="rounded-full bg-gray-200 p-3 transition-colors hover:bg-gray-300"
            >
              <Settings />
            </button>
          </div>
        </div>

        {/* Productivity Stats */}
        <div className="mt-6">
          <ProductivityStats />
        </div>
      </div>
    </div>
  );
};

export default PomodoroWidget;
