import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon, UploadIcon, XIcon, CheckIcon } from 'lucide-react';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'align': [] }],
    ['link', 'image', 'video'],
    ['clean']
  ],
  clipboard: {
    matchVisual: false,
  }
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'script',
  'indent',
  'direction',
  'color', 'background',
  'font',
  'align',
  'link', 'image', 'video'
];

export default function BlogEklePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const quillRef = useRef<ReactQuill>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (notification) {
      timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [notification]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Dosya boyutu kontrolü (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'Dosya boyutu 5MB\'dan büyük olamaz.');
        return;
      }

      // Dosya türü kontrolü
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showNotification('error', 'Sadece JPEG, PNG, GIF ve WebP formatları desteklenir.');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation checks
    if (!title.trim()) {
      showNotification('error', 'Lütfen blog başlığını girin.');
      return;
    }
  
    if (!content.trim()) {
      showNotification('error', 'Lütfen blog içeriğini girin.');
      return;
    }
  
    if (!imageFile) {
      showNotification('error', 'Lütfen bir kapak fotoğrafı seçin.');
      return;
    }
  
    // Create FormData here
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('coverImage', imageFile);
  
    setIsSubmitting(true);
  
    try {
      const response = await fetch('/api/blogs', {
        method: 'POST',
        body: formData
      });
  
      // Log full response for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
  
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        showNotification('error', 'Sunucudan geçersiz yanıt alındı');
        setIsSubmitting(false);
        return;
      }
  
      const result = await response.json();
  
      if (response.ok) {
        showNotification('success', 'Blog başarıyla eklendi!');
        
        // Reset form
        setTitle('');
        setContent('');
        setImageFile(null);
        setImagePreview(null);
        
        // Reset Quill editor if using ref
        if (quillRef.current) {
          quillRef.current.getEditor().setText('');
        }
      } else {
        showNotification('error', result.message || 'Blog eklenemedi');
      }
    } catch (error) {
      console.error('Detaylı hata:', error);
      
      // More specific error handling
      if (error instanceof TypeError) {
        showNotification('error', 'Ağ hatası. Bağlantınızı kontrol edin.');
      } else if (error instanceof SyntaxError) {
        showNotification('error', 'Sunucudan geçersiz yanıt alındı');
      } else {
        showNotification('error', 'Beklenmedik bir hata oluştu');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto relative">
      {/* Bildirim */}
      {notification && (
        <div
          className={`
            fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center 
            ${notification.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'}
          `}
        >
          {notification.type === 'success' ? (
            <CheckIcon className="mr-2 w-5 h-5" />
          ) : (
            <XIcon className="mr-2 w-5 h-5" />
          )}
          {notification.message}
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Blog Ekle</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Blog Girişi</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block mb-2 font-medium">
                Blog Başlığı
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Blog başlığını giriniz"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                İçerik
              </label>
              <ReactQuill
                ref={quillRef}
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                theme="snow"
                placeholder="Blog içeriğinizi buraya yazın..."
                className="h-96"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Kapak Fotoğrafı
              </label>
              <input
                type="file"
                id="coverImage"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="coverImage"
                className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Önizleme"
                    className="max-h-48 object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                    <p className="text-gray-500">
                      Fotoğraf yüklemek için tıklayın (maks. 5MB)
                    </p>
                  </>
                )}
              </label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!title || !content || !imageFile || isSubmitting}
            >
              <UploadIcon className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Gönderiliyor...' : 'Blogu Yayınla'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}