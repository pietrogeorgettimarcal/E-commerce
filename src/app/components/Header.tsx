import React from 'react';
import { ShoppingBag, User, LogOut } from 'lucide-react';

interface HeaderProps {
  user: any;
  cartCount: number;
  onOpenAuth: () => void;
  onOpenCart: () => void;
  onSignOut: () => void;
}

export function Header({ user, cartCount, onOpenAuth, onOpenCart, onSignOut }: HeaderProps) {
  // Pega o nome do usuário vindo do Google ou o e-mail como alternativa
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email;
  // Pega a foto de perfil enviada pelo Google
  const userAvatar = user?.user_metadata?.avatar_url;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40 px-6">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        
        {/* Logotipo da Loja */}
        <div className="flex items-center space-x-2">
          <span 
            className="font-['Playfair_Display'] text-2xl font-semibold tracking-wider text-gray-900 cursor-pointer"
            onClick={() => window.location.href = '/'}
          >
            Georgetti Atelier
          </span>
        </div>

        {/* Botões de Ação (Carrinho e Perfil) */}
        <div className="flex items-center space-x-4">
          
          {/* Botão do Carrinho */}
          <button 
            onClick={onOpenCart}
            className="p-2 text-gray-600 hover:text-gray-900 relative rounded-full hover:bg-gray-50 transition"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {/* Área do Utilizador (Logado vs Não Logado) */}
          {user ? (
            <div className="flex items-center space-x-3 bg-gray-50 p-1 pr-3 rounded-full border border-gray-100">
              
              {/* Foto Real do Google ou Círculo com Letra Padrão */}
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt={userName} 
                  className="w-8 h-8 rounded-full object-cover border border-purple-200"
                  referrerPolicy="no-referrer" // Evita bloqueios de imagem do Google
                />
              ) : (
                <div className="w-8 h-8 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center justify-center uppercase">
                  {user.email?.charAt(0)}
                </div>
              )}

              {/* Nome do Cliente */}
              <span className="text-xs font-medium text-gray-700 max-w-[120px] truncate hidden sm:inline">
                {userName.split(' ')[0]} {/* Mostra apenas o primeiro nome */}
              </span>

              {/* Botão de Sair (Logout) */}
              <button 
                onClick={onSignOut}
                title="Sair da conta"
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-white transition"
              >
                <LogOut className="w-4 h-4" />
              </button>

            </div>
          ) : (
            /* Botão para abrir o Modal de Login */
            <button 
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 text-sm text-gray-600 hover:text-purple-700 font-medium px-3 py-1.5 rounded-lg hover:bg-purple-50 transition"
            >
              <User className="w-4 h-4" />
              <span>Entrar</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
}