import { useState } from "react";
import { X } from "lucide-react";
import hero1 from "../assets/hero-1.jpg";
import hero2 from "../assets/hero-2.jpg";
import hero3 from "../assets/hero-3.jpg";
import hero4 from "../assets/hero-4.jpg";
import hero5 from "../assets/hero-5.jpg";

type Foto = { src: string; alt: string };
const defaultFotos: Foto[] = [
  { src: hero1, alt: "Culto de adoração" },
  { src: hero2, alt: "Comunidade reunida" },
  { src: hero3, alt: "Louvor e adoração" },
  { src: hero4, alt: "Batismo" },
  { src: hero5, alt: "Ação social" },
  { src: hero1, alt: "Celebração" },
];

const Galeria = ({ fotos }: { fotos?: Foto[] }) => {
  const data = fotos && fotos.length ? fotos : defaultFotos;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <section id="galeria" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Momentos Especiais
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
            Nossa Galeria
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Confira os registros dos momentos mais especiais da nossa comunidade
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {data.map((foto, index) => (
            <div
              key={index}
              className={`relative overflow-hidden rounded-lg cursor-pointer group ${
                index === 0 ? "md:col-span-2 md:row-span-2" : ""
              }`}
              onClick={() => setSelectedImage(foto.src)}
            >
              <img
                src={foto.src}
                alt={foto.alt}
                className={`w-full object-cover transition-transform duration-300 group-hover:scale-110 ${
                  index === 0 ? "h-64 md:h-full" : "h-48 md:h-56"
                }`}
              />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                <span className="text-card font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  {foto.alt}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-foreground/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-card hover:text-primary transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={selectedImage}
            alt="Imagem ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </section>
  );
};

export default Galeria;
