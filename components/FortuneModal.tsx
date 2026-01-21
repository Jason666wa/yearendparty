import React, { useState, useEffect } from 'react';
import { generateFortune } from '../services/geminiService';

interface FortuneModalProps {
  name: string;
  tableName: string;
  onClose: () => void;
}

const FortuneModal: React.FC<FortuneModalProps> = ({ name, tableName, onClose }) => {
  const [fortune, setFortune] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchFortune = async () => {
      const result = await generateFortune(name, tableName);
      if (isMounted) {
        setFortune(result);
        setLoading(false);
      }
    };
    fetchFortune();
    return () => { isMounted = false; };
  }, [name, tableName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all scale-100">
        <div className="bg-festive-red p-6 text-center">
          <h3 className="text-festive-gold text-xl font-bold tracking-widest">✨ 2025 新年签 ✨</h3>
          <p className="text-white/80 text-sm mt-1">专属运势生成中...</p>
        </div>
        
        <div className="p-8 text-center min-h-[200px] flex flex-col items-center justify-center">
          {loading ? (
             <div className="flex flex-col items-center space-y-3">
               <div className="w-8 h-8 border-4 border-festive-red border-t-transparent rounded-full animate-spin"></div>
               <p className="text-gray-500 text-sm animate-pulse">Gemini 正在夜观天象...</p>
             </div>
          ) : (
            <div className="space-y-4 animate-fade-in-up">
              <p className="text-lg text-gray-800 font-medium leading-relaxed">
                "{fortune}"
              </p>
              <div className="pt-4">
                 <button 
                  onClick={onClose}
                  className="bg-festive-red text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-deep-red transition-colors"
                 >
                   收下祝福
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FortuneModal;
