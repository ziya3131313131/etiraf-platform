import { useState, useRef } from 'react';

export default function ImageUpload({ onImageSelect, currentImage = '', label = 'Şəkil/GIF Yüklə' }) {
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file', 'link'
  const [imageUrl, setImageUrl] = useState(currentImage);
  const [previewUrl, setPreviewUrl] = useState(currentImage);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // File seçimi (kompüter və telefon)
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Yoxla ki, şəkil və ya GIF olsun
    if (!file.type.startsWith('image/')) {
      alert('❌ Yalnız şəkil faylları yükləyə bilərsiniz!');
      return;
    }

    // Maksimum ölçü: 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('❌ Şəkil ölçüsü maksimum 5MB ola bilər!');
      return;
    }

    try {
      setLoading(true);

      // FileReader ilə preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        setPreviewUrl(base64);
        onImageSelect(base64);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Şəkil yüklənərkən xəta:', error);
      alert('❌ Şəkil yüklənərkən xəta baş verdi!');
    } finally {
      setLoading(false);
    }
  };

  // Link ilə yükləmə
  const handleLinkSubmit = () => {
    if (!imageUrl.trim()) {
      alert('❌ Link daxil edin!');
      return;
    }

    // URL validation
    try {
      new URL(imageUrl);
      setPreviewUrl(imageUrl);
      onImageSelect(imageUrl);
    } catch {
      alert('❌ Düzgün URL daxil edin!');
    }
  };

  // Sil
  const handleRemove = () => {
    setPreviewUrl('');
    setImageUrl('');
    onImageSelect('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload-container">
      <label className="image-upload-label">{label}</label>

      {/* Method Seçimi */}
      <div className="upload-method-tabs">
        <button
          type="button"
          className={uploadMethod === 'file' ? 'active' : ''}
          onClick={() => setUploadMethod('file')}
        >
          📁 Kompüter/Telefon
        </button>
        <button
          type="button"
          className={uploadMethod === 'link' ? 'active' : ''}
          onClick={() => setUploadMethod('link')}
        >
          🔗 Link
        </button>
      </div>

      {/* File Upload */}
      {uploadMethod === 'file' && (
        <div className="upload-file-area">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-input"
          />
          <label htmlFor="file-input" className="upload-file-btn">
            {loading ? (
              <div className="upload-loading">
                <div className="spinner"></div>
                <span>Yüklənir...</span>
              </div>
            ) : (
              <>
                <div className="upload-icon">📸</div>
                <div className="upload-text">
                  <strong>Şəkil seçin</strong>
                  <span>və ya buraya sürüyün</span>
                </div>
                <div className="upload-hint">
                  JPG, PNG, GIF • Maksimum 5MB
                </div>
              </>
            )}
          </label>
        </div>
      )}

      {/* Link Upload */}
      {uploadMethod === 'link' && (
        <div className="upload-link-area">
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="upload-link-input"
          />
          <button
            type="button"
            onClick={handleLinkSubmit}
            className="upload-link-btn"
          >
            ✓ Tətbiq et
          </button>
        </div>
      )}

      {/* Preview */}
      {previewUrl && (
        <div className="upload-preview">
          <div className="preview-header">
            <span>Önizləmə:</span>
            <button
              type="button"
              onClick={handleRemove}
              className="preview-remove-btn"
            >
              🗑️ Sil
            </button>
          </div>
          <div className="preview-image-container">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="preview-image"
              onError={() => {
                alert('❌ Şəkil yüklənmədi. Link düzgün deyil!');
                handleRemove();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
