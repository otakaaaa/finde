import { describe, it, expect, beforeEach } from 'vitest'
import { getVisitorId } from './visitorId'

beforeEach(() => {
  localStorage.clear()
})

describe('getVisitorId', () => {
  it('初回は UUID を発行して localStorage に保存する', () => {
    const id = getVisitorId()
    expect(id).toMatch(/^[0-9a-f-]{36}$/i)
    expect(localStorage.getItem('finde_visitor_id')).toBe(id)
  })

  it('2回目以降は同じ ID を返す', () => {
    const first = getVisitorId()
    const second = getVisitorId()
    expect(second).toBe(first)
  })
})
