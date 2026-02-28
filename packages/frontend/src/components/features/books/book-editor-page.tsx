import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/use-auth';
import { useBook, useUpdateBook, useDeleteBook, useAddChapter, useReorderChapters, useRemoveChapter, Chapter } from '@/hooks/use-books';
import { useNotes } from '@/hooks/use-notes';
import { useTheme } from '@/hooks/use-theme';
import {
  LuArrowLeft,
  LuSave,
  LuTrash2,
  LuPlus,
  LuGlobe,
  LuLock,
  LuSettings2,
  LuGripVertical,
  LuFileText,
  LuCheck,
  LuDownload
} from 'react-icons/lu';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export function BookEditorPage() {
  const { bookId } = useParams({ strict: false }) as { bookId: string };
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isDark } = useTheme();

  const { data, isLoading: bookLoading, error } = useBook(bookId, isAuthenticated);
  const updateBook = useUpdateBook(bookId);
  const deleteBook = useDeleteBook();
  const addChapter = useAddChapter(bookId);
  const reorderChapters = useReorderChapters(bookId);
  const removeChapter = useRemoveChapter(bookId);

  // Search notes for adding
  const [search, setSearch] = useState('');
  const { data: notesData, isLoading: notesLoading } = useNotes({ q: search, enabled: isAuthenticated });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isAddingChapter, setIsAddingChapter] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (data?.book) {
      setTitle(data.book.title);
      setDescription(data.book.description);
      setSlug(data.book.slug);
      setIsPublic(data.book.isPublic);
    }
  }, [data]);

  const handleSaveSettings = async () => {
    await updateBook.mutateAsync({ title, description, slug, isPublic });
    setIsEditingSettings(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      await deleteBook.mutateAsync(bookId);
      navigate({ to: '/dashboard' });
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !data?.chapters) return;

    const items = Array.from(data.chapters);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Optimistically update
    // We should ideally update the cache, but for simplicity we rely on the refetch from useReorderChapters

    const newOrderIds = items.map(c => c.id);
    await reorderChapters.mutateAsync(newOrderIds);
  };

  const handleAddNoteToChapter = async (noteId: string) => {
    await addChapter.mutateAsync({ noteId });
    setIsAddingChapter(false);
  };

  if (authLoading || bookLoading) {
    return <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">Loading...</div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-zinc-900 dark:text-zinc-50 font-body">
        <h1 className="text-2xl font-bold mb-4 font-heading">Book not found</h1>
        <button onClick={() => navigate({ to: '/dashboard' })} className="flex items-center gap-2 text-indigo-500 hover:text-indigo-600 transition-colors">
          <LuArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  const { book, chapters } = data;
  const availableNotes = notesData?.notes.filter(note => !chapters.some(c => c.noteId === note.id)) || [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-body text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl backdrop-saturate-150 shrink-0">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <LuArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-2 max-w-xl">
             <h1 className="font-heading font-bold text-lg tracking-tight truncate">{book.title}</h1>
             {book.isPublic ? (
               <span className="flex items-center gap-1 text-indigo-500 bg-indigo-500/8 border border-indigo-500/15 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider"><LuGlobe size={10} />PUBLIC</span>
             ) : (
               <span className="flex items-center gap-1 text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider"><LuLock size={10} />PRIVATE</span>
             )}
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <a
              href={`/books/${book.slug}/print`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:bg-zinc-100 hover:text-indigo-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-indigo-400 rounded-lg p-2 transition-colors flex items-center gap-2"
              title="本をPDF出力"
            >
              <LuDownload size={18} />
              <span className="hidden sm:inline text-sm font-medium">PDF出力</span>
            </a>
            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1" />
            <button
              onClick={() => setIsEditingSettings(!isEditingSettings)}
              className={`text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 rounded-lg p-2 transition-colors ${isEditingSettings ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50' : ''}`}
              title="Settings"
            >
              <LuSettings2 size={18} />
            </button>
          </div>
        </div>
        <div className="h-px bg-linear-to-r from-transparent via-indigo-500/20 to-transparent" />
      </header>

      {/* ─── Body ─── */}
      <div className="flex-1 overflow-auto p-6 sm:p-8 md:p-10 lg:p-12 relative max-w-4xl mx-auto w-full">

        {/* Settings Panel */}
        {isEditingSettings && (
          <div className="mb-10 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm animate-reveal">
            <h2 className="font-heading text-xl font-bold mb-6">Book Settings</h2>

            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2 text-zinc-900 dark:text-zinc-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2 text-zinc-900 dark:text-zinc-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Slug (URL)</label>
                <div className="flex items-center">
                  <span className="text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-l-xl border border-r-0 border-zinc-200 dark:border-zinc-700 font-mono text-sm leading-tight">/books/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="flex-1 rounded-r-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2 text-zinc-900 dark:text-zinc-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all font-mono text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${isPublic ? 'bg-indigo-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                >
                  <span className="sr-only">Toggle Public Visibility</span>
                  <span className={`pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="font-medium">{isPublic ? 'Public' : 'Private'}</span> &mdash; {isPublic ? 'Anyone with the link can view this book' : 'Only you can view this book'}
                </span>
              </div>

              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-medium transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 -ml-2"
                >
                  <LuTrash2 size={16} /> Delete Book
                </button>

                <div className="flex gap-2">
                  <button onClick={() => setIsEditingSettings(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSaveSettings} disabled={updateBook.isPending} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50">
                    <LuSave size={16} /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chapters Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold">Chapters</h2>
            <p className="text-zinc-500 text-sm mt-1">Organize your notes into a structured reading experience.</p>
          </div>
          <button
            onClick={() => setIsAddingChapter(!isAddingChapter)}
            className="flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20 px-4 py-2 text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
          >
            <LuPlus size={16} /> Add Chapter
          </button>
        </div>

        {/* Add Note Panel */}
        {isAddingChapter && (
           <div className="mb-8 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm animate-reveal">
             <div className="flex items-center justify-between mb-4">
               <h3 className="font-heading text-lg font-bold">Add Note to Book</h3>
               <button onClick={() => setIsAddingChapter(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">Close</button>
             </div>

             <input
               type="text"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Search notes to add..."
               className="w-full mb-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:border-indigo-500/50 py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition-all"
             />

             {notesLoading ? (
               <div className="text-center py-8 text-zinc-500 text-sm">Loading notes...</div>
             ) : availableNotes.length === 0 ? (
               <div className="text-center py-8 text-zinc-500 text-sm">No new notes available to add.</div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-75 overflow-y-auto pr-2 pb-2">
                 {availableNotes.map(note => (
                   <button
                     key={note.id}
                     onClick={() => handleAddNoteToChapter(note.id)}
                     disabled={addChapter.isPending}
                     className="flex flex-col items-start gap-1 p-3 text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-sm group transition-all"
                   >
                     <span className="font-heading font-semibold text-sm line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{note.title || 'Untitled Document'}</span>
                     <span className="text-xs text-zinc-500 font-mono">{new Date(note.updatedAt).toLocaleDateString()}</span>
                   </button>
                 ))}
               </div>
             )}
           </div>
        )}

        {/* Drag and Drop List */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
          {chapters.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <LuFileText size={24} className="text-zinc-400 dark:text-zinc-500" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-1">No chapters yet</h3>
              <p className="text-sm text-zinc-500 mb-6">Start building your book by adding notes as chapters.</p>
              <button
                onClick={() => setIsAddingChapter(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:bg-indigo-500 transition-all"
              >
                <LuPlus size={16} /> Add First Chapter
              </button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="chapters">
                {(provided) => (
                  <ul {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
                    {chapters.map((chapter, index) => (
                      <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                        {(provided, snapshot) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-4 p-4 bg-white dark:bg-zinc-950 transition-colors ${snapshot.isDragging ? 'shadow-float ring-2 ring-indigo-500/20 z-10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}
                            style={{...provided.draggableProps.style}}
                          >
                            <div {...provided.dragHandleProps} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-md cursor-grab active:cursor-grabbing">
                              <LuGripVertical size={18} />
                            </div>

                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-mono font-bold shrink-0">
                              {index + 1}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h4 className="font-heading font-bold text-base truncate pr-4">{chapter.title || chapter.note.title || 'Untitled Chapter'}</h4>
                                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                                  <span>Links to: <span className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded ml-1">{chapter.note.title || 'Untitled'}</span></span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 sm:shrink-0">
                                <button
                                  onClick={() => navigate({ to: '/notes/$noteId/edit', params: { noteId: chapter.noteId } })}
                                  className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition-colors"
                                >
                                  Edit Note
                                </button>
                                <button
                                  onClick={() => { if(confirm('Remove chapter? (The original note will not be deleted)')) removeChapter.mutate(chapter.id) }}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  title="Remove Chapter"
                                >
                                  <LuTrash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>
    </div>
  );
}
