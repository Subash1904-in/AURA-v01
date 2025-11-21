import { useEffect, useState } from "react";

const VoiceIndicator = () => {
  const [bars] = useState(Array.from({ length: 20 }, () => Math.random()));
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate((prev) => !prev);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 backdrop-blur-sm border border-border/50">
      <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      <span className="text-sm text-foreground">Listening...</span>
      <div className="flex items-center gap-0.5 h-6">
        {bars.map((height, i) => (
          <div
            key={i}
            className="w-0.5 rounded-full bg-accent transition-all duration-100"
            style={{
              height: animate ? `${height * 100}%` : `${(1 - height) * 100}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default VoiceIndicator;
