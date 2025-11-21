import { Mic } from "lucide-react";
import { Button } from "./ui/button";

interface ChatResultProps {
  query: string;
  results: {
    label: string;
    value: string;
    isLink?: boolean;
  }[];
}

const ChatResult = ({ query, results }: ChatResultProps) => {
  return (
    <div className="w-full space-y-4">
      <div className="bg-secondary/70 backdrop-blur-sm border border-border/50 rounded-2xl px-6 py-4">
        <p className="text-lg text-foreground">{query}</p>
      </div>

      <div className="bg-secondary/70 backdrop-blur-sm border border-border/50 rounded-2xl p-6 space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className="grid grid-cols-2 gap-4 pb-4 border-b border-border/30 last:border-0 last:pb-0"
          >
            <div className="text-muted-foreground">{result.label}</div>
            <div className={result.isLink ? "text-accent" : "text-foreground"}>
              {result.value}
            </div>
          </div>
        ))}
        
        <div className="flex justify-end pt-2">
          <Button
            variant="ghost"
            size="lg"
            className="gap-2 text-foreground hover:text-accent hover:bg-accent/10"
          >
            <Mic className="h-5 w-5" />
            Ask again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatResult;
