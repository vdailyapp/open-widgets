import React, { useState, useEffect } from "react";
import {
  Settings,
  Copy,
  Check,
  Calendar,
  Clock,
  RefreshCw,
  Info,
  Moon,
  Sun,
} from "lucide-react";
import { Modal } from "antd";

// Cron field options
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];
const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

// Preset schedules
const PRESETS = [
  { label: "Every Minute", cron: "* * * * *" },
  { label: "Every 5 Minutes", cron: "*/5 * * * *" },
  { label: "Every 15 Minutes", cron: "*/15 * * * *" },
  { label: "Every 30 Minutes", cron: "*/30 * * * *" },
  { label: "Every Hour", cron: "0 * * * *" },
  { label: "Every Day at Midnight", cron: "0 0 * * *" },
  { label: "Every Day at Noon", cron: "0 12 * * *" },
  { label: "Every Monday at 9 AM", cron: "0 9 * * 1" },
  { label: "Every Week (Sunday)", cron: "0 0 * * 0" },
  { label: "First Day of Month", cron: "0 0 1 * *" },
  { label: "Every Year (Jan 1)", cron: "0 0 1 1 *" },
];

interface CronExpression {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

interface ExternalConfig {
  initialCron?: string;
  theme?: {
    darkMode?: boolean;
  };
}

const CrontabWidget: React.FC = () => {
  // Theme state
  const [darkMode, setDarkMode] = useState(false);

  // Cron expression state
  const [cronExpression, setCronExpression] = useState<CronExpression>({
    minute: "*",
    hour: "*",
    dayOfMonth: "*",
    month: "*",
    dayOfWeek: "*",
  });

  // UI state
  const [activeTab, setActiveTab] = useState<
    "simple" | "advanced" | "presets"
  >("simple");
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Simple mode state
  const [simpleMode, setSimpleMode] = useState({
    frequency: "daily",
    time: { hour: 0, minute: 0 },
    dayOfWeek: 1,
    dayOfMonth: 1,
  });

  // Load from localStorage
  useEffect(() => {
    const savedCron = localStorage.getItem("crontab-expression");
    const savedMode = localStorage.getItem("crontab-darkMode");

    if (savedCron) {
      const parts = savedCron.split(" ");
      if (parts.length === 5) {
        setCronExpression({
          minute: parts[0],
          hour: parts[1],
          dayOfMonth: parts[2],
          month: parts[3],
          dayOfWeek: parts[4],
        });
      }
    }

    if (savedMode) {
      setDarkMode(savedMode === "true");
    }
  }, []);

  // Listen for external configuration
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "CRONTAB_CONFIG") {
        const config: ExternalConfig = event.data.config;
        if (config.initialCron) {
          const parts = config.initialCron.split(" ");
          if (parts.length === 5) {
            setCronExpression({
              minute: parts[0],
              hour: parts[1],
              dayOfMonth: parts[2],
              month: parts[3],
              dayOfWeek: parts[4],
            });
          }
        }
        if (config.theme?.darkMode !== undefined) {
          setDarkMode(config.theme.darkMode);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Save to localStorage
  useEffect(() => {
    const cron = getCronString();
    localStorage.setItem("crontab-expression", cron);
    localStorage.setItem("crontab-darkMode", String(darkMode));
  }, [cronExpression, darkMode]);

  // Generate cron string
  const getCronString = (): string => {
    return `${cronExpression.minute} ${cronExpression.hour} ${cronExpression.dayOfMonth} ${cronExpression.month} ${cronExpression.dayOfWeek}`;
  };

  // Update cron from simple mode
  const updateCronFromSimple = () => {
    const { frequency, time, dayOfWeek, dayOfMonth } = simpleMode;

    let newCron: CronExpression = {
      minute: String(time.minute),
      hour: String(time.hour),
      dayOfMonth: "*",
      month: "*",
      dayOfWeek: "*",
    };

    switch (frequency) {
      case "minute":
        newCron = { minute: "*", hour: "*", dayOfMonth: "*", month: "*", dayOfWeek: "*" };
        break;
      case "hourly":
        newCron.minute = String(time.minute);
        break;
      case "daily":
        newCron.minute = String(time.minute);
        newCron.hour = String(time.hour);
        break;
      case "weekly":
        newCron.minute = String(time.minute);
        newCron.hour = String(time.hour);
        newCron.dayOfWeek = String(dayOfWeek);
        break;
      case "monthly":
        newCron.minute = String(time.minute);
        newCron.hour = String(time.hour);
        newCron.dayOfMonth = String(dayOfMonth);
        break;
    }

    setCronExpression(newCron);
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(getCronString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Apply preset
  const applyPreset = (cron: string) => {
    const parts = cron.split(" ");
    if (parts.length === 5) {
      setCronExpression({
        minute: parts[0],
        hour: parts[1],
        dayOfMonth: parts[2],
        month: parts[3],
        dayOfWeek: parts[4],
      });
    }
  };

  // Generate human-readable description
  const getDescription = (): string => {
    const cron = getCronString();

    // Check for presets
    const preset = PRESETS.find((p) => p.cron === cron);
    if (preset) return preset.label;

    // Generate description
    const parts = [];

    // Minute
    if (cronExpression.minute === "*") {
      parts.push("every minute");
    } else if (cronExpression.minute.startsWith("*/")) {
      parts.push(`every ${cronExpression.minute.slice(2)} minutes`);
    } else {
      parts.push(`at minute ${cronExpression.minute}`);
    }

    // Hour
    if (cronExpression.hour === "*") {
      parts.push("of every hour");
    } else if (cronExpression.hour.startsWith("*/")) {
      parts.push(`every ${cronExpression.hour.slice(2)} hours`);
    } else {
      parts.push(`at ${cronExpression.hour}:00`);
    }

    // Day of month
    if (cronExpression.dayOfMonth !== "*") {
      parts.push(`on day ${cronExpression.dayOfMonth} of the month`);
    }

    // Month
    if (cronExpression.month !== "*") {
      const monthNum = parseInt(cronExpression.month);
      const month = MONTHS.find((m) => m.value === monthNum);
      if (month) parts.push(`in ${month.label}`);
    }

    // Day of week
    if (cronExpression.dayOfWeek !== "*") {
      const dayNum = parseInt(cronExpression.dayOfWeek);
      const day = DAYS_OF_WEEK.find((d) => d.value === dayNum);
      if (day) parts.push(`on ${day.label}`);
    }

    return parts.join(" ");
  };

  // Get next execution times
  const getNextExecutions = (): string[] => {
    // This is a simplified version - in production, use a library like cron-parser
    const now = new Date();
    return [
      now.toLocaleString(),
      new Date(now.getTime() + 60000).toLocaleString(),
      new Date(now.getTime() + 120000).toLocaleString(),
    ];
  };

  const themeClasses = darkMode
    ? "dark bg-gray-900 text-white"
    : "bg-gray-50 text-gray-900";

  return (
    <div className={`min-h-screen w-full ${themeClasses} transition-colors duration-200`}>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className={`${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          } border-b px-4 py-3 flex-shrink-0`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold flex items-center">
                <Clock className="mr-2" />
                Crontab Generator
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              {/* Info Button */}
              <button
                onClick={() => setShowInfo(true)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? "bg-gray-700 text-gray-300 hover:text-white"
                    : "bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
              >
                <Info size={16} />
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? "bg-gray-700 text-gray-300 hover:text-white"
                    : "bg-gray-100 text-gray-600 hover:text-gray-900"
                }`}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {/* Copy Button */}
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Cron Expression Display */}
            <div
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } rounded-lg p-6 shadow-lg`}
            >
              <h2 className="text-xl font-semibold mb-4">Cron Expression</h2>
              <div
                className={`${
                  darkMode ? "bg-gray-900" : "bg-gray-100"
                } rounded-lg p-4 font-mono text-lg text-center`}
              >
                {getCronString()}
              </div>
              <div className="mt-4 text-center text-sm opacity-75">
                {getDescription()}
              </div>
            </div>

            {/* Mode Selector */}
            <div
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } rounded-lg p-6 shadow-lg`}
            >
              <div className="flex space-x-2 mb-6">
                <button
                  onClick={() => setActiveTab("simple")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "simple"
                      ? "bg-blue-500 text-white"
                      : darkMode
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Simple
                </button>
                <button
                  onClick={() => setActiveTab("advanced")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "advanced"
                      ? "bg-blue-500 text-white"
                      : darkMode
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Advanced
                </button>
                <button
                  onClick={() => setActiveTab("presets")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === "presets"
                      ? "bg-blue-500 text-white"
                      : darkMode
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Presets
                </button>
              </div>

              {/* Simple Mode */}
              {activeTab === "simple" && (
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 font-medium">Frequency</label>
                    <select
                      value={simpleMode.frequency}
                      onChange={(e) =>
                        setSimpleMode({ ...simpleMode, frequency: e.target.value })
                      }
                      className={`w-full p-2 rounded-lg border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    >
                      <option value="minute">Every Minute</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {simpleMode.frequency !== "minute" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 font-medium">Hour</label>
                        <select
                          value={simpleMode.time.hour}
                          onChange={(e) =>
                            setSimpleMode({
                              ...simpleMode,
                              time: {
                                ...simpleMode.time,
                                hour: parseInt(e.target.value),
                              },
                            })
                          }
                          className={`w-full p-2 rounded-lg border ${
                            darkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        >
                          {HOURS.map((h) => (
                            <option key={h} value={h}>
                              {h.toString().padStart(2, "0")}:00
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-2 font-medium">Minute</label>
                        <select
                          value={simpleMode.time.minute}
                          onChange={(e) =>
                            setSimpleMode({
                              ...simpleMode,
                              time: {
                                ...simpleMode.time,
                                minute: parseInt(e.target.value),
                              },
                            })
                          }
                          className={`w-full p-2 rounded-lg border ${
                            darkMode
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        >
                          {MINUTES.map((m) => (
                            <option key={m} value={m}>
                              :{m.toString().padStart(2, "0")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {simpleMode.frequency === "weekly" && (
                    <div>
                      <label className="block mb-2 font-medium">Day of Week</label>
                      <select
                        value={simpleMode.dayOfWeek}
                        onChange={(e) =>
                          setSimpleMode({
                            ...simpleMode,
                            dayOfWeek: parseInt(e.target.value),
                          })
                        }
                        className={`w-full p-2 rounded-lg border ${
                          darkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {simpleMode.frequency === "monthly" && (
                    <div>
                      <label className="block mb-2 font-medium">Day of Month</label>
                      <select
                        value={simpleMode.dayOfMonth}
                        onChange={(e) =>
                          setSimpleMode({
                            ...simpleMode,
                            dayOfMonth: parseInt(e.target.value),
                          })
                        }
                        className={`w-full p-2 rounded-lg border ${
                          darkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        {DAYS_OF_MONTH.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={updateCronFromSimple}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Generate Cron Expression
                  </button>
                </div>
              )}

              {/* Advanced Mode */}
              {activeTab === "advanced" && (
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 font-medium">
                      Minute (0-59)
                    </label>
                    <input
                      type="text"
                      value={cronExpression.minute}
                      onChange={(e) =>
                        setCronExpression({
                          ...cronExpression,
                          minute: e.target.value,
                        })
                      }
                      placeholder="* or 0-59 or */5"
                      className={`w-full p-2 rounded-lg border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">Hour (0-23)</label>
                    <input
                      type="text"
                      value={cronExpression.hour}
                      onChange={(e) =>
                        setCronExpression({
                          ...cronExpression,
                          hour: e.target.value,
                        })
                      }
                      placeholder="* or 0-23 or */2"
                      className={`w-full p-2 rounded-lg border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">
                      Day of Month (1-31)
                    </label>
                    <input
                      type="text"
                      value={cronExpression.dayOfMonth}
                      onChange={(e) =>
                        setCronExpression({
                          ...cronExpression,
                          dayOfMonth: e.target.value,
                        })
                      }
                      placeholder="* or 1-31"
                      className={`w-full p-2 rounded-lg border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">Month (1-12)</label>
                    <input
                      type="text"
                      value={cronExpression.month}
                      onChange={(e) =>
                        setCronExpression({
                          ...cronExpression,
                          month: e.target.value,
                        })
                      }
                      placeholder="* or 1-12"
                      className={`w-full p-2 rounded-lg border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">
                      Day of Week (0-6, 0=Sunday)
                    </label>
                    <input
                      type="text"
                      value={cronExpression.dayOfWeek}
                      onChange={(e) =>
                        setCronExpression({
                          ...cronExpression,
                          dayOfWeek: e.target.value,
                        })
                      }
                      placeholder="* or 0-6"
                      className={`w-full p-2 rounded-lg border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Presets Mode */}
              {activeTab === "presets" && (
                <div className="grid grid-cols-2 gap-4">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => applyPreset(preset.cron)}
                      className={`p-4 rounded-lg text-left transition-colors ${
                        darkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                      }`}
                    >
                      <div className="font-semibold">{preset.label}</div>
                      <div className="text-sm opacity-75 font-mono mt-1">
                        {preset.cron}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cron Format Reference */}
            <div
              className={`${
                darkMode ? "bg-gray-800" : "bg-white"
              } rounded-lg p-6 shadow-lg`}
            >
              <h2 className="text-xl font-semibold mb-4">Cron Format Reference</h2>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>*</strong> - Any value
                  </div>
                  <div>
                    <strong>,</strong> - Value list separator
                  </div>
                  <div>
                    <strong>-</strong> - Range of values
                  </div>
                  <div>
                    <strong>/</strong> - Step values
                  </div>
                </div>
                <div className="mt-4 font-mono text-xs">
                  * * * * *<br />
                  │ │ │ │ └─── Day of Week (0-6, 0=Sunday)<br />
                  │ │ │ └───── Month (1-12)<br />
                  │ │ └─────── Day of Month (1-31)<br />
                  │ └───────── Hour (0-23)<br />
                  └─────────── Minute (0-59)
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Floating Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors z-40"
        >
          <Settings size={20} />
        </button>

        {/* Settings Modal */}
        <Modal
          open={showSettings}
          onCancel={() => setShowSettings(false)}
          footer={null}
        >
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Dark Mode</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-900"
                  }`}
                >
                  {darkMode ? "On" : "Off"}
                </button>
              </div>
              <div>
                <button
                  onClick={() => {
                    localStorage.removeItem("crontab-expression");
                    localStorage.removeItem("crontab-darkMode");
                    setCronExpression({
                      minute: "*",
                      hour: "*",
                      dayOfMonth: "*",
                      month: "*",
                      dayOfWeek: "*",
                    });
                  }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                  <RefreshCw size={16} className="inline mr-2" />
                  Reset to Default
                </button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Info Modal */}
        <Modal
          open={showInfo}
          onCancel={() => setShowInfo(false)}
          footer={null}
        >
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">About Crontab Generator</h2>
            <div className="space-y-3 text-sm">
              <p>
                This tool helps you create and understand cron expressions for
                scheduling tasks on Unix-like systems.
              </p>
              <div>
                <strong>Features:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Simple mode for quick scheduling</li>
                  <li>Advanced mode for complex patterns</li>
                  <li>Pre-built presets for common schedules</li>
                  <li>Human-readable descriptions</li>
                  <li>Dark mode support</li>
                  <li>Persistent storage in browser</li>
                </ul>
              </div>
              <div>
                <strong>Examples:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 font-mono text-xs">
                  <li>0 * * * * - Every hour</li>
                  <li>*/15 * * * * - Every 15 minutes</li>
                  <li>0 9 * * 1-5 - 9 AM, weekdays only</li>
                  <li>0 0 1 * * - First day of every month</li>
                </ul>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default CrontabWidget;
