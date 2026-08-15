import { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { Card } from './Card';
import { CardTable } from './CardTable';
import { AddCardBar } from './AddCard';
import { GM_setValue } from '$';
import { TcgPlayerShop } from './Shop';


export const TcgPlayerSearch: React.FC<TcgPlayerShop> = ({ name, id }) => {
    const [modal, setModal] = useState(false);
    const [cards, setCards] = useState<Card[]>([]);

    const toggle = () => setModal(!modal);

    return (
        <div id='search-modal'>
            <Button 
                color='primary' 
                onClick={toggle} 
                style={{ 
                    position: 'fixed', 
                    zIndex: 9999 
                }}
            >
                Card Search
            </Button>
            <Modal size={'xl'} isOpen={modal} toggle={toggle}>
                <ModalHeader toggle={toggle}>Card List Search for {name}</ModalHeader>
                <ModalBody>
                    <CardTable cards={cards} setCards={setCards}/>
                    <AddCardBar cards={cards} setCards={setCards}/>
                </ModalBody>
                <ModalFooter/>
            </Modal>
        </div>
    )
}

export default TcgPlayerSearch;