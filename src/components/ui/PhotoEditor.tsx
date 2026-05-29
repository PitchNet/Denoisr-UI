import { useEffect, useRef, useState, type PointerEvent } from 'react'
import '../../styles/photo-editor.css'

type PhotoEditorProps = {
  onSave: (file: File) => void
  onCancel: () => void
}

export default function PhotoEditor({ onSave, onCancel }: PhotoEditorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [crop, setCrop] = useState({ x: 0, y: 0, size: 200 })
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, cropX: 0, cropY: 0 })
  const rafRef = useRef(0)

  function handleFileSelect(f: File) {
    if (!f.type.startsWith('image/')) return
    setFile(f)
    if (imageSrc) URL.revokeObjectURL(imageSrc)
    setImageSrc(URL.createObjectURL(f))
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFileSelect(f)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function onDragLeave() { setDragOver(false) }

  function onImageLoad() {
    const img = imgRef.current
    const container = containerRef.current
    if (!img || !container) return

    const maxW = container.clientWidth - 4
    const maxH = container.clientHeight - 4
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
    const w = Math.floor(img.naturalWidth * scale)
    const h = Math.floor(img.naturalHeight * scale)

    setDisplaySize({ w, h })

    const size = Math.floor(Math.min(w, h) * 0.8)
    setCrop({
      x: Math.floor((w - size) / 2),
      y: Math.floor((h - size) / 2),
      size,
    })
  }

  function drawPreview(c: { x: number; y: number; size: number }) {
    const img = imgRef.current
    const canvas = previewCanvasRef.current
    if (!img || !canvas || !displaySize.w) return

    const dpr = window.devicePixelRatio || 1
    const previewSize = 120
    canvas.width = previewSize * dpr
    canvas.height = previewSize * dpr

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(dpr, dpr)

    const ratio = img.naturalWidth / displaySize.w
    const sx = c.x * ratio
    const sy = c.y * ratio
    const sSize = c.size * ratio

    ctx.beginPath()
    ctx.arc(previewSize / 2, previewSize / 2, previewSize / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, previewSize, previewSize)
  }

  useEffect(() => {
    if (displaySize.w > 0) drawPreview(crop)
  }, [displaySize])

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      cropX: crop.x,
      cropY: crop.y,
    }
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!isDragging) return
    e.preventDefault()

    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      const nextX = Math.max(0, Math.min(displaySize.w - crop.size, dragRef.current.cropX + dx))
      const nextY = Math.max(0, Math.min(displaySize.h - crop.size, dragRef.current.cropY + dy))
      const next = { ...crop, x: nextX, y: nextY }
      setCrop(next)
      drawPreview(next)
    })
  }

  function handlePointerUp() {
    setIsDragging(false)
  }

  function handleSave() {
    const img = imgRef.current
    if (!img || !file) return

    const ratio = img.naturalWidth / displaySize.w
    const sx = crop.x * ratio
    const sy = crop.y * ratio
    const sSize = crop.size * ratio

    const canvas = document.createElement('canvas')
    canvas.width = sSize
    canvas.height = sSize
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, sSize, sSize)

    canvas.toBlob((blob) => {
      if (!blob) return
      const cropped = new File([blob], file.name, { type: file.type })
      if (imageSrc) URL.revokeObjectURL(imageSrc)
      onSave(cropped)
    }, file.type)
  }

  function handleCancel() {
    if (imageSrc) URL.revokeObjectURL(imageSrc)
    onCancel()
  }

  if (!imageSrc) {
    return (
      <div className="pe-photoBackdrop" onClick={handleCancel}>
        <div className="pe-photoModal" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="pe-photoClose" onClick={handleCancel} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="2" y1="2" x2="16" y2="16" />
              <line x1="16" y1="2" x2="2" y2="16" />
            </svg>
          </button>

          <span className="pe-photoEyebrow">Edit photo</span>
          <h2 className="pe-photoTitle">Upload a profile photo</h2>

          <div
            className={`pe-photoDrop ${dragOver ? 'pe-photoDrop--over' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span className="pe-photoDropText">Click to browse or drag & drop</span>
            <span className="pe-photoDropHint">PNG, JPG, WEBP</span>
          </div>

          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onInputChange} hidden />

          <div className="pe-photoActions">
            <button type="button" className="btn btn--solidDark" onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  const cropStyle: React.CSSProperties = {
    left: crop.x,
    top: crop.y,
    width: crop.size,
    height: crop.size,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  }

  return (
    <div className="pe-photoBackdrop" onClick={handleCancel}>
      <div className="pe-photoModal pe-photoModal--crop" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="pe-photoClose" onClick={handleCancel} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="2" y1="2" x2="16" y2="16" />
            <line x1="16" y1="2" x2="2" y2="16" />
          </svg>
        </button>

        <span className="pe-photoEyebrow">Edit photo</span>
        <h2 className="pe-photoTitle">Crop your photo</h2>
        <p className="pe-photoSub">Drag the square to frame your face. The preview shows how it'll look.</p>

        <div className="pe-photoBody">
          <div className="pe-cropContainer" ref={containerRef}>
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Photo to crop"
              className="pe-cropImg"
              style={{ width: displaySize.w || undefined, height: displaySize.h || undefined }}
              onLoad={onImageLoad}
            />
            {displaySize.w > 0 && (
              <div
                className="pe-cropOverlay"
                style={cropStyle}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div className="pe-cropGrid">
                  <div className="pe-cropGrid__h" />
                  <div className="pe-cropGrid__h" />
                  <div className="pe-cropGrid__v" />
                  <div className="pe-cropGrid__v" />
                </div>
              </div>
            )}
          </div>

          <div className="pe-previewCol">
            <span className="pe-photoEyebrow">Preview</span>
            <div className="pe-previewCircle">
              <canvas ref={previewCanvasRef} className="pe-previewCanvas" />
            </div>
            <span className="pe-previewHint">Appears as a circle on your profile</span>
          </div>
        </div>

        <div className="pe-photoActions">
          <button type="button" className="btn btn--outlinedLight" onClick={handleCancel}>Cancel</button>
          <button type="button" className="btn btn--solidDark" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
