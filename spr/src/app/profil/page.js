'use client'
import { useEffect, useState } from 'react'
import PocketBase from 'pocketbase'
import { FiUser, FiSettings, FiShield, FiAlertTriangle, FiLogOut, FiHome, FiEdit, FiSave, FiX, FiBook, FiArrowLeft, FiTrash2, FiHeart, FiShoppingBag, FiCheck } from 'react-icons/fi'
import Link from 'next/link'
const POCKETBASE_URL = 'http://192.168.2.9:8080'

const bookGenres = [
  'Fantastyka',
  'Science Fiction',
  'Kryminał',
  'Thriller',
  'Romans',
  'Horror',
  'Literatura piękna',
  'Biografia',
  'Historyczna',
  'Dokumentalna',
  'Przygodowa',
  'Dla dzieci',
  'Young Adult',
  'Poradniki',
  'Psychologia',
  'Filozofia',
  'Inne'
]

export default function ProfilePage() {
  const [pb, setPb] = useState(null)
  const [isClient, setIsClient] = useState(false)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    imie: '',
    nazwisko: '',
    username: '',
    gatunek: ''
  })
  const [avatarUrl, setAvatarUrl] = useState('')
  const [reviews, setReviews] = useState([])
  const [showReviewsView, setShowReviewsView] = useState(false)
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editedReview, setEditedReview] = useState({
    ocena: 0,
    tresc: ''
  })
  const [favorites, setFavorites] = useState([])
  const [showFavoritesView, setShowFavoritesView] = useState(false)
  const [purchases, setPurchases] = useState([])
  const [showPurchasesView, setShowPurchasesView] = useState(false)
  const [usersList, setUsersList] = useState([])
  const [showUsersManagement, setShowUsersManagement] = useState(false)
  const [userEditMode, setUserEditMode] = useState(null)
  const [reportedComments, setReportedComments] = useState([])
  const [showReportedComments, setShowReportedComments] = useState(false)
  const [genres, setGenres] = useState([])

  useEffect(() => {
    setIsClient(true)
    const pbInstance = new PocketBase(POCKETBASE_URL)
    setPb(pbInstance)
  }, [])

  const handleBackToProfile = () => {
    setShowReviewsView(false)
    setShowFavoritesView(false)
    setShowPurchasesView(false)
    setShowUsersManagement(false)
    setShowReportedComments(false)
    setEditingReviewId(null)
  }

  useEffect(() => {
    if (!pb || !isClient) return
  
    const fetchInitialData = async () => {
      try {
        // Pobierz dane użytkownika
        const userRecord = await pb.collection('users').getOne(
          pb.authStore.model.id,
          { $autoCancel: false }
        )
  
        // Pobierz listę gatunków z bazy
        const genresList = await pb.collection('gatunki').getFullList({
          sort: 'nazwa',
          $autoCancel: false
        })
  
        setUserData(userRecord)
        setEditData({
          imie: userRecord.imie || '',
          nazwisko: userRecord.nazwisko || '',
          username: userRecord.username || '',
          gatunek: userRecord.gatunek || ''
        })
        setGenres(genresList)
        
        if (userRecord.avatar) {
          const url = pb.files.getUrl(userRecord, userRecord.avatar)
          setAvatarUrl(url)
        }
        setLoading(false)
      } catch (err) {
        console.error('Błąd pobierania danych:', err)
        setError('Nie udało się załadować danych profilu')
        setLoading(false)
      }
    }
  
    fetchInitialData()
  }, [pb, isClient])

  const fetchUserReviews = async () => {
    try {
      setLoading(true)
      const result = await pb.collection('recenzje').getFullList({
        filter: `id_user = "${userData.id}"`,
        expand: 'id_book',
        $autoCancel: false
      })
      setReviews(result)
      setShowReviewsView(true)
      setShowFavoritesView(false)
      setShowPurchasesView(false)
      setShowUsersManagement(false)
      setShowReportedComments(false)
      setLoading(false)
    } catch (err) {
      console.error('Błąd pobierania recenzji:', err)
      setError('Nie udało się załadować recenzji')
      setLoading(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const result = await pb.collection('polubione').getFullList({
        filter: `user = "${userData.email}"`,
        expand: 'id_book',
        $autoCancel: false
      })
      setFavorites(result)
      setShowFavoritesView(true)
      setShowReviewsView(false)
      setShowPurchasesView(false)
      setShowUsersManagement(false)
      setShowReportedComments(false)
      setLoading(false)
    } catch (err) {
      console.error('Błąd pobierania ulubionych:', err)
      setError('Nie udało się załadować ulubionych książek')
      setLoading(false)
    }
  }

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const purchases = await pb.collection('kupione').getFullList({
        filter: `user = "${userData.email}"`,
      });
  
      const bookIds = purchases.map(p => p.id_book).filter(Boolean);
      const bookCovers = bookIds.length > 0 
        ? await pb.collection('ksiazki').getFullList({
            filter: bookIds.map(id => `id = "${id}"`).join('||'),
            fields: 'id,okladka'
          })
        : [];
  
      const purchasesWithCovers = purchases.map(purchase => ({
        ...purchase,
        bookCover: bookCovers.find(b => b.id === purchase.id_book)?.okladka || null
      }));
  
      setPurchases(purchasesWithCovers);
      setShowPurchasesView(true);
      setShowReviewsView(false);
      setShowFavoritesView(false);
      setShowUsersManagement(false);
      setShowReportedComments(false);
      setLoading(false);
    } catch (err) {
      console.error('Błąd pobierania zakupów:', err);
      setError('Nie udało się załadować historii zakupów');
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const result = await pb.collection('users').getFullList({
        $autoCancel: false
      });
      setUsersList(result);
      setShowUsersManagement(true);
      setShowReviewsView(false);
      setShowFavoritesView(false);
      setShowPurchasesView(false);
      setShowReportedComments(false);
      setLoading(false);
    } catch (err) {

    }
  };

  const fetchReportedComments = async () => {
    try {
      setLoading(true);
      const result = await pb.collection('recenzje').getFullList({
        filter: 'report = true',
        expand: 'id_user,id_book',
        $autoCancel: false
      });
      setReportedComments(result);
      setShowReportedComments(true);
      setShowUsersManagement(false);
      setShowReviewsView(false);
      setShowFavoritesView(false);
      setShowPurchasesView(false);
      setLoading(false);
    } catch (err) {
      console.error('Błąd pobierania zgłoszonych komentarzy:', err);
      setError('Nie udało się załadować zgłoszonych komentarzy');
      setLoading(false);
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    if (confirm(`Czy na pewno chcesz zmienić rolę tego użytkownika na ${newRole}?`)) {
      try {
        await pb.collection('users').update(userId, { rola: newRole });
        setUsersList(prev => prev.map(user => 
          user.id === userId ? { ...user, rola: newRole } : user
        ));
      } catch (err) {
        console.error('Błąd zmiany roli:', err);
        setError('Nie udało się zmienić roli użytkownika');
      }
    }
  };

  const handleApproveComment = async (commentId) => {
    try {
      await pb.collection('recenzje').update(commentId, { report: false });
      setReportedComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (err) {
      console.error('Błąd zatwierdzania komentarza:', err);
      setError('Nie udało się zatwierdzić komentarza');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (confirm('Czy na pewno chcesz usunąć ten komentarz?')) {
      try {
        await pb.collection('recenzje').delete(commentId);
        setReportedComments(prev => prev.filter(comment => comment.id !== commentId));
      } catch (err) {
        console.error('Błąd usuwania komentarza:', err);
        setError('Nie udało się usunąć komentarza');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Brak daty'
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL')
  }

  const handleRemoveFavorite = async (favoriteId) => {
    if (confirm('Czy na pewno chcesz usunąć książkę z ulubionych?')) {
      try {
        setLoading(true)
        await pb.collection('polubione').delete(favoriteId)
        setFavorites(prev => prev.filter(fav => fav.id !== favoriteId))
        setLoading(false)
      } catch (err) {
        console.error('Błąd usuwania z ulubionych:', err)
        setError('Nie udało się usunąć z ulubionych')
        setLoading(false)
      }
    }
  }

  const handleLogout = () => {
    pb.authStore.clear()
    window.location.href = '/login'
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({
      imie: userData.imie || '',
      nazwisko: userData.nazwisko || '',
      username: userData.username || '',
      gatunek: userData.gatunek || ''
    })
  }

  const handleSave = async () => {
    try {
      const updatedData = await pb.collection('users').update(userData.id, editData)
      setUserData(updatedData)
      setIsEditing(false)
    } catch (err) {
      setError('Nie udało się zaktualizować danych')
      console.error('Error updating user data:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setEditData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const updatedData = await pb.collection('users').update(userData.id, formData)
      const url = pb.files.getUrl(updatedData, updatedData.avatar)
      setAvatarUrl(url)
      setUserData(updatedData)
    } catch (err) {
      setError('Nie udało się zaktualizować avatara')
      console.error('Error updating avatar:', err)
    }
  }

  const handleEditReview = (review) => {
    setEditingReviewId(review.id)
    setEditedReview({
      ocena: review.ocena,
      tresc: review.tresc
    })
  }

  const handleCancelEditReview = () => {
    setEditingReviewId(null)
  }

  const handleReviewChange = (e) => {
    const { name, value } = e.target
    setEditedReview(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRatingChange = (rating) => {
    setEditedReview(prev => ({
      ...prev,
      ocena: rating
    }))
  }

  const handleSaveReview = async () => {
    try {
      await pb.collection('recenzje').update(editingReviewId, editedReview)
      setReviews(prev => prev.map(review => 
        review.id === editingReviewId ? { ...review, ...editedReview } : review
      ))
      setEditingReviewId(null)
    } catch (err) {
      console.error('Błąd aktualizacji recenzji:', err)
      setError('Nie udało się zaktualizować recenzji')
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (confirm('Czy na pewno chcesz usunąć tę recenzję?')) {
      try {
        await pb.collection('recenzje').delete(reviewId)
        setReviews(prev => prev.filter(review => review.id !== reviewId))
      } catch (err) {
        console.error('Błąd usuwania recenzji:', err)
        setError('Nie udało się usunąć recenzji')
      }
    }
  }

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <FiAlertTriangle className="inline mr-2" />
          {error}
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Odśwież stronę
        </button>
      </div>
    )
  }

  if (!pb?.authStore.model) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-md text-center">
          <FiAlertTriangle className="inline mr-2" />
          Musisz być zalogowany aby zobaczyć ten profil
        </div>
        <Link
          href="/login"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          Przejdź do logowania
        </Link>
      </div>
    )
  }

  const renderProfileByRole = () => {
    switch(userData?.rola) {
      case 'sadmin':
        return (
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6">
            <h2 className="text-xl font-bold text-purple-800 flex items-center">
              <FiShield className="mr-2" /> Panel Super Administratora
            </h2>
            {userData?.rola === 'sadmin' && (
              
                <div className="mt-4 flex flex-wrap gap-2">
                  <button 
                    onClick={fetchAllUsers}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                  >
                    <FiUser className="mr-2" /> Zarządzaj użytkownikami
                  </button>
                  <button 
                    onClick={fetchReportedComments}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  >
                    <FiAlertTriangle className="mr-2" /> Zgłoszone komentarze
                  </button>
                </div>
              
            )}
          </div>
        )
      case 'admin':
        return (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <h2 className="text-xl font-bold text-blue-800 flex items-center">
              <FiSettings className="mr-2" /> Panel Administratora
            </h2>
            {userData?.rola === 'admin' && (
              
                
                <div className="mt-4">
                  <button 
                    onClick={fetchReportedComments}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    <FiAlertTriangle className="mr-2" /> Przeglądaj zgłoszone komentarze
                  </button>
                </div>
              
            )}
          </div>
        )
      default:
        return (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <h2 className="text-xl font-bold text-green-800 flex items-center">
              <FiUser className="mr-2" /> Panel Użytkownika
            </h2>
            <p className="mt-2 text-gray-600">Witaj w swoim profilu! Tutaj możesz zarządzać swoimi danymi.</p>
          </div>
        )
    }
  }

  if (showFavoritesView) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center">
              <button
                onClick={handleBackToProfile}
                className="flex items-center text-indigo-100 hover:text-white"
              >
                <FiArrowLeft className="mr-2" /> Wróć do profilu
              </button>
              <h2 className="text-xl font-bold">Twoje ulubione książki</h2>
              <div className="w-8"></div>
            </div>

            <div className="px-6 py-8">
              {favorites.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nie masz jeszcze ulubionych książek.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {favorites.map(favorite => {
                    const book = favorite.expand?.id_book || {}
                    return (
                      <div key={favorite.id} className="border-b border-gray-200 pb-4 last:border-b-0 group">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium">
                              {book.tytul || favorite.tytul || 'Nieznana książka'}
                            </h3>

                            {book.okladka && (
                              <img 
                                src={pb.files.getUrl(book, book.okladka)} 
                                alt="Okładka książki"
                                className="mt-2 w-20 h-auto rounded border"
                              />
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveFavorite(favorite.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            <FiTrash2 className="inline mr-1" /> Usuń
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showReviewsView) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center">
              <button
                onClick={handleBackToProfile}
                className="flex items-center text-indigo-100 hover:text-white"
              >
                <FiArrowLeft className="mr-2" /> Wróć do profilu
              </button>
              <h2 className="text-xl font-bold">Twoje recenzje</h2>
              <div className="w-8"></div>
            </div>

            <div className="px-6 py-8">
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nie masz jeszcze żadnych recenzji.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium">
                            {review.expand?.id_book?.tytul || 'Nieznana książka'}
                          </h3>
                          {editingReviewId === review.id ? (
                            <div className="mt-2">
                              <div className="flex mb-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    onClick={() => handleRatingChange(star)}
                                    className={`text-2xl ${star <= editedReview.ocena ? 'text-yellow-400' : 'text-gray-300'}`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                              <textarea
                                name="tresc"
                                value={editedReview.tresc}
                                onChange={handleReviewChange}
                                className="w-full p-2 border rounded"
                                rows="4"
                              />
                              <div className="flex justify-end mt-2 space-x-2">
                                <button
                                  onClick={handleCancelEditReview}
                                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                >
                                  Anuluj
                                </button>
                                <button
                                  onClick={handleSaveReview}
                                  className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                  Zapisz
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-5 h-5 ${i < review.ocena ? 'text-yellow-400' : 'text-gray-300'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                                <span className="ml-2 text-gray-600">{review.ocena}/5</span>
                              </div>
                              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-700">{review.tresc}</p>
                              </div>
                              <div className="flex justify-end mt-2 space-x-2">
                                <button
                                  onClick={() => handleEditReview(review)}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                  <FiEdit className="inline mr-1" /> Edytuj
                                </button>
                                <button
                                  onClick={() => handleDeleteReview(review.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                  <FiTrash2 className="inline mr-1" /> Usuń
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(review.created)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showPurchasesView) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center">
              <button
                onClick={handleBackToProfile}
                className="flex items-center text-indigo-100 hover:text-white"
              >
                <FiArrowLeft className="mr-2" /> Wróć do profilu
              </button>
              <h2 className="text-xl font-bold">Twoje zakupione książki</h2>
              <div className="w-8"></div>
            </div>
  
            <div className="px-6 py-8">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nie masz jeszcze żadnych zakupionych książek.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map(purchase => {
                    const title = purchase.tytul || 'Nieznana książka';
                    const price = `${purchase.cena} zł` || 'Brak danych';
                    const date = formatDate(purchase.created);
  
                    return (
                      <div key={purchase.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium">
                              {title}
                            </h3>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <p className="text-gray-600">
                                <span className="font-semibold">Cena:</span> {price}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-semibold">Data:</span> {date}
                              </p>
                            </div>
                          </div>
                          
                          {purchase.bookCover ? (
                            <div className="flex-shrink-0">
                              <img 
                                src={pb.files.getUrl({ id: purchase.id_book, collectionName: 'ksiazki' }, purchase.bookCover)} 
                                alt={`Okładka: ${title}`}
                                className="w-24 h-auto rounded border"
                                onError={(e) => {
                                  e.target.onerror = null; 
                                  e.target.src = '/placeholder-book-cover.jpg'
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-24 h-32 bg-gray-100 rounded border flex items-center justify-center text-gray-400">
                              Brak okładki
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showUsersManagement && userData?.rola === 'sadmin') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center">
              <button
                onClick={handleBackToProfile}
                className="flex items-center text-indigo-100 hover:text-white"
              >
                <FiArrowLeft className="mr-2" /> Wróć do profilu
              </button>
              <h2 className="text-xl font-bold">Zarządzanie użytkownikami</h2>
              <div className="w-8"></div>
            </div>

            <div className="px-6 py-8">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                </div>
              ) : usersList.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Brak użytkowników w systeme.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imię</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nazwisko</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rola</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data rejestracji</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usersList.map(user => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.imie || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.nazwisko || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {userEditMode === user.id ? (
                              <select
                                value={user.rola}
                                onChange={(e) => handleChangeUserRole(user.id, e.target.value)}
                                className="border rounded p-1"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="sadmin">Super Admin</option>
                              </select>
                            ) : (
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${user.rola === 'sadmin' ? 'bg-purple-100 text-purple-800' : 
                                  user.rola === 'admin' ? 'bg-blue-100 text-blue-800' : 
                                  'bg-green-100 text-green-800'}`}>
                                {user.rola || 'user'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.created)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setUserEditMode(userEditMode === user.id ? null : user.id)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              {userEditMode === user.id ? 'Anuluj' : 'Zmień rolę'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showReportedComments && (userData?.rola === 'admin' || userData?.rola === 'sadmin')) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4 text-white flex justify-between items-center">
              <button
                onClick={handleBackToProfile}
                className="flex items-center text-indigo-100 hover:text-white"
              >
                <FiArrowLeft className="mr-2" /> Wróć do profilu
              </button>
              <h2 className="text-xl font-bold">Zgłoszone komentarze</h2>
              <div className="w-8"></div>
            </div>

            <div className="px-6 py-8">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                </div>
              ) : reportedComments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Brak zgłoszonych komentarzy</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reportedComments.map(comment => (
                    <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium">
                            {comment.expand?.id_user?.email || 'Anonimowy użytkownik'}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Książka: {comment.expand?.id_book?.tytul || 'Nieznana książka'}
                          </p>
                          <div className="flex items-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-5 h-5 ${i < comment.ocena ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <div className="mt-4 bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                            <p className="text-gray-700">{comment.tresc}</p>
                            <div className="mt-2 text-sm text-red-600 flex items-center">
                              <FiAlertTriangle className="mr-1" /> Komentarz zgłoszony przez użytkowników
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleApproveComment(comment.id)}
                            className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            <FiCheck className="mr-1" /> Zatwierdź
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            <FiTrash2 className="mr-1" /> Usuń
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-indigo-600 px-6 py-8 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="flex items-center">
                <div className="relative mr-4">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Avatar" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-indigo-400 flex items-center justify-center text-2xl font-bold">
                      {userData?.imie?.charAt(0) || userData?.username?.charAt(0) || 'U'}
                    </div>
                  )}
                  <label 
                    htmlFor="avatar-upload"
                    className="absolute -bottom-2 -right-2 bg-white text-indigo-600 rounded-full p-1 cursor-pointer hover:bg-gray-100"
                    title="Zmień avatar"
                  >
                    <FiEdit size={16} />
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {userData?.imie} {userData?.nazwisko}
                  </h1>
                  <p className="text-indigo-200 mt-1">{userData?.email}</p>
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-700 text-indigo-100">
                    {userData?.rola || 'user'}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
                <Link 
                  href="/dashboard" 
                  className="flex items-center px-4 py-2 bg-indigo-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition"
                >
                  <FiHome className="mr-2" /> Strona główna
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 bg-red-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition"
                >
                  <FiLogOut className="mr-2" /> Wyloguj się
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button 
                onClick={fetchUserReviews}
                className="flex items-center px-4 py-2 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition text-white"
              >
                <FiBook className="mr-2" /> Twoje recenzje
              </button>
              <button 
                onClick={fetchFavorites}
                className="flex items-center px-4 py-2 bg-pink-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition text-white"
              >
                <FiHeart className="mr-2" /> Polubione
              </button>
              <button 
                onClick={fetchPurchases}
                className="flex items-center px-4 py-2 bg-green-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition text-white"
              >
                <FiShoppingBag className="mr-2" /> Zakupy
              </button>
             
            </div>
          </div>

          <div className="px-6 py-8">
            {renderProfileByRole()}

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Twoje dane</h2>
                {!isEditing ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleEdit}
                      className="flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                    >
                      <FiEdit className="mr-1" /> Edytuj
                    </button>
                    {userData?.rola === 'sadmin' && (
                      <button 
                        onClick={fetchAllUsers}
                        className="flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
                      >
                        <FiUser className="mr-1" /> Zarządzaj użytkownikami
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSave}
                      className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                    >
                      <FiSave className="mr-1" /> Zapisz
                    </button>
                    <button 
                      onClick={handleCancel}
                      className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                    >
                      <FiX className="mr-1" /> Anuluj
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Imię</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="imie"
                      value={editData.imie}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                    />
                  ) : (
                    <p className="font-medium">{userData?.imie || 'Nie podano'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nazwisko</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="nazwisko"
                      value={editData.nazwisko}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                    />
                  ) : (
                    <p className="font-medium">{userData?.nazwisko || 'Nie podano'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nazwa użytkownika</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      value={editData.username}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                    />
                  ) : (
                    <p className="font-medium">{userData?.username}</p>
                  )}
                </div>
                <div>
  <p className="text-sm text-gray-500">Ulubione gatunki</p>
  {isEditing ? (
    <select
      name="gatunek"
      value={editData.gatunek}
      onChange={handleChange}
      className="w-full p-2 border rounded"
    >
      <option value="">Wybierz gatunek</option>
      {genres.map(genre => (
        <option key={genre.id} value={genre.nazwa}>{genre.nazwa}</option>
      ))}
    </select>
  ) : (
    <p className="font-medium">{userData?.gatunek || 'Nie wybrano'}</p>
  )}
</div>
              </div>
            </div>

            

            
          </div>
        </div>
      </div>
    </div>
  )
}