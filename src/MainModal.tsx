import { useEffect, useRef, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, UncontrolledAccordion, AccordionHeader, AccordionItem, AccordionBody } from 'reactstrap';
import { Card } from './Card';
import { CardTable } from './CardTable';
import { AddCardBar } from './AddCard';
import { DataSection, getModalVisibility, setModalVisibility } from './DataSection';
import { TcgPlayerScriptConfig, ScriptConfigProps } from './SiteConfig';
import { SearchPanel } from './SearchPanel';



export const TcgPlayerSearch: React.FC<ScriptConfigProps> = ({ config }) => {
    const [modal, setModal] = useState(false);
    const [cards, setCards] = useState<Card[]>([]);

    useEffect(() => {
        (async () => {
            const visible = await getModalVisibility(config.hostname);
            setModal(visible);
        })();
    }, []);

    const toggleModal = () => {
        setModal(!modal);
        setModalVisibility(!modal, config.hostname);
    }

    return (
        <div id='search-modal'>
            <Button 
                color='primary' 
                onClick={toggleModal} 
                style={{ 
                    position: 'fixed', 
                    zIndex: 9999 
                }}
            >
                Card Search
            </Button>
            <Modal size={'xl'} isOpen={modal} toggle={toggleModal}>
                <ModalHeader toggle={toggleModal}>Card List Search for {config.shopInfo.name}</ModalHeader>
                <ModalBody className='fixed-height-modal'>
                    <UncontrolledAccordion 
                        defaultOpen={[
                            '1',
                            '2'
                        ]}
                        stayOpen
                        toggle={() => {}}
                    >
                        <AccordionItem>
                            <AccordionHeader targetId='1'>
                                Card List Table
                            </AccordionHeader>
                            <AccordionBody accordionId='1'>
                                <CardTable cards={cards} setCards={setCards}/>
                                <AddCardBar cards={cards} setCards={setCards}/>
                            </AccordionBody>
                        </AccordionItem>
                        <AccordionItem>
                            <AccordionHeader targetId='2'>
                                Search Panel
                            </AccordionHeader>
                            <AccordionBody accordionId='2'>
                                <SearchPanel cards={cards} setCards={setCards} searchSettings={config.searchSettings} searchApi={config.searchApi}/>
                            </AccordionBody>
                        </AccordionItem>
                    </UncontrolledAccordion>
                </ModalBody>
                <ModalFooter>
                    <DataSection searchSettings={config.searchSettings} cards={cards} setCards={setCards}/>
                </ModalFooter>
            </Modal>
        </div>
    )
}

export default TcgPlayerSearch;