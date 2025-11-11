import Icon from './Icon';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-8 max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[#0288D1]">Cerrar Sesión</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-8">
          ¿Estás seguro que deseas cerrar sesión?
        </p>
        
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-600 rounded-2xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Icon name="log-out" className="w-4 h-4" />
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}