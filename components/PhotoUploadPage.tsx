import React, { useState, useRef } from 'react';

interface PhotoUploadPageProps {
  onUploadSuccess?: () => void;
}

const PhotoUploadPage: React.FC<PhotoUploadPageProps> = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('只支持上传图片文件 (jpeg, jpg, png, gif, webp)');
        return;
      }

      // 验证文件大小（10MB）
      if (file.size > 10 * 1024 * 1024) {
        setError('文件大小不能超过 10MB');
        return;
      }

      setSelectedFile(file);
      setError('');
      setSuccess(false);

      // 创建预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('请选择要上传的照片');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '上传失败');
      }

      setSuccess(true);
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // 2秒后调用成功回调
      setTimeout(() => {
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border-t-4 border-festive-red">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
            📸
          </div>
          <h2 className="text-2xl font-bold text-gray-800">上传照片</h2>
          <p className="text-gray-500 text-sm mt-2">分享您的精彩瞬间</p>
        </div>

        <div className="space-y-6">
          {/* 文件选择区域 */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!preview ? (
              <div
                onClick={handleClickUpload}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-festive-red transition-colors"
              >
                <div className="text-4xl mb-2">📷</div>
                <p className="text-gray-600 mb-1">点击选择照片</p>
                <p className="text-gray-400 text-xs">支持 JPG、PNG、GIF、WEBP，最大 10MB</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                  <img
                    src={preview}
                    alt="预览"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
                <button
                  onClick={handleClickUpload}
                  className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  重新选择
                </button>
              </div>
            )}
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 成功信息 */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              ✅ 上传成功！
            </div>
          )}

          {/* 上传按钮 */}
          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className={`w-full bg-festive-red text-white font-bold py-3 rounded-lg shadow-lg transition-all transform ${
                uploading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-deep-red active:scale-95'
              }`}
            >
              {uploading ? '上传中...' : '📤 上传照片'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadPage;
