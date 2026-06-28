import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import BookPage from './pages/BookPage';
import ReviewPage from './pages/ReviewPage';
import LaoziViewPage from './pages/LaoziViewPage';
import { BOOKS } from './data/book';

export default function App() {
  if (BOOKS.length === 0) return null;
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to={`/${BOOKS[0].id}`} replace />} />
        {/* Recitation / review mode — Laozi only */}
        <Route path="/laozi-review" element={<ReviewPage />} />
        <Route path="/laozi-view" element={<Navigate to="/laozi-view/default" replace />} />
        <Route path="/laozi-view/:referenceId" element={<LaoziViewPage />} />
        {BOOKS.map(book => (
          <React.Fragment key={book.id}>
            <Route path={`/${book.id}/:chapterId?`} element={<BookPage bookId={book.id} />} />
          </React.Fragment>
        ))}
      </Routes>
    </HashRouter>
  );
}

