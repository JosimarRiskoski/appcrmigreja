import Header from "./components/Header";
import HeroCarousel from "./components/HeroCarousel";
import Transmissoes from "./components/Transmissoes";
import Agenda from "./components/Agenda";
import Doacoes from "./components/Doacoes";
import Galeria from "./components/Galeria";
import DownloadApp from "./components/DownloadApp";
import Sobre from "./components/Sobre";
import Footer from "./components/Footer";

const Embedded = ({ siteTitle, navLinks, slides, sections, content, events, logoUrl }: { siteTitle?: string; navLinks?: { href: string; label: string }[]; slides?: { image: string; title: string; subtitle: string; cta: string }[]; sections?: { transmissoes?: boolean; agenda?: boolean; doacoes?: boolean; galeria?: boolean; downloadApp?: boolean; sobre?: boolean }; content?: { transmissoes?: { featuredId?: string; videos?: { id: string; title: string; description: string; duration: string }[] }; agenda?: { eventos?: { data: string; mes: string; titulo: string; horario: string; local: string; destaque: boolean }[] }; doacoes?: { title?: string; subtitle?: string; ctaText?: string; pixKey?: string; bankInfo?: { banco: string; agencia: string; conta: string; cnpj: string }; causas?: { icon?: "users" | "book" | "home"; titulo: string; descricao: string }[] }; galeria?: { fotos?: { src: string; alt: string }[] }; downloadApp?: { title?: string; description?: string; recursos?: { icon: "bell" | "calendar" | "book"; texto: string }[] }; sobre?: { title?: string; subtitle?: string; paragraphs?: string[]; stats?: { icon: "users" | "heart" | "book"; value: string; label: string }[] }; footer?: { horarios?: { dia: string; hora: string }[]; contato?: { endereco: string; telefone: string; email: string } } }; events?: { data: string; mes: string; titulo: string; horario: string; local: string; destaque: boolean }[]; logoUrl?: string }) => {
  const s = {
    transmissoes: sections?.transmissoes ?? true,
    agenda: sections?.agenda ?? true,
    doacoes: sections?.doacoes ?? true,
    galeria: sections?.galeria ?? true,
    downloadApp: sections?.downloadApp ?? true,
    sobre: sections?.sobre ?? true,
  };
  return (
    <div className="min-h-screen">
      <Header siteTitle={siteTitle} navLinks={navLinks} logoUrl={logoUrl} />
      <main className="pt-16">
        <HeroCarousel slides={slides} />
        {s.transmissoes && <Transmissoes videos={content?.transmissoes?.videos} featuredId={content?.transmissoes?.featuredId} />}
        {s.agenda && <Agenda eventos={(events && events.length ? events : content?.agenda?.eventos) || []} />}
        {s.doacoes && <Doacoes title={content?.doacoes?.title} subtitle={content?.doacoes?.subtitle} ctaText={content?.doacoes?.ctaText} pixKey={content?.doacoes?.pixKey} bankInfo={content?.doacoes?.bankInfo} causas={content?.doacoes?.causas} />}
        {s.galeria && <Galeria fotos={content?.galeria?.fotos} />}
        {s.downloadApp && <DownloadApp title={content?.downloadApp?.title} description={content?.downloadApp?.description} recursos={content?.downloadApp?.recursos} />}
        {s.sobre && <Sobre title={content?.sobre?.title} subtitle={content?.sobre?.subtitle} paragraphs={content?.sobre?.paragraphs} stats={content?.sobre?.stats} />}
      </main>
      <Footer churchName={siteTitle} horarios={content?.footer?.horarios} contato={content?.footer?.contato} />
    </div>
  );
};

export default Embedded;
