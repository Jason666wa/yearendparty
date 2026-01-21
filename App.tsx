import React, { useState, useEffect } from 'react';
import { UserState, TableData } from './types';
import Table from './components/Table';
import FortuneModal from './components/FortuneModal';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [userState, setUserState] = useState<UserState>({
    isLoggedIn: false,
    name: '',
    foundSeat: null,
  });
  const [inputValue, setInputValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showFortune, setShowFortune] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isCardMinimized, setIsCardMinimized] = useState(false);

  // Fetch Tables on Mount
  useEffect(() => {
    fetch('/api/tables')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
            setTables(data);
        } else {
            console.error("Received invalid data format:", data);
            setTables([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load tables", err);
        setLoading(false);
      });
  }, []);

  const handleSaveTables = async (newTables: TableData[]) => {
    setTables(newTables);
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTables),
      });
      if (!res.ok) {
        throw new Error("Save failed");
      }
    } catch (err) {
      console.error("Failed to save tables", err);
      alert("保存失败，请检查网络");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setErrorMsg('请输入姓名');
      return;
    }

    let found = null;
    const trimmedName = inputValue.trim();

    for (const table of tables) {
      const seat = table.seats.find(s => s.attendeeName === trimmedName);
      if (seat) {
        found = {
          tableId: table.id,
          seatId: seat.id,
          tableName: table.name,
          seatNumber: seat.seatNumber,
        };
        break;
      }
    }

    if (found) {
      setUserState({
        isLoggedIn: true,
        name: trimmedName,
        foundSeat: found,
      });
      setErrorMsg('');
      setIsCardMinimized(false);
    } else {
      setErrorMsg('未找到该姓名，请尝试 "张三" 或 "Alice"');
    }
  };

  const handleReset = () => {
    setUserState({
      isLoggedIn: false,
      name: '',
      foundSeat: null,
    });
    setInputValue('');
    setShowFortune(false);
  };

  useEffect(() => {
    if (userState.foundSeat) {
      const element = document.getElementById(`table-${userState.foundSeat.tableId}`);
      if (element) {
        setTimeout(() => {
           element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }, 500); 
      }
    }
  }, [userState.foundSeat]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-festive-red">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-gray-800 pb-20 relative overflow-hidden flex flex-col">
      {isAdminMode ? (
        <AdminPanel 
          tables={tables} 
          setTables={setTables} 
          onSave={handleSaveTables}
          onClose={() => setIsAdminMode(false)} 
        />
      ) : (
        <>
          <header className="bg-festive-red text-white p-4 sticky top-0 z-40 shadow-md shrink-0">
            <div className="flex justify-between items-center max-w-md mx-auto">
              <h1 className="text-lg font-bold flex items-center gap-2">
                🧧 2025 Annual Meeting
              </h1>
              {userState.isLoggedIn && (
                <button 
                  onClick={handleReset}
                  className="text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30"
                >
                  退出
                </button>
              )}
            </div>
          </header>

          <main className="flex-1 relative flex flex-col overflow-hidden">
            {!userState.isLoggedIn ? (
              <div className="overflow-auto flex-1">
                <div className="max-w-md mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
                  <div className="bg-white p-8 rounded-2xl shadow-xl w-full border-t-4 border-festive-red">
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                        🎉
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">欢迎参加年会</h2>
                      <p className="text-gray-500 text-sm mt-2">输入姓名查询您的座位</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          您的姓名 / Name
                        </label>
                        <input
                          id="name"
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="例如: 张三"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-festive-red focus:border-festive-red outline-none transition-all text-lg"
                        />
                        {errorMsg && <p className="text-red-500 text-sm mt-2 animate-pulse">{errorMsg}</p>}
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-festive-red text-white font-bold py-3 rounded-lg shadow-lg hover:bg-deep-red transition-all transform active:scale-95"
                      >
                        🔍 查询座位
                      </button>
                    </form>
                    
                    <div className="mt-8 pt-4 border-t text-center">
                      <button 
                        onClick={() => setIsAdminMode(true)}
                        className="text-[10px] text-gray-300 hover:text-gray-500"
                      >
                        管理员入口 (Admin)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col animate-slide-up">
                <div className="bg-stone-50 p-4 z-30 shadow-sm shrink-0">
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border-l-4 border-festive-gold overflow-hidden transition-all duration-300">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-gray-500 text-xs uppercase tracking-wide flex items-center gap-2">
                             Welcome
                             <button 
                               onClick={() => setIsCardMinimized(!isCardMinimized)}
                               className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full px-2 py-0.5 text-[10px]"
                             >
                               {isCardMinimized ? '展开' : '收起'}
                             </button>
                          </p>
                          <h2 className="text-xl font-bold text-gray-900">{userState.name}</h2>
                          <p className="text-festive-red font-medium mt-1">
                            📍 {userState.foundSeat?.tableName}
                          </p>
                        </div>
                        <div className="text-right pl-4">
                          <div className="text-3xl font-bold text-festive-gold">{userState.foundSeat?.seatNumber}</div>
                          <div className="text-[10px] text-gray-400">号座</div>
                        </div>
                      </div>
                      
                      {!isCardMinimized && (
                        <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
                          <button 
                            onClick={() => setShowFortune(true)}
                            className="w-full bg-gradient-to-r from-festive-gold to-yellow-500 text-red-900 font-bold py-2 rounded-lg shadow text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                          >
                            ✨ 生成我的2025新年签
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="overflow-auto flex-1 bg-stone-50 relative custom-scrollbar shadow-inner">
                   <div 
                      className="min-w-[1200px] min-h-[1200px] relative pb-20"
                      style={{ 
                        backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', 
                        backgroundSize: '24px 24px' 
                      }}
                   >
                    {tables.map((table) => (
                      <div 
                        key={table.id} 
                        id={`table-${table.id}`}
                        className="absolute transition-all duration-1000"
                        style={{ left: table.x, top: table.y }}
                      >
                        <Table 
                            data={table} 
                            highlightedSeatId={userState.foundSeat?.tableId === table.id ? userState.foundSeat.seatId : null}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>

          {!userState.isLoggedIn && (
            <footer className="fixed bottom-0 w-full bg-white border-t p-3 text-center text-xs text-gray-400">
              © 2025 Company Annual Meeting
            </footer>
          )}

          {showFortune && userState.foundSeat && (
            <FortuneModal 
              name={userState.name} 
              tableName={userState.foundSeat.tableName}
              onClose={() => setShowFortune(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
