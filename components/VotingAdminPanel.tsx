import React, { useState, useEffect } from 'react';
import { VotingStatus, PhotoData } from '../types';

interface VotingAdminPanelProps {
  onClose: () => void;
}

const VotingAdminPanel: React.FC<VotingAdminPanelProps> = ({ onClose }) => {
  const [votingStatus, setVotingStatus] = useState<VotingStatus>({
    votingEnabled: true,
    votingStopped: false,
  });
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statusRes, photosRes] = await Promise.all([
        fetch('/api/voting/status'),
        fetch('/api/photos'),
      ]);

      if (!statusRes.ok || !photosRes.ok) {
        throw new Error('获取数据失败');
      }

      const status = await statusRes.json();
      const photosData = await photosRes.json();

      setVotingStatus(status);
      setPhotos(photosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (updates: Partial<VotingStatus>) => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/voting/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...votingStatus,
          ...updates,
        }),
      });

      if (!response.ok) {
        throw new Error('更新失败');
      }

      const newStatus = await response.json();
      setVotingStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 按票数排序
  const sortedPhotos = [...photos].sort((a, b) => b.voteCount - a.voteCount);
  const topPhotos = sortedPhotos.slice(0, 10);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-festive-red">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          🎯 投票管理
        </h2>
        <button
          onClick={onClose}
          className="bg-gray-800 text-white text-xs px-3 py-2 rounded shadow hover:bg-gray-900 transition-colors"
        >
          关闭
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 投票状态控制 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">投票状态控制</h3>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">开启投票</div>
                  <div className="text-sm text-gray-500">允许用户进行投票</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={votingStatus.votingEnabled}
                    onChange={(e) => handleUpdateStatus({ votingEnabled: e.target.checked })}
                    disabled={saving}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-festive-red/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-festive-red"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">停止投票并开始统计</div>
                  <div className="text-sm text-gray-500">停止新投票，开始统计结果</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={votingStatus.votingStopped}
                    onChange={(e) => handleUpdateStatus({ votingStopped: e.target.checked })}
                    disabled={saving}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-festive-red/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-festive-red"></div>
                </label>
              </div>
            </div>

            {saving && (
              <div className="mt-4 text-sm text-gray-500">保存中...</div>
            )}
          </div>

          {/* 投票统计 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">投票统计</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{photos.length}</div>
                <div className="text-sm text-gray-600">总照片数</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {photos.reduce((sum, p) => sum + p.voteCount, 0)}
                </div>
                <div className="text-sm text-gray-600">总票数</div>
              </div>
            </div>

            {topPhotos.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Top 10 照片</h4>
                <div className="space-y-2">
                  {topPhotos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {photo.originalFilename}
                        </div>
                        <div className="text-xs text-gray-500">
                          {photo.voteCount} 票
                        </div>
                      </div>
                      <div className="w-16 h-16 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src={photo.imageUrl || photo.filePath}
                          alt={photo.originalFilename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingAdminPanel;
