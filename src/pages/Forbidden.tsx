import { useLocation } from "react-router-dom";

export default function Forbidden() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">403</h1>
        <p className="mb-4 text-xl text-muted-foreground">Acesso negado</p>
        <p className="mb-6 text-sm text-muted-foreground">Você não tem permissão para acessar: {location.pathname}</p>
        <a href="/dashboard" className="text-primary underline hover:text-primary/90">Voltar ao Dashboard</a>
      </div>
    </div>
  );
}
