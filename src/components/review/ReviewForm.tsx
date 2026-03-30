import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Star } from 'lucide-react'
import { useState } from 'react'
import { useSubmitReview } from '@/hooks/useReviews'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Review } from '@/types'

const reviewSchema = z.object({
  rating: z.number().min(1, '評価を選択してください').max(5),
  body: z.string().min(10, '10文字以上入力してください').max(1000, '1000文字以内で入力してください'),
})

type ReviewFormValues = z.infer<typeof reviewSchema>

interface ReviewFormProps {
  shopId: string
  existingReview?: Review | null
  onSuccess?: () => void
}

export const ReviewForm = ({ shopId, existingReview, onSuccess }: ReviewFormProps) => {
  const [hoverRating, setHoverRating] = useState(0)
  const { mutate, isPending, error } = useSubmitReview()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: existingReview?.rating ?? 0,
      body: existingReview?.body ?? '',
    },
  })

  const currentRating = watch('rating')

  const onSubmit = (values: ReviewFormValues) => {
    mutate(
      { shopId, body: values.body, rating: values.rating },
      { onSuccess }
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Star Rating */}
      <div className="space-y-2">
        <Label>評価</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setValue('rating', star, { shouldValidate: true })}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoverRating || currentRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
        {errors.rating && (
          <p className="text-xs text-red-600">{errors.rating.message}</p>
        )}
      </div>

      {/* Body */}
      <div className="space-y-2">
        <Label htmlFor="body">レビュー本文</Label>
        <textarea
          id="body"
          rows={5}
          placeholder="この店舗の感想を書いてください（10〜1000文字）"
          className="flex w-full rounded-md border border-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          {...register('body')}
        />
        {errors.body && (
          <p className="text-xs text-red-600">{errors.body.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? '送信中...' : existingReview ? 'レビューを更新' : 'レビューを投稿'}
      </Button>
    </form>
  )
}
