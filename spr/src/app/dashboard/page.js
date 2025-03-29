'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PocketBase from 'pocketbase';

export default function Dashboard() {
  const serverUrl = 'http://192.168.2.9:8080';
  const pb = new PocketBase(serverUrl);
  const router = useRouter();
  
  const [books, setBooks] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [topBooks, setTopBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [newBook, setNewBook] = useState({
    tytul: '',
    autor: '',
    okladka: null,
    nastanie: '',
    opis: '',
    cena: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [editedBook, setEditedBook] = useState({
    tytul: '',
    autor: '',
    okladka: null,
    nastanie: '',
    opis: '',
    cena: ''
  });
  const [addStock, setAddStock] = useState(0);
  const [favorites, setFavorites] = useState([]);

  const isAdmin = () => {
    return userRole === 'admin' || userRole === 'sadmin';
  };

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push('/login');
      return;
    }

    const user = pb.authStore.model;
    if (user?.email) {
      setUserEmail(user.email);
      setUserRole(user.rola);
      fetchFavorites(user.email);
    }

    fetchBooks();
    fetchPurchases();
  }, [router]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const records = await pb.collection('ksiazki').getFullList();
      setBooks(records);
    } catch (err) {
    
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      const records = await pb.collection('kupione').getFullList();
      setPurchases(records);
    } catch (err) {
    }
  };

  const calculateTopBooks = () => {
    if (books.length === 0 || purchases.length === 0) return [];

    const bookSales = {};
    
    purchases.forEach(purchase => {
      if (!bookSales[purchase.id_book]) {
        bookSales[purchase.id_book] = 0;
      }
      bookSales[purchase.id_book] += purchase.ilosc;
    });

    const sortedBooks = Object.entries(bookSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => books.find(book => book.id === id))
      .filter(book => book !== undefined);

    return sortedBooks;
  };

  useEffect(() => {
    setTopBooks(calculateTopBooks());
  }, [books, purchases]);

  const fetchFavorites = async (email) => {
    try {
      const records = await pb.collection('polubione').getFullList({
        filter: `user="${email}"`
      });
      setFavorites(records);
    } catch (err) {

    }
  };

  const isFavorite = (bookId) => {
    return favorites.some(fav => fav.id_book === bookId);
  };

  const toggleFavorite = async (bookId, bookTitle) => {
    if (!userEmail) return;
    
    try {
      const existingFavorite = favorites.find(fav => fav.id_book === bookId);
      
      if (existingFavorite) {
        await pb.collection('polubione').delete(existingFavorite.id);
        setFavorites(favorites.filter(fav => fav.id !== existingFavorite.id));
      } else {
        const newFavorite = await pb.collection('polubione').create({
          user: userEmail,
          id_book: bookId,
          tytul: bookTitle
        });
        setFavorites([...favorites, newFavorite]);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      setError('Failed to update favorites');
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    router.push('/login');
  };

  const handleAddBook = async () => {
    try {
      const formData = new FormData();
      formData.append('tytul', newBook.tytul);
      formData.append('autor', newBook.autor);
      formData.append('nastanie', newBook.nastanie);
      formData.append('opis', newBook.opis);
      formData.append('cena', newBook.cena);
      if (newBook.okladka) {
        formData.append('okladka', newBook.okladka);
      }

      const createdBook = await pb.collection('ksiazki').create(formData);
      setShowAddForm(false);
      setNewBook({
        tytul: '',
        autor: '',
        okladka: null,
        nastanie: '',
        opis: '',
        cena: ''
      });
      setBooks([...books, createdBook]);
      fetchPurchases();
    } catch (err) {
      console.error('Failed to add book:', err);
      setError('Failed to add book');
    }
  };

  const handleFileChange = (e) => {
    setNewBook({...newBook, okladka: e.target.files[0]});
  };

  const handleEditFileChange = (e) => {
    setEditedBook({...editedBook, okladka: e.target.files[0]});
  };

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setQuantity(1);
    setEditedBook({
      tytul: book.tytul,
      autor: book.autor,
      okladka: null,
      nastanie: book.nastanie,
      opis: book.opis,
      cena: book.cena
    });
    setEditMode(false);
    setAddStock(0);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    const clampedValue = Math.max(1, Math.min(selectedBook.nastanie, value));
    setQuantity(clampedValue);
  };

  const handleBuy = async () => {
    if (!selectedBook || !userEmail) return;
    
    if (selectedBook.nastanie <= 0) {
      setError('Książka niedostępna');
      return;
    }

    if (quantity > selectedBook.nastanie) {
      setError('Niewystarczająca ilość w magazynie');
      return;
    }

    try {
      await pb.collection('kupione').create({
        user: userEmail,
        id_book: selectedBook.id,
        tytul: selectedBook.tytul,
        ilosc: quantity,
        data: new Date().toISOString()
      });

      const updatedBook = await pb.collection('ksiazki').update(selectedBook.id, {
        nastanie: selectedBook.nastanie - quantity
      });

      setSelectedBook(updatedBook);
      setBooks(books.map(book => 
        book.id === updatedBook.id ? updatedBook : book
      ));
      fetchPurchases();
      setError(null);
    } catch (err) {
      console.error('Failed to complete purchase:', err);
      setError('Failed to complete purchase');
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;
    
    if (confirm(`Czy na pewno chcesz usunąć książkę "${selectedBook.tytul}"?`)) {
      try {
        await pb.collection('ksiazki').delete(selectedBook.id);
        setBooks(books.filter(book => book.id !== selectedBook.id));
        setSelectedBook(null);
        fetchPurchases();
      } catch (err) {
        console.error('Failed to delete book:', err);
        setError('Failed to delete book');
      }
    }
  };

  const handleUpdateBook = async () => {
    if (!selectedBook) return;
    
    try {
      const formData = new FormData();
      formData.append('tytul', editedBook.tytul);
      formData.append('autor', editedBook.autor);
      formData.append('nastanie', editedBook.nastanie);
      formData.append('opis', editedBook.opis);
      formData.append('cena', editedBook.cena);
      if (editedBook.okladka) {
        formData.append('okladka', editedBook.okladka);
      }

      const updatedBook = await pb.collection('ksiazki').update(selectedBook.id, formData);
      
      setSelectedBook(updatedBook);
      setBooks(books.map(book => 
        book.id === updatedBook.id ? updatedBook : book
      ));
      fetchPurchases();
      setEditMode(false);
      setError(null);
    } catch (err) {
      console.error('Failed to update book:', err);
      setError('Failed to update book');
    }
  };

  const handleAddStock = async () => {
    if (!selectedBook || addStock <= 0) return;
    
    try {
      const newStock = parseInt(selectedBook.nastanie) + parseInt(addStock);
      const updatedBook = await pb.collection('ksiazki').update(selectedBook.id, {
        nastanie: newStock
      });
      
      setSelectedBook(updatedBook);
      setBooks(books.map(book => 
        book.id === updatedBook.id ? updatedBook : book
      ));
      setAddStock(0);
      setError(null);
    } catch (err) {
      console.error('Failed to add stock:', err);
      setError('Failed to add stock');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchBooks}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {selectedBook ? (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <button 
                onClick={() => setSelectedBook(null)}
                className="text-blue-500 hover:text-blue-700"
              >
                ← Wróć do listy
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => toggleFavorite(selectedBook.id, selectedBook.tytul)}
                  className={`text-2xl ${isFavorite(selectedBook.id) ? 'text-red-500' : 'text-gray-400'}`}
                >
                  ♥
                </button>
                {isAdmin() && (
                  <>
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                    >
                      {editMode ? 'Anuluj edycję' : 'Edytuj'}
                    </button>
                    <button
                      onClick={handleDeleteBook}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Usuń
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                {selectedBook.okladka && (
                  <div className="bg-gray-200 flex items-center justify-center">
                    <img 
                      src={pb.getFileUrl(selectedBook, selectedBook.okladka, { thumb: '300x450' })} 
                      alt={`Cover of ${selectedBook.tytul}`}
                      className="h-full object-contain"
                    />
                  </div>
                )}
                {editMode && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">Zmień okładkę</label>
                    <input
                      type="file"
                      className="w-full p-2 border rounded"
                      onChange={handleEditFileChange}
                      accept="image/*"
                    />
                  </div>
                )}
              </div>
              
              <div className="md:w-2/3">
                {editMode ? (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Tytuł</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editedBook.tytul}
                        onChange={(e) => setEditedBook({...editedBook, tytul: e.target.value})}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Autor</label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={editedBook.autor}
                        onChange={(e) => setEditedBook({...editedBook, autor: e.target.value})}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Opis</label>
                      <textarea
                        className="w-full p-2 border rounded"
                        value={editedBook.opis}
                        onChange={(e) => setEditedBook({...editedBook, opis: e.target.value})}
                      />
                    </div>
                    
                    <div className=" gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium mb-1">Cena</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full p-2 border rounded"
                          value={editedBook.cena}
                          onChange={(e) => setEditedBook({...editedBook, cena: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={handleUpdateBook}
                      className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 mb-4"
                    >
                      Zapisz zmiany
                    </button>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold mb-2">{selectedBook.tytul || 'Untitled'}</h1>
                    <p className="text-gray-600 mb-4">Autor: {selectedBook.autor || 'Unknown'}</p>
                    
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold mb-2">Opis</h2>
                      <p>{selectedBook.opis || 'Brak opisu'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-gray-600">Cena (szt.)</p>
                        <p className="font-medium">{selectedBook.cena ? `${selectedBook.cena} PLN` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Dostępna ilość</p>
                        <p className="font-medium">{selectedBook.nastanie || '0'}</p>
                      </div>
                    </div>
                  </>
                )}
                
                {!editMode && isAdmin() && (
                  <div className="mb-4 p-4 bg-gray-50 rounded">
                    <h3 className="text-lg font-semibold mb-2">Dodaj do stanu magazynowego</h3>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        className="flex-1 p-2 border rounded"
                        value={addStock}
                        onChange={(e) => setAddStock(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="Ilość do dodania"
                      />
                      <button
                        onClick={handleAddStock}
                        disabled={addStock <= 0}
                        className={`px-4 py-2 rounded ${addStock <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                      >
                        Dodaj
                      </button>
                    </div>
                  </div>
                )}
                
                {!editMode && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Kup książkę</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-600">Ilość do kupienia</p>
                        <input
                          type="number"
                          min="1"
                          max={selectedBook.nastanie}
                          value={quantity}
                          onChange={handleQuantityChange}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <p className="text-gray-600">Suma</p>
                        <p className="font-medium">{(selectedBook.cena * quantity).toFixed(2)} PLN</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleBuy}
                      disabled={selectedBook.nastanie <= 0}
                      className={`w-full py-2 rounded ${selectedBook.nastanie <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                    >
                      {selectedBook.nastanie <= 0 ? 'Niedostępne' : 'Kup teraz'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">BookSpace</h1>
            <div className="flex items-center gap-4">
              {userEmail && (
                <span 
                  onClick={() => router.push('/profil')} 
                  className="cursor-pointer hover:underline"
                >
                  {userEmail}
                </span>
              )}
              <button 
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Logout
              </button>
            </div>
          </div>

          {topBooks.length > 0 && (
            <div className="mb-8 bg-gray-200 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">Top 10 Najpopularniejszych Książek</h2>
              <div className="relative">
                <div className="flex overflow-x-auto pb-4 scrollbar-hide">
                  <div className="flex space-x-6">
                    {topBooks.map((book) => (
                      <div 
                        key={book.id} 
                        className="flex-shrink-0 w-64 h-80 relative cursor-pointer"
                        onClick={() => handleBookClick(book)}
                      >
                        <div className="absolute inset-0 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                          {book.okladka ? (
                            <div className="relative h-full w-full">
                              <img 
                                src={pb.getFileUrl(book, book.okladka, { thumb: '100x250' })} 
                                alt={`Cover of ${book.tytul}`}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-end p-4">
                                <h2 className="text-white font-semibold text-lg truncate">{book.tytul || 'Untitled'}</h2>
                                <p className="text-gray-200 text-sm truncate">Autor: {book.autor || 'Unknown'}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full w-full bg-gray-200 flex flex-col justify-end p-4">
                              <h2 className="text-gray-800 font-semibold text-lg truncate">{book.tytul || 'Untitled'}</h2>
                              <p className="text-gray-600 text-sm truncate">Autor: {book.autor || 'Unknown'}</p>
                            </div>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(book.id, book.tytul);
                            }}
                            className={`absolute top-2 right-2 text-xl ${isFavorite(book.id) ? 'text-red-500' : 'text-gray-300'}`}
                          >
                            ♥
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-6">
            {isAdmin() && (
              <div 
                className="bg-white rounded-lg shadow-md overflow-hidden flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors h-80 w-64"
                onClick={() => setShowAddForm(true)}
              >
                <span className="text-6xl text-gray-400">+</span>
              </div>
            )}

            {books.map((book) => (
              <div 
                key={book.id} 
                className="flex-shrink-0 w-64 h-80 relative cursor-pointer"
                onClick={() => handleBookClick(book)}
              >
                <div className="absolute inset-0 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  {book.okladka ? (
                    <div className="relative h-full w-full">
                      <img 
                        src={pb.getFileUrl(book, book.okladka, { thumb: '100x250' })} 
                        alt={`Cover of ${book.tytul}`}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-end p-4">
                        <h2 className="text-white font-semibold text-lg truncate">{book.tytul || 'Untitled'}</h2>
                        <p className="text-gray-200 text-sm truncate">Autor: {book.autor || 'Unknown'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex flex-col justify-end p-4">
                      <h2 className="text-gray-800 font-semibold text-lg truncate">{book.tytul || 'Untitled'}</h2>
                      <p className="text-gray-600 text-sm truncate">Autor: {book.autor || 'Unknown'}</p>
                    </div>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(book.id, book.tytul);
                    }}
                    className={`absolute top-2 right-2 text-xl ${isFavorite(book.id) ? 'text-red-500' : 'text-gray-300'}`}
                  >
                    ♥
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showAddForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add New Book</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={newBook.tytul}
                      onChange={(e) => setNewBook({...newBook, tytul: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Author</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={newBook.autor}
                      onChange={(e) => setNewBook({...newBook, autor: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Initial Stock</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={newBook.nastanie}
                      onChange={(e) => setNewBook({...newBook, nastanie: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-2 border rounded"
                      value={newBook.cena}
                      onChange={(e) => setNewBook({...newBook, cena: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      className="w-full p-2 border rounded"
                      value={newBook.opis}
                      onChange={(e) => setNewBook({...newBook, opis: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Cover Image</label>
                    <input
                      type="file"
                      className="w-full p-2 border rounded"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddBook}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add Book
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}