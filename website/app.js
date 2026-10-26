const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC));

function uploader(folder) {
  const dir = path.join(PUBLIC, 'uploads', folder);
  fs.mkdirSync(dir, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (req, file, cb) =>
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname).toLowerCase())
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => cb(null, /^image\/(png|jpe?g|gif|webp)$/.test(file.mimetype))
  });
}
const bookUpload = uploader('books');
const authorUpload = uploader('authors');

function removeFile(webPath) {
  if (!webPath) return;
  fs.unlink(path.join(PUBLIC, webPath), () => {});
}

function flash(res, type, text) {
  return `?msg=${encodeURIComponent(text)}&type=${type}`;
}

app.use((req, res, next) => {
  res.locals.msg = req.query.msg || null;
  res.locals.msgType = req.query.type || 'ok';
  res.locals.path = req.path;
  next();
});

// F2.1 show both tables
app.get('/', async (req, res, next) => {
  try {
    const [books] = await db.query('SELECT * FROM BOOK ORDER BY book_id');
    const [authors] = await db.query('SELECT * FROM AUTHOR ORDER BY author_id');
    res.render('index', { books, authors });
  } catch (e) { next(e); }
});

app.get('/books', async (req, res, next) => {
  try {
    const [books] = await db.query('SELECT * FROM BOOK ORDER BY book_id');
    const [authors] = await db.query('SELECT author_id, name FROM AUTHOR');
    const names = Object.fromEntries(authors.map(a => [a.author_id, a.name]));
    res.render('books', { books, names });
  } catch (e) { next(e); }
});

app.get('/authors', async (req, res, next) => {
  try {
    const [authors] = await db.query('SELECT * FROM AUTHOR ORDER BY author_id');
    res.render('authors', { authors });
  } catch (e) { next(e); }
});

// F2.2 add book
app.get('/books/new', async (req, res, next) => {
  try {
    const [authors] = await db.query('SELECT author_id, name FROM AUTHOR ORDER BY name');
    res.render('book-form', { book: null, authors });
  } catch (e) { next(e); }
});

app.post('/books/new', bookUpload.single('cover'), async (req, res) => {
  const { title, price, author_id } = req.body;
  const cover = req.file ? '/uploads/books/' + req.file.filename : null;
  try {
    await db.query('INSERT INTO BOOK (title, price, author_id, cover) VALUES (?, ?, ?, ?)',
      [title, price, author_id, cover]);
    res.redirect('/books' + flash(res, 'ok', `Book "${title}" added.`));
  } catch (e) {
    removeFile(cover);
    res.redirect('/books' + flash(res, 'err', 'Could not add book: ' + e.message));
  }
});

// F2.3 edit book
app.get('/books/:id/edit', async (req, res, next) => {
  try {
    const [[book]] = await db.query('SELECT * FROM BOOK WHERE book_id = ?', [req.params.id]);
    if (!book) return res.redirect('/books' + flash(res, 'err', 'Book not found.'));
    const [authors] = await db.query('SELECT author_id, name FROM AUTHOR ORDER BY name');
    res.render('book-form', { book, authors });
  } catch (e) { next(e); }
});

app.post('/books/:id/edit', bookUpload.single('cover'), async (req, res) => {
  const { title, price, author_id, remove_cover } = req.body;
  const id = req.params.id;
  try {
    const [[old]] = await db.query('SELECT cover FROM BOOK WHERE book_id = ?', [id]);
    let cover = old ? old.cover : null;
    if (req.file) { removeFile(cover); cover = '/uploads/books/' + req.file.filename; }
    else if (remove_cover) { removeFile(cover); cover = null; }
    await db.query('UPDATE BOOK SET title = ?, price = ?, author_id = ?, cover = ? WHERE book_id = ?',
      [title, price, author_id, cover, id]);
    res.redirect('/books' + flash(res, 'ok', `Book #${id} updated.`));
  } catch (e) {
    res.redirect('/books' + flash(res, 'err', 'Could not update book: ' + e.message));
  }
});

// F2.4 remove book
app.post('/books/:id/delete', async (req, res) => {
  try {
    const [[book]] = await db.query('SELECT cover FROM BOOK WHERE book_id = ?', [req.params.id]);
    await db.query('DELETE FROM BOOK WHERE book_id = ?', [req.params.id]);
    if (book) removeFile(book.cover);
    res.redirect('/books' + flash(res, 'ok', `Book #${req.params.id} removed.`));
  } catch (e) {
    res.redirect('/books' + flash(res, 'err', 'Could not remove book: ' + e.message));
  }
});

// F2.2 add author
app.get('/authors/new', (req, res) => res.render('author-form', { author: null }));

app.post('/authors/new', authorUpload.single('photo'), async (req, res) => {
  const { name, country } = req.body;
  const photo = req.file ? '/uploads/authors/' + req.file.filename : null;
  try {
    await db.query('INSERT INTO AUTHOR (name, country, photo) VALUES (?, ?, ?)', [name, country || null, photo]);
    res.redirect('/authors' + flash(res, 'ok', `Author "${name}" added.`));
  } catch (e) {
    removeFile(photo);
    res.redirect('/authors' + flash(res, 'err', 'Could not add author: ' + e.message));
  }
});

// F2.3 edit author
app.get('/authors/:id/edit', async (req, res, next) => {
  try {
    const [[author]] = await db.query('SELECT * FROM AUTHOR WHERE author_id = ?', [req.params.id]);
    if (!author) return res.redirect('/authors' + flash(res, 'err', 'Author not found.'));
    res.render('author-form', { author });
  } catch (e) { next(e); }
});

app.post('/authors/:id/edit', authorUpload.single('photo'), async (req, res) => {
  const { name, country, remove_photo } = req.body;
  const id = req.params.id;
  try {
    const [[old]] = await db.query('SELECT photo FROM AUTHOR WHERE author_id = ?', [id]);
    let photo = old ? old.photo : null;
    if (req.file) { removeFile(photo); photo = '/uploads/authors/' + req.file.filename; }
    else if (remove_photo) { removeFile(photo); photo = null; }
    await db.query('UPDATE AUTHOR SET name = ?, country = ?, photo = ? WHERE author_id = ?',
      [name, country || null, photo, id]);
    res.redirect('/authors' + flash(res, 'ok', `Author #${id} updated.`));
  } catch (e) {
    res.redirect('/authors' + flash(res, 'err', 'Could not update author: ' + e.message));
  }
});

// F2.5 remove author (books removed by ON DELETE CASCADE)
app.post('/authors/:id/delete', async (req, res) => {
  const id = req.params.id;
  try {
    const [[author]] = await db.query('SELECT photo FROM AUTHOR WHERE author_id = ?', [id]);
    const [covers] = await db.query('SELECT cover FROM BOOK WHERE author_id = ?', [id]);
    await db.query('DELETE FROM AUTHOR WHERE author_id = ?', [id]);
    if (author) removeFile(author.photo);
    covers.forEach(b => removeFile(b.cover));
    res.redirect('/authors' + flash(res, 'ok',
      `Author #${id} removed, together with ${covers.length} book(s).`));
  } catch (e) {
    res.redirect('/authors' + flash(res, 'err', 'Could not remove author: ' + e.message));
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { error: err });
});

app.listen(PORT, () => console.log(`Library website running at http://localhost:${PORT}`));
