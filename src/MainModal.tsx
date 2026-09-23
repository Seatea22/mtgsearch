import { useEffect, useRef, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, UncontrolledAccordion, AccordionHeader, AccordionItem, AccordionBody } from 'reactstrap';
import { Card } from './Card';
import { CardTable } from './CardTable';
import { AddCardBar } from './AddCard';
import { DataSection, getModalVisibility, setModalVisibility } from './DataSection';
import { TcgPlayerScriptConfig, ScriptConfigProps } from './SiteConfig';
import { SearchPanel, SearchSettings } from './SearchPanel';
import { TcgPlayerApi } from './PlatformApi';



export const TcgPlayerSearch: React.FC<ScriptConfigProps> = ({ config, setConfig }) => {
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

    const updateGlobalSearchSettings = (searchSettings: SearchSettings) => {
        const newConfig = new TcgPlayerScriptConfig(config);
        newConfig.searchSettings = searchSettings;
        setConfig(newConfig);
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
            <Modal className="main-modal" isOpen={modal} toggle={toggleModal}>
                <ModalHeader toggle={toggleModal}>Card List Search for {config.shopInfo.name}</ModalHeader>
                <ModalBody className='fixed-height-modal'>
                    <UncontrolledAccordion 
                        defaultOpen={[
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
                                <SearchPanel 
                                    cards={cards} 
                                    setCards={setCards} 
                                    searchSettings={config.searchSettings} 
                                    searchApi={config.searchApi}
                                    setSearchSettings={updateGlobalSearchSettings}
                                />
                            </AccordionBody>
                        </AccordionItem>
                    </UncontrolledAccordion>
                </ModalBody>
                <ModalFooter>
                    <DataSection 
                        searchSettings={config.searchSettings} 
                        setSearchSettings={updateGlobalSearchSettings}
                        cards={cards} 
                        setCards={setCards}
                    />
                </ModalFooter>
            </Modal>
        </div>
    )
}

export default TcgPlayerSearch;