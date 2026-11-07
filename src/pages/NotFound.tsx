import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";

export default function NotFound() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-background-950 flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-8xl md:text-[10rem] font-black text-background-800 select-none pointer-events-none">
        404
      </h1>
      <div className="relative z-10 -mt-8">
        <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground-100 mt-4">
          Página não encontrada
        </h2>
        <p className="mt-2 text-sm text-foreground-500 font-mono">{location.pathname}</p>
        <p className="mt-4 text-sm text-foreground-600">
          A página que você procura não existe ou foi movida.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold cursor-pointer transition-colors whitespace-nowrap"
        >
          <i className="ri-home-line" />
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}