USE library;

INSERT INTO AUTHOR (author_id, name, country) VALUES
  (1, 'Naguib Mahfouz',  'Egypt'),
  (2, 'George Orwell',   'United Kingdom'),
  (3, 'Agatha Christie', 'United Kingdom'),
  (4, 'Paulo Coelho',    'Brazil');

INSERT INTO BOOK (book_id, title, price, author_id) VALUES
  (1, 'Palace Walk',                     220.00, 1),
  (2, 'Children of the Alley',           185.50, 1),
  (3, 'The Thief and the Dogs',          140.00, 1),
  (4, '1984',                            175.00, 2),
  (5, 'Animal Farm',                     120.00, 2),
  (6, 'Murder on the Orient Express',    160.00, 3),
  (7, 'And Then There Were None',        150.00, 3),
  (8, 'The Alchemist',                   130.00, 4);
