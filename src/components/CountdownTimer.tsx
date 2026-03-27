import React, { useState, useRef, useEffect } from "react";

export const CountdownTimer: React.FC<{
  targetDate: Date | null;
  label: string;
  onTimerEnd: () => void;
  isActiveWindow?: boolean;
}> = ({ targetDate, label, onTimerEnd, isActiveWindow = false }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [progress, setProgress] = useState(0);

  const onTimerEndRef = useRef(onTimerEnd);
  const triggeredRef = useRef(false);

  useEffect(() => {
    onTimerEndRef.current = onTimerEnd;
  }, [onTimerEnd]);

  useEffect(() => {
    // Reset trigger if target date changes significantly
    triggeredRef.current = false;
  }, [targetDate]);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft("--:--:--");
      setProgress(0);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();

      // Trigger logic
      if (diff <= 1000 && !triggeredRef.current) {
        onTimerEndRef.current();
        triggeredRef.current = true;
      } else if (diff > 5000 && triggeredRef.current) {
        triggeredRef.current = false;
      }

      const displayDiff = Math.max(0, diff);
      const hours = Math.floor(displayDiff / (1000 * 60 * 60));
      const minutes = Math.floor(
        (displayDiff % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((displayDiff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0"
        )}:${String(seconds).padStart(2, "0")}`
      );

      // Simple visual progress: 
      // If active window (55 mins max), show decaying progress.
      // If waiting for next (hours), show fill progress.
      // Easiest is to just bind it linearly to a fixed modulo or static visual if we lack prevDate.
      // We will leave progress at 100% decaying for active, and 0->100% for future as an estimation.
      
      let progressPercentage = 0;
      if (isActiveWindow) {
          // Max window is 55 mins (3300000 ms)
          progressPercentage = (displayDiff / 3300000) * 100;
      } else {
          // Assume average 2 hour wait (7200000 ms) between pings
          progressPercentage = 100 - ((displayDiff / 7200000) * 100);
          if (progressPercentage < 0) progressPercentage = 0;
      }
      setProgress(Math.min(100, Math.max(0, progressPercentage)));

    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, isActiveWindow]);

  if (!targetDate) return null;

  return (
    <div className="text-center w-36">
      <div className="text-xs text-cyan-300/80">{label}</div>
      <div className={`font-mono text-lg tracking-widest ${isActiveWindow ? "text-yellow-400 font-bold" : "text-cyan-400"}`}>
        {timeLeft}
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
        <div
          className={`${isActiveWindow ? "bg-yellow-400" : "bg-green-500"} h-1.5 rounded-full transition-all duration-1000 ease-linear`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};