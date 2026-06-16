import { useState } from 'react'
import { X, FolderPlus, Pencil, Trash2, Check } from 'lucide-react'
import {
  useMyBookmarks,
  useMyBookmarkFolders,
  useCreateBookmarkFolder,
  useRenameBookmarkFolder,
  useDeleteBookmarkFolder,
} from '@/hooks/useShareBookmarks'
import { SharePostCard } from '@/components/share/SharePostCard'
import { ShareMypageNav } from '@/components/share/ShareMypageNav'
import { Seo } from '@/components/seo/Seo'
import { cn } from '@/lib/utils'
import type { ShareBookmarkFolder } from '@/types'

// 'all' = すべて, null = 未分類(フォルダなし), string = 指定フォルダID
type ActiveFolder = string | null

// ── フォルダタブ ──────────────────────────────────────────────────

interface FolderMenuProps {
  folder: ShareBookmarkFolder
  onRename: (folder: ShareBookmarkFolder) => void
  onDelete: (folder: ShareBookmarkFolder) => void
}

const FolderMenu = ({ folder, onRename, onDelete }: FolderMenuProps) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="ml-1 flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground/30 hover:bg-muted hover:text-foreground/60"
        aria-label={`${folder.name} の操作`}
      >
        <span className="font-black leading-none" style={{ fontSize: '10px' }}>⋯</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[120px] rounded-sm border border-border bg-white py-1 shadow-md">
            <button
              type="button"
              onClick={() => { setOpen(false); onRename(folder) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-[11px] text-foreground/70 hover:bg-muted/50"
            >
              <Pencil className="h-3 w-3" />
              名前を変更
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onDelete(folder) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-[11px] text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
              削除
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── メインページ ──────────────────────────────────────────────────

const MyShareBookmarksPage = () => {
  const [activeFolder, setActiveFolder] = useState<ActiveFolder>('all')
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewInput, setShowNewInput] = useState(false)
  const [editingFolder, setEditingFolder] = useState<ShareBookmarkFolder | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingFolder, setDeletingFolder] = useState<ShareBookmarkFolder | null>(null)

  const { data: folders = [], isLoading: foldersLoading } = useMyBookmarkFolders()
  const { data: posts, isLoading: postsLoading } = useMyBookmarks(activeFolder)
  const { mutate: createFolder, isPending: isCreating } = useCreateBookmarkFolder()
  const { mutate: renameFolder, isPending: isRenaming } = useRenameBookmarkFolder()
  const { mutate: deleteFolder, isPending: isDeleting } = useDeleteBookmarkFolder()

  const handleCreateFolder = () => {
    const name = newFolderName.trim()
    if (!name) return
    createFolder(name, {
      onSuccess: () => {
        setNewFolderName('')
        setShowNewInput(false)
      },
    })
  }

  const handleRenameConfirm = () => {
    if (!editingFolder || !editName.trim()) return
    renameFolder({ id: editingFolder.id, name: editName }, {
      onSuccess: () => setEditingFolder(null),
    })
  }

  const handleDeleteConfirm = () => {
    if (!deletingFolder) return
    deleteFolder(deletingFolder.id, {
      onSuccess: () => {
        if (activeFolder === deletingFolder.id) setActiveFolder('all')
        setDeletingFolder(null)
      },
    })
  }

  const isLoading = foldersLoading || postsLoading

  return (
    <div className="bg-background">
      <Seo title="シャレ活のブックマーク" description="ブックマークしたシャレ活を見返せます。" path="/mypage/share/bookmarks" noindex />

      <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
        <h1 className="mb-6 font-headline text-2xl font-black tracking-tight text-foreground">シャレ活</h1>
        <ShareMypageNav />

        {/* ── フォルダタブ ── */}
        <div className="mb-6 flex flex-wrap items-center gap-x-0.5 gap-y-1 border-b border-border pb-3">
          {/* すべて */}
          <button
            type="button"
            onClick={() => setActiveFolder('all')}
            className={cn(
              'flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-headline text-[10px] font-black uppercase tracking-[0.2em] transition-colors',
              activeFolder === 'all'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground/40 hover:text-foreground/70',
            )}
          >
            すべて
          </button>

          {/* フォルダなし */}
          <button
            type="button"
            onClick={() => setActiveFolder(null)}
            className={cn(
              'flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-headline text-[10px] font-black uppercase tracking-[0.2em] transition-colors',
              activeFolder === null
                ? 'bg-foreground text-background'
                : 'text-muted-foreground/40 hover:text-foreground/70',
            )}
          >
            未分類
          </button>

          {/* 各フォルダ */}
          {folders.map((folder) => (
            <div
              key={folder.id}
              className={cn(
                'flex items-center gap-0.5 rounded-sm transition-colors',
                activeFolder === folder.id ? 'bg-foreground text-background' : '',
              )}
            >
              <button
                type="button"
                onClick={() => setActiveFolder(folder.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 font-headline text-[10px] font-black uppercase tracking-[0.2em] transition-colors',
                  activeFolder === folder.id
                    ? 'text-background'
                    : 'text-muted-foreground/40 hover:text-foreground/70',
                )}
              >
                {folder.name}
              </button>
              <div className={cn(activeFolder === folder.id ? 'text-background/60' : '')}>
                <FolderMenu
                  folder={folder}
                  onRename={(f) => { setEditingFolder(f); setEditName(f.name) }}
                  onDelete={setDeletingFolder}
                />
              </div>
              {activeFolder === folder.id && <div className="w-2" />}
            </div>
          ))}

          {/* フォルダ追加 */}
          {showNewInput ? (
            <div className="flex items-center gap-1.5 rounded-sm border border-border px-2 py-1">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setShowNewInput(false); setNewFolderName('') } }}
                placeholder="フォルダ名"
                maxLength={50}
                autoFocus
                className="w-28 bg-transparent text-[11px] text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || isCreating}
                className="text-primary disabled:opacity-30"
                aria-label="作成"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => { setShowNewInput(false); setNewFolderName('') }}
                className="text-muted-foreground/40 hover:text-foreground"
                aria-label="キャンセル"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewInput(true)}
              className="flex items-center gap-1 rounded-sm px-2.5 py-1.5 text-muted-foreground/30 transition-colors hover:text-foreground/60"
              aria-label="フォルダを追加"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span className="font-headline text-[9px] font-black tracking-[0.2em]">追加</span>
            </button>
          )}
        </div>

        {/* ── 投稿一覧 ── */}
        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground/40">読み込み中…</p>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <SharePostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground/40">ブックマークした投稿はありません。</p>
        )}
      </div>

      {/* ── フォルダ名変更モーダル ── */}
      {editingFolder && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setEditingFolder(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white p-5 shadow-lg">
            <p className="mb-4 font-headline text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
              フォルダ名を変更
            </p>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRenameConfirm() }}
              maxLength={50}
              autoFocus
              className="mb-4 w-full border-b border-border bg-transparent py-1.5 text-[14px] text-foreground focus:border-foreground/40 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingFolder(null)}
                className="px-4 py-2 text-[11px] font-bold text-muted-foreground/50 hover:text-foreground"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleRenameConfirm}
                disabled={!editName.trim() || isRenaming}
                className="bg-foreground px-4 py-2 text-[11px] font-bold text-background disabled:opacity-30"
              >
                {isRenaming ? '変更中…' : '変更する'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── フォルダ削除確認モーダル ── */}
      {deletingFolder && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setDeletingFolder(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white p-5 shadow-lg">
            <p className="mb-2 font-headline text-[13px] font-black tracking-tight text-foreground">
              「{deletingFolder.name}」を削除しますか？
            </p>
            <p className="mb-5 text-[12px] text-muted-foreground/60">
              フォルダを削除してもブックマーク自体は残ります。投稿は「未分類」に移動されます。
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingFolder(null)}
                className="px-4 py-2 text-[11px] font-bold text-muted-foreground/50 hover:text-foreground"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-red-500 px-4 py-2 text-[11px] font-bold text-white disabled:opacity-30"
              >
                {isDeleting ? '削除中…' : '削除する'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default MyShareBookmarksPage
