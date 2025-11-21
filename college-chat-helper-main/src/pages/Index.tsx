import { useState, useCallback, useRef } from "react";
import VoiceIndicator from "@/components/VoiceIndicator";
import CameraFeed from "@/components/CameraFeed";
import PosterCarousel from "@/components/PosterCarousel";
import campusBg from "@/assets/campus-bg.jpg";

const Index = () => {
  const [isListening, setIsListening] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMotionDetected = useCallback(() => {
    if (!isListening) {
      setIsListening(true);
      setShowPulse(true);
      
      // Play audio feedback
      if (!audioRef.current) {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiDcIF2m98OScTgwPUKXh8LxnHwU7k9n0yHkpBSd+zPLaizsKElyw6OyrVxQKRp/g8r5sIAUsgs/z2og1Bxdqvu/mnU4MD1Kl4O+8aCAEO5PZ9Mh5KQUofsz02os7ChJctOjrq1cUCkij5PK9aR8ELIPPs9eHNgcYbcDw5p1PDAxUpePvvG0gBDqR1/PJeisGKH/O8tiKPAoRXrTp6KpYEwpJo+TyvmshBCuE0PTYiDYHGG7A7+adTg8NVaTk8L1tIQQ6k9j0yHorBih/zvLXiT0KElyw6+mrWhQJR6Lj8r5rHwQshNDz14g2BxhvwO/mnU4PDFWk5PC9bSIFOpPY9Mh6LAYnfszz14k9ChJcr+jrrFoUCUei4/K+ax8ELITPs9aINwcYb8Dv5p1OEAxVpOTwvWwiBTqR1/TJeSwGKH7M89eIPQoSXK/o66xaFAlHoePyvmsf');
      }
      audioRef.current.play().catch(() => {});
      
      // Remove pulse after animation
      setTimeout(() => setShowPulse(false), 1000);
      
      console.log("Motion detected - activating voice");
    }
    
    // Reset inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Set new inactivity timer for 15 seconds
    inactivityTimerRef.current = setTimeout(() => {
      setIsListening(false);
      console.log("No motion detected - deactivating voice");
    }, 15000);
  }, [isListening]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${campusBg})`,
          filter: 'blur(8px)',
          transform: 'scale(1.1)'
        }}
      />
      <div className="absolute inset-0 bg-background/80" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Camera Feed */}
        <CameraFeed onMotionDetected={handleMotionDetected} isActive={true} />

        {/* Voice Indicator - shown when listening */}
        {isListening && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
            <VoiceIndicator />
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-4xl flex items-center justify-center min-h-[60vh]">
            {!isListening ? (
              <PosterCarousel />
            ) : (
              <div className={`flex items-center gap-3 transition-all duration-500 ${showPulse ? 'scale-110' : 'scale-100'}`}>
                <div className={`w-16 h-16 rounded-full bg-accent flex items-center justify-center ${showPulse ? 'animate-ping' : 'animate-pulse'}`}>
                  <span className="text-accent-foreground font-bold text-3xl">C</span>
                </div>
                <span className="text-3xl font-bold text-foreground">Campus AI</span>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
