import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon, UploadIcon, XIcon, CheckIcon, EditIcon, TrashIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface Blog {
  id: number;
  title: string;
  content: string;
  cover_image: string;
  created_at: string;
}

export default function BlogEklePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [activeTab, setActiveTab] = useState('add');
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

  // Fetch blogs on component mount
  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await fetch('/api/blogs');
      if (!response.ok) {
        throw new Error('Bloglar yüklenirken bir hata oluştu');
      }
      const data = await response.json();
      setBlogs(data);
    } catch (error) {
      showNotification('error', 'Bloglar yüklenirken bir hata oluştu');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      showNotification('error', 'Lütfen blog başlığını girin.');
      return;
    }
  
    if (!content.trim()) {
      showNotification('error', 'Lütfen blog içeriğini girin.');
      return;
    }
  
    if (!imageFile && !editingBlog) {
      showNotification('error', 'Lütfen bir kapak fotoğrafı seçin.');
      return;
    }
  
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (imageFile) {
      formData.append('coverImage', imageFile);
    }
  
    setIsSubmitting(true);
  
    try {
      const url = editingBlog 
        ? `/api/blogs/${editingBlog.id}`
        : '/api/blogs';
      
      const method = editingBlog ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formData
      });
  
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
        showNotification('success', editingBlog 
          ? 'Blog başarıyla güncellendi!'
          : 'Blog başarıyla eklendi!');
        
        // Reset form
        setTitle('');
        setContent('');
        setImageFile(null);
        setImagePreview(null);
        setEditingBlog(null);
        
        // Reset Quill editor
        if (quillRef.current) {
          quillRef.current.getEditor().setText('');
        }

        // Refresh blog list
        fetchBlogs();
      } else {
        showNotification('error', result.message || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Detaylı hata:', error);
      
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

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setTitle(blog.title);
    setContent(blog.content);
    setImagePreview(blog.cover_image ? `/${blog.cover_image}` : null);
    setImageFile(null);
    setActiveTab('add');
  };

  const handleCancelEdit = () => {
    setEditingBlog(null);
    setTitle('');
    setContent('');
    setImagePreview(null);
    setImageFile(null);
    if (quillRef.current) {
      quillRef.current.getEditor().setText('');
    }
  };

  // Add custom CSS for Quill
  // This is important to fix the overlap issue
  useEffect(() => {
    // Add custom styling to prevent Quill from overlapping with other elements
    const style = document.createElement('style');
    style.innerHTML = `
      .quill-editor-container {
        position: relative;
        margin-bottom: 150px; /* Extra space for the toolbar */
      }
      .quill-editor-container .ql-container {
        height: 384px; /* Same as h-96 */
      }
      .quill-editor-container .ql-toolbar {
        position: sticky;
        top: 0;
        z-index: 10;
        background: white;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto relative">
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
        <h1 className="text-3xl font-bold tracking-tight mb-4">
          {editingBlog ? 'Blog Düzenle' : 'Blog Ekle'}
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add">Blog Ekle/Düzenle</TabsTrigger>
          <TabsTrigger value="list">Blog Listesi</TabsTrigger>
        </TabsList>
        
        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingBlog ? 'Blog Düzenle' : 'Yeni Blog Girişi'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
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

                <div className="quill-editor-container">
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
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Kapak Fotoğrafı
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="relative w-32 h-32 border-2 border-dashed rounded-lg overflow-hidden">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="image"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <UploadIcon className="w-4 h-4 mr-2" />
                        Fotoğraf Seç
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Kaydediliyor...' : (editingBlog ? 'Güncelle' : 'Kaydet')}
                  </Button>
                  {editingBlog && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="flex-1"
                    >
                      İptal
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Blog Listesi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blogs.map((blog) => (
                  <div
                    key={blog.id}
                    className="border rounded-lg p-4 flex items-start space-x-4"
                  >
                    <div className="w-32 h-32 flex-shrink-0">
                      <img
                        src={blog.cover_image ? `/${blog.cover_image}` : '/placeholder.jpg'}
                        alt={blog.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{blog.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(blog.created_at).toLocaleDateString('tr-TR')}
                      </p>
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(blog)}
                          className="mr-2"
                        >
                          <EditIcon className="w-4 h-4 mr-1" />
                          Düzenle
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}