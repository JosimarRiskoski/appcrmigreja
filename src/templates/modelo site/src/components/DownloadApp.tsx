import { Smartphone, Bell, Calendar, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const defaultRecursos = [
  { icon: "bell" as const, texto: "Notificações de cultos e eventos" },
  { icon: "calendar" as const, texto: "Agenda completa da igreja" },
  { icon: "book" as const, texto: "Devocional diário" },
];

const DownloadApp = ({ title, description, recursos }: { title?: string; description?: string; recursos?: { icon: "bell" | "calendar" | "book"; texto: string }[] }) => {
  return (
    <section id="app" className="py-20 bg-primary">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-primary-foreground">
            <span className="inline-flex items-center gap-2 bg-primary-foreground/20 px-4 py-2 rounded-full mb-6">
              <Smartphone className="h-5 w-5" />
              <span className="font-semibold text-sm">Nosso Aplicativo</span>
            </span>

            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {title || "Baixe nosso app e fique conectado!"}
            </h2>

            <p className="text-primary-foreground/80 text-lg mb-8">
              {description || "Tenha acesso a todas as novidades, eventos, transmissões ao vivo e muito mais diretamente no seu celular."}
            </p>

            <ul className="space-y-4 mb-8">
              {(recursos && recursos.length ? recursos : defaultRecursos).map((recurso, index) => {
                const icons = { bell: Bell, calendar: Calendar, book: BookOpen } as const;
                const Icon = icons[recurso.icon];
                return (
                  <li key={index} className="flex items-center gap-3">
                    <div className="bg-primary-foreground/20 p-2 rounded-lg">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span>{recurso.texto}</span>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                variant="secondary"
                className="gap-2"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 2.047c-.257-.035-.51-.047-.77-.047H7.247c-.26 0-.513.012-.77.047C3.75 2.387 1.5 4.77 1.5 7.755v8.49c0 2.985 2.25 5.368 4.977 5.708.257.035.51.047.77.047h9.506c.26 0 .513-.012.77-.047 2.727-.34 4.977-2.723 4.977-5.708v-8.49c0-2.985-2.25-5.368-4.977-5.708zM12 17.75c-3.176 0-5.75-2.574-5.75-5.75S8.824 6.25 12 6.25s5.75 2.574 5.75 5.75-2.574 5.75-5.75 5.75zm0-9.5c-2.067 0-3.75 1.683-3.75 3.75s1.683 3.75 3.75 3.75 3.75-1.683 3.75-3.75-1.683-3.75-3.75-3.75z"/>
                </svg>
                App Store
              </Button>
              <Button 
                size="lg" 
                variant="secondary"
                className="gap-2"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.5 12l2.198-2.491zM5.864 2.658L16.8 8.99l-2.302 2.303-8.635-8.635z"/>
                </svg>
                Google Play
              </Button>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="relative">
              <div className="w-64 h-[500px] bg-foreground rounded-[3rem] p-3 shadow-2xl">
                <div className="w-full h-full bg-card rounded-[2.5rem] overflow-hidden flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="w-20 h-20 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <span className="text-primary-foreground text-2xl font-bold">IV</span>
                    </div>
                    <h3 className="font-bold text-foreground text-lg">Igreja Vida Nova</h3>
                    <p className="text-muted-foreground text-sm mt-2">Conectados em Cristo</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/20 rounded-full blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/20 rounded-full blur-xl" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadApp;
