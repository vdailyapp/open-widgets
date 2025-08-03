import React, { useState, useEffect } from 'react';
import { Clock, Code, Coffee, RefreshCw } from 'lucide-react';

const WakaTimeWidget = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Replace with your actual WakaTime API key
  const WAKATIME_API_KEY = 'af0ef04b-19d0-4358-b4c6-5f80dfe26cfc';

  useEffect(() => {
    const fetchWakaTimeStats = async () => {
      try {
        setLoading(true);

        // Fetch stats for the last 7 days
        const [summariesResponse, languagesResponse] = await Promise.all([
          fetch('https://wakapi.vdaily.app/api/v1/users/current/summaries?range=last_7_days', {
            headers: {
              Authorization: `Basic ${btoa(WAKATIME_API_KEY)}`,
            },
          }),
          fetch('https://wakapi.vdaily.app/api/v1/users/current/languages?range=last_7_days', {
            headers: {
              Authorization: `Basic ${btoa(WAKATIME_API_KEY)}`,
            },
          }),
        ]);

        const summariesData = await summariesResponse.json();
        const languagesData = await languagesResponse.json();

        // Process total time
        const totalSeconds = summariesData.data.reduce(
          (total, day) => total + day.grand_total.total_seconds,
          0,
        );
        const totalHours = Math.floor(totalSeconds / 3600);
        const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

        // Process top languages
        const topLanguages = languagesData.data.slice(0, 3).map((lang) => ({
          name: lang.name,
          percentage: Number((lang.percent || 0).toFixed(1)),
        }));

        setStats({
          totalCodingTime: `${totalHours}h ${totalMinutes}m`,
          topLanguages: topLanguages,
          projectsWorkedOn: summariesData.data[0].projects.length,
          averageDailyCodingTime: `${Math.floor(totalSeconds / (7 * 3600))}h ${Math.floor(
            (totalSeconds % 3600) / (7 * 60),
          )}m`,
        });

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch WakaTime stats');
        setLoading(false);
        console.error('WakaTime API Error:', err);
      }
    };

    // Only fetch if API key is available
    if (WAKATIME_API_KEY) {
      fetchWakaTimeStats();
    } else {
      setError('WakaTime API key is missing');
      setLoading(false);
    }
  }, [WAKATIME_API_KEY]);

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="flex items-center space-x-3 text-white">
          <RefreshCw className="animate-spin" size={32} />
          <span>Loading WakaTime stats...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-500 via-pink-500 to-orange-500">
        <div className="w-full max-w-md rounded-xl bg-white/80 p-6 text-center shadow-2xl backdrop-blur-lg">
          <h2 className="mb-4 text-2xl font-bold text-red-600">Error</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="mx-auto w-full max-w-md transform rounded-xl bg-white/80 p-6 shadow-2xl backdrop-blur-lg transition-all hover:scale-105">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-3">
            <Clock className="text-purple-600" size={32} />
            <h2 className="text-2xl font-bold text-gray-800">WakaTime Stats</h2>
          </div>

          <div className="w-full rounded-lg bg-gray-100 p-4 shadow-inner">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-gray-700">Total Coding Time (7 days)</span>
              <span className="font-bold text-purple-600">{stats.totalCodingTime}</span>
            </div>

            <div className="mt-4">
              <h3 className="mb-2 text-lg font-semibold text-gray-800">Top Languages</h3>
              {stats.topLanguages.map((lang, index) => (
                <div key={lang.name} className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{lang.name}</span>
                    <span>{lang.percentage}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-purple-500"
                      style={{ width: `${lang.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-indigo-50 p-3 text-center">
                <Code className="mx-auto mb-2 text-indigo-600" size={24} />
                <p className="text-sm text-gray-700">Projects</p>
                <p className="font-bold text-indigo-700">{stats.projectsWorkedOn}</p>
              </div>

              <div className="rounded-lg bg-pink-50 p-3 text-center">
                <Coffee className="mx-auto mb-2 text-pink-600" size={24} />
                <p className="text-sm text-gray-700">Avg Daily Code</p>
                <p className="font-bold text-pink-700">{stats.averageDailyCodingTime}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WakaTimeWidget;
