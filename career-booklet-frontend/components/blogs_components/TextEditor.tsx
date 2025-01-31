'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import 'react-quill-new/dist/quill.snow.css';
import 'react-quill-new/dist/quill.bubble.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const modules = {
  toolbar: [
    [{ 'font': [] }],
    [{ 'size': ['small', 'medium', 'large', 'huge'] }],
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'color': [] }, { 'background': [] }],
    ['link', 'image', 'video', 'formula'],
    ['clean']
  ],
  clipboard: {
    matchVisual: false,
  }
};

const formats = [
  'font', 'size', 'header',
  'bold', 'italic', 'underline', 'strike',
  'list',
  'script', 'indent', 'align',
  'blockquote', 'code-block',
  'color', 'background',
  'link', 'image', 'video', 'formula',
];

const TextEditor = ({ value, onChange }: { value: string; onChange: (content: string) => void }) => {
  const [isClient, setIsClient] = useState(false);
  const { theme } = useTheme();
  const quillRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleImageInsert = (imageUrl: string) => {
    const quill = quillRef.current.getEditor();
    const range = quill.getSelection();
    if (range) {
      quill.insertEmbed(range.index, 'image', imageUrl);
      quill.setSelection(range.index + 1);
    }
  };

  if (!isClient) return null;

  return (
    <div className={`quill-container ${theme === 'dark' ? 'dark' : ''}`}>
      <ReactQuill
        ref={quillRef}
        theme={theme === 'dark' ? 'bubble' : 'snow'}
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
      />
      <button onClick={() => handleImageInsert('https://your-image-url.com')}>
      </button>
    </div>
  );
};

export default TextEditor;
