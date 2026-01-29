import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Youtube } from "lucide-react";

const defaultHorarios = [
  { dia: "Domingo", hora: "10h e 18h" },
  { dia: "Quarta-feira", hora: "19h30" },
  { dia: "Sexta-feira", hora: "20h (Jovens)" },
];
const defaultContato = {
  endereco: "Rua das Flores, 123\nCentro - São Paulo, SP\nCEP: 01234-567",
  telefone: "(11) 9999-9999",
  email: "contato@igrejavidanova.com.br",
};

const Footer = ({ churchName, description, horarios, contato }: { churchName?: string; description?: string; horarios?: { dia: string; hora: string }[]; contato?: { endereco: string; telefone: string; email: string } }) => {
  const horariosData = horarios && horarios.length ? horarios : defaultHorarios;
  const contatoData = contato || defaultContato;
  return (
    <footer id="contato" className="bg-foreground text-card">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Logo e Descrição */}
          <div>
            <h3 className="text-2xl font-bold text-primary mb-4">{churchName || "Igreja Vida Nova"}</h3>
            <p className="text-card/70 mb-6">
              {description || "Uma igreja que acolhe, ensina e transforma vidas através do amor de Cristo."}
            </p>
            <div className="flex gap-4">
              <a href="#" className="bg-card/10 hover:bg-primary p-2 rounded-lg transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="bg-card/10 hover:bg-primary p-2 rounded-lg transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="bg-card/10 hover:bg-primary p-2 rounded-lg transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="font-bold text-lg mb-4">Links Rápidos</h4>
            <ul className="space-y-3">
              <li>
                <a href="#sobre" className="text-card/70 hover:text-primary transition-colors">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="#agenda" className="text-card/70 hover:text-primary transition-colors">
                  Agenda
                </a>
              </li>
              <li>
                <a href="#transmissoes" className="text-card/70 hover:text-primary transition-colors">
                  Transmissões
                </a>
              </li>
              <li>
                <a href="#doacoes" className="text-card/70 hover:text-primary transition-colors">
                  Doações
                </a>
              </li>
              <li>
                <a href="#app" className="text-card/70 hover:text-primary transition-colors">
                  Baixe o App
                </a>
              </li>
            </ul>
          </div>

          {/* Horários */}
          <div>
            <h4 className="font-bold text-lg mb-4">Horários dos Cultos</h4>
            <ul className="space-y-3">
              {horariosData.map((h, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{h.dia}</p>
                    <p className="text-card/70 text-sm">{h.hora}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-bold text-lg mb-4">Contato</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <p className="text-card/70 text-sm" dangerouslySetInnerHTML={{ __html: contatoData.endereco.replace(/\n/g, "<br />") }} />
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <a href={`tel:${contatoData.telefone}`} className="text-card/70 hover:text-primary transition-colors text-sm">
                  {contatoData.telefone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <a href={`mailto:${contatoData.email}`} className="text-card/70 hover:text-primary transition-colors text-sm">
                  {contatoData.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-card/10">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-card/50 text-sm">
            © {new Date().getFullYear()} Igreja Vida Nova. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;