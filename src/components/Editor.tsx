import type { PriceItem } from '../types'
import './Editor.css'

type Props = {
  items: PriceItem[]
  onItemChange: (id: string, patch: Partial<PriceItem>) => void
  onAddItemAfter: (afterId: string | null) => void
  onRemoveItem: (id: string) => void
  onMoveItem: (id: string, direction: -1 | 1) => void
  onReset: () => void
}

export function Editor({
  items,
  onItemChange,
  onAddItemAfter,
  onRemoveItem,
  onMoveItem,
  onReset,
}: Props) {
  return (
    <aside className="editor">
      <header className="editor__header">
        <p className="editor__eyebrow">Pricing Builder</p>
        <h1 className="editor__title">Прейскурант</h1>
        <p className="editor__lead">
          Редагуйте послуги. Після кожного пункту — «+», щоб додати новий поруч.
        </p>
        <button type="button" className="btn btn--ghost editor__reset" onClick={onReset}>
          Скинути список
        </button>
      </header>

      <div className="editor__list">
        {items.length === 0 ? (
          <button
            type="button"
            className="add-step"
            onClick={() => onAddItemAfter(null)}
          >
            <span className="add-step__icon" aria-hidden>
              +
            </span>
            <span>Додати першу послугу</span>
          </button>
        ) : null}

        {items.map((item, index) => (
          <div key={item.id} className="editor__step">
            <article className="item-card">
              <div className="item-card__top">
                <span className="item-card__index">{index + 1}</span>
                <div className="item-card__move">
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Вгору"
                    disabled={index === 0}
                    onClick={() => onMoveItem(item.id, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Вниз"
                    disabled={index === items.length - 1}
                    onClick={() => onMoveItem(item.id, 1)}
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  aria-label="Видалити"
                  onClick={() => onRemoveItem(item.id)}
                >
                  ×
                </button>
              </div>

              <label className="field field--compact">
                <span className="field__label">Назва</span>
                <input
                  className="field__input"
                  value={item.title}
                  onChange={(e) =>
                    onItemChange(item.id, { title: e.target.value })
                  }
                />
              </label>

              <label className="field field--compact">
                <span className="field__label">Підзаголовок</span>
                <input
                  className="field__input"
                  value={item.subtitle ?? ''}
                  placeholder="необовʼязково"
                  onChange={(e) =>
                    onItemChange(item.id, {
                      subtitle: e.target.value || undefined,
                    })
                  }
                />
              </label>

              <div className="item-card__row">
                <label className="field field--compact">
                  <span className="field__label">Ціна</span>
                  <input
                    className="field__input"
                    value={item.price}
                    placeholder="напр. 250грн"
                    onChange={(e) =>
                      onItemChange(item.id, { price: e.target.value })
                    }
                  />
                </label>

                <label className="check">
                  <input
                    type="checkbox"
                    checked={Boolean(item.indented)}
                    onChange={(e) =>
                      onItemChange(item.id, { indented: e.target.checked })
                    }
                  />
                  <span>Відступ</span>
                </label>
              </div>
            </article>

            <button
              type="button"
              className="add-step"
              aria-label={`Додати послугу після пункту ${index + 1}`}
              onClick={() => onAddItemAfter(item.id)}
            >
              <span className="add-step__icon" aria-hidden>
                +
              </span>
              <span className="add-step__text">Додати послугу</span>
            </button>
          </div>
        ))}
      </div>
    </aside>
  )
}
