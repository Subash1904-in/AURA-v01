import { ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

interface QuickActionButtonProps {
  text: string;
  onClick?: () => void;
}

const QuickActionButton = ({ text, onClick }: QuickActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      variant="secondary"
      className="group bg-secondary/70 backdrop-blur-sm border border-border/50 hover:bg-secondary hover:border-accent/50 transition-all duration-300 text-foreground px-6 py-6 h-auto"
    >
      {text}
      <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Button>
  );
};

export default QuickActionButton;
