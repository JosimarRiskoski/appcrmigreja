import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero1 from "../assets/hero-1.jpg";
import hero2 from "../assets/hero-2.jpg";
import hero3 from "../assets/hero-3.jpg";
import hero4 from "../assets/hero-4.jpg";
import hero5 from "../assets/hero-5.jpg";

const defaultSlides = [
  {
    image: hero1,
    title: "Bem-vindo à Igreja Vida Nova",
    subtitle: "Um lugar de fé, esperança e amor",
    cta: "Conheça Nossa Igreja",
  },
  {
    image: hero2,
    title: "Você é Importante Para Nós",
    subtitle: "Aqui sua família encontra acolhimento e comunhão",
    cta: "Faça Parte",
  },
  {
    image: hero3,
    title: "Cultos e Eventos",
    subtitle: "Momentos de adoração e celebração da fé",
    cta: "Ver Programação",
  },
  {
    image: hero4,
    title: "Batismo e Renovação",
    subtitle: "Um novo começo através da fé em Cristo",
    cta: "Saiba Mais",
  },
  {
    image: hero5,
    title: "Servindo a Comunidade",
    subtitle: "Juntos fazemos a diferença na vida das pessoas",
    cta: "Seja Voluntário",
  },
];

type Slide = { image: string; title: string; subtitle: string; cta: string };

const HeroCarousel = ({ slides }: { slides?: Slide[] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const data = slides && slides.length ? slides : defaultSlides;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % data.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + data.length) % data.length);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % data.length);

  return (
    <section id="inicio" className="relative h-[85vh] min-h-[600px] overflow-hidden">
      {data.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4 max-w-4xl">
              <h1 className="text-4xl md:text-6xl font-bold text-card mb-4 drop-shadow-lg">
                {slide.title}
              </h1>
              <p className="text-lg md:text-2xl text-card/90 mb-8 drop-shadow-md">
                {slide.subtitle}
              </p>
              <Button size="lg" className="text-lg px-8 py-6">
                {slide.cta}
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-card/20 hover:bg-card/40 backdrop-blur-sm rounded-full p-3 transition-colors"
      >
        <ChevronLeft className="h-6 w-6 text-card" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-card/20 hover:bg-card/40 backdrop-blur-sm rounded-full p-3 transition-colors"
      >
        <ChevronRight className="h-6 w-6 text-card" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {data.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? "bg-primary w-8" : "bg-card/50 hover:bg-card/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
