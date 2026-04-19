import React from 'react'
import { FileCard } from './FileCard.jsx'
import { Plus } from 'lucide-react'

export function FileQueue({ statements, onRemove, onSetBank, onAddMore }) {
  if (!statements || statements.length === 0) return null

  const doneCount = statements.filter(s => s.parseStatus === 'done').length
  const errorCount = statements.filter(s => s.parseStatus === 'error').length
  const pendingCount = statements.filter(s => s.parseStatus === 'pending').length
  const parsingCount = statements.filter(s => s.parseStatus === 'parsing').length

  return (
    <div className="w-full max-w-xl mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {statements.length} {statements.length === 1 ? 'file' : 'files'} added
        </h3>
        <div className="flex gap-2 text-xs text-text-secondary">
          {doneCount > 0 && <span className="text-positive">{doneCount} ready</span>}
          {parsingCount > 0 && <span className="text-accent">{parsingCount} parsing</span>}
          {errorCount > 0 && <span className="text-negative">{errorCount} failed</span>}
        </div>
      </div>

      {/* File cards */}
      <div className="space-y-2">
        {statements.map(stmt => (
          <FileCard
            key={stmt.id}
            statement={stmt}
            onRemove={onRemove}
            onSetBank={onSetBank}
          />
        ))}
      </div>

      {/* Add more button */}
      {pendingCount === 0 && parsingCount === 0 && onAddMore && (
        <button
          onClick={onAddMore}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-border-medium rounded-xl text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add more files
        </button>
      )}
    </div>
  )
}
