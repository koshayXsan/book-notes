const express = require('express');
const bodyParser = require('body-parser');
const pg = require('pg');
const axios = require('axios');
const ejs = require('ejs');

const app = express();
const port = 3000;

const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'book_notes',
  password: '1234', // replace with your actual password
  port: 5432,
});

db.connect();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Fetch book covers using Open Library Covers API
app.get('/cover/:isbn', async (req, res) => {
  const isbn = req.params.isbn;
  try {
    const response = await axios.get(`https://covers.openlibrary.org/b/isbn/${isbn}-S.jpg`);
    res.redirect(response.config.url);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching cover');
  }
});

// Add a new book
app.post('/add', async (req, res) => {
  const { title, author, isbn, notes, rating, date_read } = req.body;
  try {
    const cover_url = `https://covers.openlibrary.org/b/isbn/${isbn}-S.jpg`;
    await db.query(
      'INSERT INTO books (title, author, cover_url, notes, rating, date_read) VALUES ($1, $2, $3, $4, $5, $6)',
      [title, author, cover_url, notes, rating, date_read]
    );
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error adding book');
  }
});

// Display all books
app.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM books ORDER BY date_read DESC');
    res.render('index', { books: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching books');
  }
});

// Update book details
app.post('/update', async (req, res) => {
  const { id, title, author, notes, rating, date_read } = req.body;
  try {
    await db.query(
      'UPDATE books SET title=$1, author=$2, notes=$3, rating=$4, date_read=$5 WHERE id=$6',
      [title, author, notes, rating, date_read, id]
    );
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating book');
  }
});

// Delete a book
app.post('/delete', async (req, res) => {
  const { id } = req.body;
  try {
    await db.query('DELETE FROM books WHERE id=$1', [id]);
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting book');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
