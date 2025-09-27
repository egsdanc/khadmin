import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon, UploadIcon, XIcon, CheckIcon, EditIcon, TrashIcon, SearchIcon, SortAscIcon, SortDescIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);

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
        showNotification('error', t('file-size-too-large'));
        return;
      }

      // Dosya türü kontrolü
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showNotification('error', t('unsupported-file-format'));
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
        throw new Error(t('error-loading-blogs'));
      }
      const data = await response.json();
      setBlogs(data);
    } catch (error) {
      showNotification('error', t('error-loading-blogs'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showNotification('error', t('please-enter-blog-title'));
      return;
    }

    if (!content.trim()) {
      showNotification('error', t('please-enter-blog-content'));
      return;
    }

    if (!imageFile && !editingBlog) {
      showNotification('error', t('please-select-cover-photo'));
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
        showNotification('error', t('invalid-server-response'));
        setIsSubmitting(false);
        return;
      }

      const result = await response.json();

      if (response.ok) {
        showNotification('success', editingBlog
          ? t('blog-successfully-updated')
          : t('blog-successfully-added'));

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
        showNotification('error', t('network-error'));
      } else if (error instanceof SyntaxError) {
        showNotification('error', t('invalid-server-response'));
      } else {
        showNotification('error', t('unexpected-error'));
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

  const filteredAndSortedBlogs = blogs
    .filter(blog =>
      blog.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'asc'
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

  const handleDelete = async (blog: Blog) => {
    setBlogToDelete(blog);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!blogToDelete) return;

    try {
      const response = await fetch(`/api/blogs/${blogToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(t('error-deleting-blog'));
      }

      showNotification('success', t('blog-successfully-deleted'));
      fetchBlogs(); // Refresh the list
    } catch (error) {
      showNotification('error', t('error-deleting-blog'));
    } finally {
      setDeleteDialogOpen(false);
      setBlogToDelete(null);
    }
  };

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
          {editingBlog ? t('edit-blog') : t('add-blog')}
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add">{t('add-edit-blog')}</TabsTrigger>
          <TabsTrigger value="list">{t('blog-list')}</TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingBlog ? t('edit-blog') : t('new-blog-entry')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label htmlFor="title" className="block mb-2 font-medium">
                    {t('blog-title')}
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('enter-blog-title')}
                    required
                  />
                </div>

                <div className="quill-editor-container">
                  <label className="block mb-2 font-medium">
                    {t('content')}
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
                    {t('cover-photo')}
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
                        {t('select-photo')}
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
                    {isSubmitting ? t('saving') : (editingBlog ? t('update') : t('save'))}
                  </Button>
                  {editingBlog && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="flex-1"
                    >
                      {t('cancel')}
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
              <CardTitle>{t('blog-list')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search and Sort Controls */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder={t('search-by-blog-title')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center"
                  >
                    {sortOrder === 'asc' ? (
                      <SortAscIcon className="w-4 h-4 mr-2" />
                    ) : (
                      <SortDescIcon className="w-4 h-4 mr-2" />
                    )}
                    {sortOrder === 'asc' ? t('oldest') : t('newest')}
                  </Button>
                </div>

                {/* Blog List */}
                <div className="space-y-4">
                  {filteredAndSortedBlogs.map((blog) => (
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
                        <div className="mt-2 flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(blog)}
                          >
                            <EditIcon className="w-4 h-4 mr-1" />
                            {t('edit')}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(blog)}
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            {t('delete')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete-blog')}</AlertDialogTitle>
            <AlertDialogDescription>
              "{blogToDelete?.title}" {t('are-you-sure-delete-blog')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}