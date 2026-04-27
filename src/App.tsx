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
          <React.Fragment key={book.id}>
            <Route path={`/${book.id}/:chapterId?`} element={<BookPage key={book.id} bookId={book.id} />} />
          </React.Fragment>
        ))}
      </Routes>
    </HashRouter>
  );
}


