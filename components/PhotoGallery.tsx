import React, { useState, useEffect } from 'react';
import { PhotoData, VotingStatus } from '../types';

const PhotoGallery: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [votingStatus, setVotingStatus] = useState<VotingStatus>({
    votingEnabled: true,
    votingStopped: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [votingPhotoId, setVotingPhotoId] = useState<string | null>(null);

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos');
      if (!response.ok) throw new Error('获取照片列表失败');
      const data = await response.json();
      setPhotos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchVotingStatus = async () => {
    try {
      const response = await fetch('/api/voting/status');
      if (!response.ok) throw new Error('获取投票状态失败');
      const data = await response.json();
      setVotingStatus(data);
    } catch (err) {
      console.error('Failed to fetch voting status:', err);
    }
  };

  useEffect(() => {
    fetchPhotos();
    fetchVotingStatus();
    
    // 每5秒刷新一次照片列表（获取最新票数）
    const interval = setInterval(() => {
      fetchPhotos();
      fetchVotingStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleVote = async (photoId: string) => {
    if (votingPhotoId === photoId) return; // 防止重复点击
    
    if (!votingStatus.votingEnabled || votingStatus.votingStopped) {
      alert('投票已关闭');
      return;
    }

    const photo = photos.find(p => p.id === photoId);
    if (photo?.hasVoted) {
      alert('您已经投过票了');
      return;
    }

    setVotingPhotoId(photoId);
    try {
      const response = await fetch(`/api/photos/${photoId}/vote`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '投票失败');
      }

      // 更新本地状态
      setPhotos(prev => prev.map(p => {
        if (p.id === photoId) {
          return {
            ...p,
            voteCount: p.voteCount + 1,
            hasVoted: true,
          };
        }
        return p;
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : '投票失败，请重试');
    } finally {
      setVotingPhotoId(null);
    }
  };

  // 按票数排序
  const sortedPhotos = [...photos].sort((a, b) => b.voteCount - a.voteCount);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-festive-red text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <header className="bg-festive-red text-white p-4 sticky top-0 z-40 shadow-md">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold flex items-center gap-2">
            📸 照片投票
          </h1>
          {votingStatus.votingStopped && (
            <p className="text-sm mt-1 bg-white/20 px-2 py-1 rounded inline-block">
              ⏸️ 投票已停止
            </p>
          )}
          {!votingStatus.votingEnabled && (
            <p className="text-sm mt-1 bg-white/20 px-2 py-1 rounded inline-block">
              🔒 投票已关闭
            </p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {photos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-gray-500 text-lg">还没有照片，快来上传第一张吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative"
              >
                {/* 排名徽章 */}
                {index < 3 && (
                  <div className={`absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                )}

                {/* 照片 */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  <img
                    src={photo.imageUrl || photo.filePath}
                    alt={photo.originalFilename}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23ddd" width="400" height="400"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3E图片加载失败%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>

                {/* 投票信息 */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-festive-red">
                        {photo.voteCount}
                      </span>
                      <span className="text-gray-500 text-sm">票</span>
                    </div>
                    {photo.hasVoted && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        ✓ 已投票
                      </span>
                    )}
                  </div>

                  {/* 投票按钮 */}
                  {votingStatus.votingEnabled && !votingStatus.votingStopped && !photo.hasVoted && (
                    <button
                      onClick={() => handleVote(photo.id)}
                      disabled={votingPhotoId === photo.id}
                      className={`w-full py-2 rounded-lg font-medium transition-all ${
                        votingPhotoId === photo.id
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-festive-red text-white hover:bg-deep-red active:scale-95'
                      }`}
                    >
                      {votingPhotoId === photo.id ? '投票中...' : '👍 投票'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PhotoGallery;
