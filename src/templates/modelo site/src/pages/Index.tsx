import Header from "@/components/Header";
import HeroCarousel from "@/components/HeroCarousel";
import Transmissoes from "@/components/Transmissoes";
import Agenda from "@/components/Agenda";
import Doacoes from "@/components/Doacoes";
import Galeria from "@/components/Galeria";
import DownloadApp from "@/components/DownloadApp";
import Sobre from "@/components/Sobre";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <HeroCarousel />
        <Transmissoes />
        <Agenda />
        <Doacoes />
        <Galeria />
        <DownloadApp />
        <Sobre />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
