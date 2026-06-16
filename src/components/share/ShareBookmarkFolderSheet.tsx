import { useState } from 'react'
import { X, FolderPlus, Check, Folder } from 'lucide-react'
import { useMyBookmarkFolders, useCreateBookmarkFolder, useToggleBookmark } from '@/hooks/useShareBookmarks'
import { cn } from '@/lib/utils'
import type { SharePost } from '@/types'

interface ShareBookmarkFolderSheetProps {
  post: SharePost
  onClose: () => void
}

/**
 * ブックマーク時にフォルダを選択するボトムシート。
 * 未ブックマークの投稿に対して表示する。
 */
export const ShareBookmarkFolderSheet = ({ post, onClose }: ShareBookmarkFolderSheetProps) => {
  const { data: folders = [], isLoading } = useMyBookmarkFolders()
  const { mutate: toggle, isPending: isToggling } = useToggleBookmark(post.id)
  const { mutate: createFolder, isPending: isCreating } = useCreateBookmarkFolder()

  const [newFolderName, setNewFolderName] = useState('')
  const [showNewInput, setShowNewInput] = useState(false)

  const handleSelect = (folderId: string | null) => {
    toggle({ isBookmarked: false, folderId }, { onSuccess: onClose })
  }

  const handleCreate = () => {
    const name = newFolderName.trim()
    if (!name) return
    createFolder(name, {
      onSuccess: (folder) => {
        toggle({ isBookmarked: false, folderId: folder.id }, { onSuccess: onClose })
      },
    })
  }

  return (
    <>
      {/* バックドロップ */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* シート */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[70vh] flex-col rounded-t-2xl bg-white">
        {/* ドラッグハンドル */}
        <div className="flex shrink-0 justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
        </div>

        {/* ヘッダー */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 pb-3 pt-1">
          <span className="font-headline text-[10px] font-black uppercase tracking-[0.35em] text-muted-foreground/50">
            フォルダを選択
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="text-muted-foreground/40 transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          {isLoading ? (
            <p className="py-8 text-center text-xs text-muted-foreground/40">読み込み中…</p>
          ) : (
            <>
              {/* フォルダなし */}
              <button
                type="button"
                onClick={() => handleSelect(null)}
                disabled={isToggling}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40 disabled:opacity-40"
              >
                <Folder className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                <span className="text-[13px] font-medium text-foreground/80">フォルダなし</span>
              </button>

              {/* 既存フォルダ */}
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => handleSelect(folder.id)}
                  disabled={isToggling}
                  className={cn(
                    'flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40 disabled:opacity-40',
                    post.bookmarkFolderId === folder.id && 'text-primary',
                  )}
                >
                  <Folder className={cn('h-4 w-4 shrink-0', post.bookmarkFolderId === folder.id ? 'text-primary' : 'text-muted-foreground/40')} />
                  <span className="flex-1 text-[13px] font-medium">{folder.name}</span>
                  {post.bookmarkFolderId === folder.id && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </button>
              ))}

              {/* 新しいフォルダを作成 */}
              <div className="border-t border-border">
                {showNewInput ? (
                  <div className="flex items-center gap-2 px-5 py-3">
                    <Folder className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
                      placeholder="フォルダ名"
                      maxLength={50}
                      autoFocus
                      className="flex-1 bg-transparent text-[13px] text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={!newFolderName.trim() || isCreating}
                      className="text-[11px] font-bold text-primary disabled:opacity-30"
                    >
                      {isCreating ? '作成中…' : '作成'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNewInput(false); setNewFolderName('') }}
                      className="text-muted-foreground/40 hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewInput(true)}
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <FolderPlus className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    <span className="text-[13px] font-medium text-muted-foreground/60">新しいフォルダを作成</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
