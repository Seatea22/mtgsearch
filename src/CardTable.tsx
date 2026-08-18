import React from 'react';
import { useState, useEffect, useMemo, JSX } from 'react';
import { Card, CardField, CardListProps, CARD_ROW_CONFIG } from './Card'
import { Table, Button, Input, Label } from 'reactstrap';
import './assets/styles.css';

type SortKey = keyof Card;
type CellType = boolean | number | string | string[];

type FieldInputProps = {
    field: CardField;
    value: CellType;
    cardId: number;
    updateCardField: <K extends keyof Card>(id: number, field: K, newValue: Card[K]) => void;
};

const FieldInput: React.FC<FieldInputProps> = ({ field, value, cardId, updateCardField }) => {
    if (typeof value === 'boolean') {
        return (
            <input
                type='checkbox'
                checked={value}
                onChange={(e) => updateCardField(cardId, field.field as keyof Card, e.target.checked)}
                style={field.cssStyles}
            />
        );
    }

    const [text, setText] = useState(String(value));

    useEffect(() => {
        setText(String(value));
    }, [value]);

    const commit = () => {
        if (field.valueType === 'number') {
            const parsed = Number(text);
            if (Number.isNaN(parsed) || text.trim() === '') {
                setText(String(field.default));
                updateCardField(cardId, field.field as keyof Card, field.default);
                return;
            }
            updateCardField(cardId, field.field as keyof Card, parsed);
        } else {
            updateCardField(cardId, field.field as keyof Card, text);
        }
    };

    return (
        <input
            type={field.valueType === 'number' ? 'number' : 'text'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    (e.target as HTMLInputElement).blur();
                }
            }}
            placeholder={String(field.default)}
            style={field.cssStyles}
        />
    );
};

type SplitInputProps = {
    field: CardField;
    value: string[];
    cardId: number;
    updateCardField: <K extends keyof Card>(id: number, field: K, newValue: Card[K]) => void;
};

const SplitInput: React.FC<SplitInputProps> = ({ field, value, cardId, updateCardField }) => {
    if (field.specifier !== 'f_split') return null;

    const [text, setText] = useState(value.join(field.delimiter));

    useEffect(() => {
        setText(value.join(field.delimiter));
    }, [value]);

    const commit = () => {
        const parsed = text
            .split(field.delimiter)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        updateCardField(cardId, field.field as keyof Card, parsed);
    };

    return (
        <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    commit();
                }
            }}
            placeholder={field.placeholder}
            style={field.cssStyles}
        />
    );
};

export const CardTable: React.FC<CardListProps> = ({ cards, setCards }) => {
    const [currentSearch, setCurrentSearch] = useState<string>('');
    const [sortKey, setSortKey] = useState<SortKey>('id');
    const [sortAsc, setSortAsc] = useState<boolean>(true);

    const compareValues = (a: unknown, b: unknown): number => {
        // Compare arrray (by length)
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return a.length - b.length;
            
            return a.join(',').localeCompare(b.join(','));
        }

        // Booleans
        if (typeof a === 'boolean' && typeof b === 'boolean') return a === b ? 0 : a ? 1 : -1;

        // Numbers
        if (typeof a === 'number' && typeof b === 'number') return a - b;

        // Strings
        if (typeof a === 'string' && typeof b === 'string') return String(a).localeCompare(String(b));

        return 0;
    };

    const sortedCards = useMemo(() => {
        const sorted = [...cards].sort((a, b) => {
            const result = compareValues(a[sortKey], b[sortKey]);
            return sortAsc ? result : -result;
        });
        return sorted;
    }, [cards, sortKey, sortAsc]);

    const filterString = (str: string): string => str.toLowerCase().replace(/\s/g, "");

    const shownCards = useMemo(() => {
        const shown = [...sortedCards].filter((card) => {
            const cardFiltered = filterString(card.name)
            const searchFiltered = filterString(currentSearch);

            return cardFiltered.includes(searchFiltered);
        });
        return shown;
    }, [sortedCards, currentSearch]);

    const handleSort = (key: SortKey) => {
        if (key === sortKey) {
            setSortAsc(!sortAsc);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    const renderCellValue = (field: string, value: CellType, cardId: number): JSX.Element => {
        const fieldConfig: CardField | undefined = CARD_ROW_CONFIG.find(item => item.field === field);
        if (fieldConfig === undefined)
            return <input/>;

        const valueType = fieldConfig.specifier;
        if (valueType === 'f_string' || valueType === 'f_number' || valueType === 'f_boolean') 
            return <FieldInput 
                field={fieldConfig} 
                value={value} 
                cardId={cardId} 
                updateCardField={updateCardField}
            />


        if (Array.isArray(value)) {

            if (valueType === 'f_select')
                return renderSelect(fieldConfig, value, cardId);

            if (valueType === 'f_split')
                return <SplitInput
                    field={fieldConfig}
                    value={value}
                    cardId={cardId}
                    updateCardField={updateCardField}
                />
        }

        if (valueType === 'f_static_num')
            return <p style={fieldConfig.cssStyles}>{value}</p>;

        return <input/>;
    };

    const renderSelect = (field: CardField, value: Array<string>, cardId: number): JSX.Element => {
        if (field.specifier !== 'f_select')
            return <select key={`${cardId}-${field.field}`}/>

        return <select 
            style={field.cssStyles} 
            multiple={field.multiple}
            onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                updateCardField(cardId, field.field as keyof Card, selected);
            }}
            value={value}
            >
                {field.options.map((selection) => {
                    return <option 
                        key={`${cardId}-${selection}`}  
                        value={selection}
                    >{selection}</option>
                })}
        </select>
    }

    const updateCardField = <K extends keyof Card>(
        id: number,
        field: K,
        newValue: Card[K]
    ) => {
        const newCards = cards.map(card =>
            card.id === id
                ? { ...card, [field]: newValue }
                : card
        );
        console.log(newCards);
        setCards(newCards);
    };

    const removeCard = (id: number): void => {
        setCards(cards.filter(card => card.id != id));
    }

    return (
        <div>
            <div className='horz'>
                <Label for='search-input'>Search:</Label>
                <Input 
                    id='search-input' 
                    type='text' 
                    width={'auto'}
                    onChange={(e) => setCurrentSearch(e.target.value)}
                />
            </div>
            <div style={{ maxHeight: '45vh', overflowY: 'auto', overflowX: 'auto' }}>
                <Table striped hover>
                    <thead>
                        <tr>
                        {CARD_ROW_CONFIG.map((col) => (
                            <th
                                key={`${col.field}-header`}
                                onClick={() => handleSort(col.field as SortKey)}
                                style={{ 
                                    cursor: 'pointer',
                                    position: 'sticky',
                                    top: 0,
                                    background: 'white',
                                    zIndex: 1,
                                    fontSize: '0.85rem'
                                }}
                            >
                                {col.header} {sortKey === col.field ? (sortAsc ? '▲' : '▼') : ''}
                            </th>
                        ))}
                        </tr>
                    </thead>
                    <tbody>
                        {shownCards.map((card, index) => (
                            <tr key={`card-${card.id}`}>
                                {CARD_ROW_CONFIG.map((col: CardField) => (
                                    <td key={`$card-${card.id}-${col.field}`}>
                                        {renderCellValue(col.field, card[col.field as SortKey], card.id)}
                                    </td>
                                ))}
                                    <td>
                                        <Button color='danger' onClick={() => removeCard(card.id)}>X</Button>
                                    </td>

                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};