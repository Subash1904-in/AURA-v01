import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const posters = [
  {
    title: "Welcome to Campus AI",
    subtitle: "Your intelligent campus assistant",
  },
  {
    title: "Ask About Classes",
    subtitle: "Schedule, locations, and professor info",
  },
  {
    title: "Campus Resources",
    subtitle: "Libraries, labs, and study spaces",
  },
  {
    title: "Events & Activities",
    subtitle: "Stay updated with campus life",
  },
];

const PosterCarousel = () => {
  const [api, setApi] = useState<any>();

  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [api]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {posters.map((poster, index) => (
            <CarouselItem key={index}>
              <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-fade-in">
                <h2 className="text-5xl font-bold text-foreground text-center">
                  {poster.title}
                </h2>
                <p className="text-2xl text-muted-foreground text-center">
                  {poster.subtitle}
                </p>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default PosterCarousel;
