import React, { useEffect } from 'react';
import { useState, useMemo, JSX } from 'react';
import { Card, CardField, CardListProps, CARD_ROW_CONFIG } from './Card'
import { Input, Table, Button } from 'reactstrap';


export const AddCardBar: React.FC<CardListProps> = ({ cards, setCards }) => {
    const [newCardName, setNewCardName] = useState("");

    const addCard = (name: string) => {
        const ids = new Set(cards.map(card => card.id));

        let lowest = 1;
        while (ids.has(lowest)) {
            lowest++;
        }

        const newCard = new Card({id: lowest, name: name});
        const updated = [...cards, newCard];
        setCards(updated);
        console.log(updated);
    }

    return (
        <div id="add-cards" style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            alignContent: "stretch",
            gap: "8px"
        }}>
            <Input 
                style={{width: "20%"}}
                id='new-card-field' 
                type='text' 
                value={newCardName}
                onChange={(e) => setNewCardName(e.currentTarget.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        addCard(e.currentTarget.value);
                    }
            }}></Input>
            <Button onClick={() => addCard(newCardName)}>Add Card</Button>
        </div>
    )
}