import React, { useState } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

function ImageUploader() {
  const [selectedImage, setSelectedImage] = useState(null);
  
  const [previewUrl, setPreviewUrl] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setSelectedImage(null);
      setPreviewUrl('');
    }
  };

  return (
    <div className="mb-3">
      <div className="mb-3">
        <input 
          className="form-control" 
          type="file" 
          id="formFile"
          accept="image/*"
          onChange={handleImageChange}
        />
      </div>

      {previewUrl && (
        <div className="mb-3 text-center">
          <img 
            src={previewUrl} 
            alt="Предпросмотр" 
            className="img-fluid rounded" 
            style={{ maxWidth: '400px', maxHeight: '400px' }} 
          />
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
