import React from 'react';
import { useState } from 'react';
import { Card, CardListProps } from './Card'
import { Input, Button } from 'reactstrap';


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
        setNewCardName('');
    }

    return (
        <div id="add-cards" className='horz' style={{margin: "10px"}}>
            <Input 
                style={{width: "60%"}}
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
            <Button color='primary' onClick={() => addCard(newCardName)}>Add Card</Button>
        </div>
    )
}