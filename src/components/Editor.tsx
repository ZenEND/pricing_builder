import { useMemo } from 'react'
import type { PriceItem } from '../types'
import { groupPriceItems } from '../utils/itemGroups'
import './Editor.css'

type Props = {
  items: PriceItem[]
  onItemChange: (id: string, patch: Partial<PriceItem>) => void
  onAddItemAfter: (afterId: string | null) => void
  onAddChild: (parentId: string) => void
  onRemoveItem: (id: string) => void
  onMoveItem: (id: string, direction: -1 | 1) => void
  onReset: () => void
}

export function Editor({
  items,
  onItemChange,
  onAddItemAfter,
  onAddChild,
  onRemoveItem,
  onMoveItem,
  onReset,
}: Props) {
  const groups = useMemo(() => groupPriceItems(items), [items])

  return (
    <aside className="editor" data-tour="editor">
      <header className="editor__header">
        <p className="editor__eyebrow">Pricing Builder</p>
        <h1 className="editor__title">Прейскурант</h1>
        <p className="editor__lead">
          Редагуйте послуги. Підпункти належать до картки вище.
        </p>
      </header>

      <div className="editor__list">
        {groups.length === 0 ? (
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

        {groups.map((group, groupIndex) => {
          const { parent, children } = group
          const isFirst = groupIndex === 0

          return (
            <div key={parent.id} className="editor__step">
              <article
                className="item-card"
                {...(isFirst ? { 'data-tour': 'item-card' } : {})}
              >
                <div className="item-card__top">
                  <span className="item-card__index">{groupIndex + 1}</span>
                  <div
                    className="item-card__move"
                    {...(isFirst ? { 'data-tour': 'item-move' } : {})}
                  >
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Вгору"
                      disabled={groupIndex === 0}
                      onClick={() => onMoveItem(parent.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Вниз"
                      disabled={groupIndex === groups.length - 1}
                      onClick={() => onMoveItem(parent.id, 1)}
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    aria-label="Видалити"
                    onClick={() => onRemoveItem(parent.id)}
                  >
                    ×
                  </button>
                </div>

                <label className="field field--compact">
                  <span className="field__label">Назва</span>
                  <input
                    className="field__input"
                    value={parent.title}
                    onChange={(e) =>
                      onItemChange(parent.id, { title: e.target.value })
                    }
                  />
                </label>

                <label className="field field--compact">
                  <span className="field__label">Підзаголовок</span>
                  <input
                    className="field__input"
                    value={parent.subtitle ?? ''}
                    placeholder="необовʼязково"
                    onChange={(e) =>
                      onItemChange(parent.id, {
                        subtitle: e.target.value || undefined,
                      })
                    }
                  />
                </label>

                <label className="field field--compact">
                  <span className="field__label">Ціна</span>
                  <input
                    className="field__input"
                    value={parent.price}
                    placeholder="напр. 250грн"
                    onChange={(e) =>
                      onItemChange(parent.id, { price: e.target.value })
                    }
                  />
                </label>

                {children.length > 0 ? (
                  <div className="item-card__subs">
                    <p className="item-card__subs-label">Підпункти</p>
                    {children.map((child, childIndex) => (
                      <div key={child.id} className="sub-item">
                        <div className="sub-item__rail" aria-hidden />
                        <div className="sub-item__body">
                          <div className="sub-item__top">
                            <span className="sub-item__mark">↳</span>
                            <div className="sub-item__move">
                              <button
                                type="button"
                                className="icon-btn icon-btn--sm"
                                aria-label="Підпункт вгору"
                                disabled={childIndex === 0}
                                onClick={() => onMoveItem(child.id, -1)}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className="icon-btn icon-btn--sm"
                                aria-label="Підпункт вниз"
                                disabled={childIndex === children.length - 1}
                                onClick={() => onMoveItem(child.id, 1)}
                              >
                                ↓
                              </button>
                            </div>
                            <button
                              type="button"
                              className="icon-btn icon-btn--sm icon-btn--danger"
                              aria-label="Видалити підпункт"
                              onClick={() => onRemoveItem(child.id)}
                            >
                              ×
                            </button>
                          </div>
                          <label className="field field--compact">
                            <span className="field__label">Назва</span>
                            <input
                              className="field__input field__input--sm"
                              value={child.title}
                              onChange={(e) =>
                                onItemChange(child.id, {
                                  title: e.target.value,
                                })
                              }
                            />
                          </label>
                          <label className="field field--compact">
                            <span className="field__label">Ціна</span>
                            <input
                              className="field__input field__input--sm"
                              value={child.price}
                              placeholder="напр. +50грн"
                              onChange={(e) =>
                                onItemChange(child.id, {
                                  price: e.target.value,
                                })
                              }
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <button
                  type="button"
                  className="add-sub"
                  onClick={() => onAddChild(parent.id)}
                >
                  + Підпункт до цієї послуги
                </button>
              </article>

              <button
                type="button"
                className="add-step"
                aria-label={`Додати послугу після пункту ${groupIndex + 1}`}
                {...(isFirst ? { 'data-tour': 'add-service' } : {})}
                onClick={() => onAddItemAfter(parent.id)}
              >
                <span className="add-step__icon" aria-hidden>
                  +
                </span>
                <span className="add-step__text">Додати послугу</span>
              </button>
            </div>
          )
        })}

        <details className="editor__danger">
          <summary className="editor__danger-summary">Додатково</summary>
          <button
            type="button"
            className="editor__danger-btn"
            data-tour="reset"
            onClick={onReset}
          >
            Скинути список до початкового
          </button>
        </details>
      </div>
    </aside>
  )
}
