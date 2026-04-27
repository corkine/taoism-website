import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import BookPage from './pages/BookPage';
import { BOOKS } from './data/book';

export default function App() {
  if (BOOKS.length === 0) return null;
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to={`/${BOOKS[0].id}`} replace />} />
        {BOOKS.map(book => (
          <Route path={`/${book.id}`} element={<BookPage bookId={book.id} />} />
        ))}
      </Routes>
    </HashRouter>
  );
}


