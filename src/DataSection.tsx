import { Button, Input, Label } from "reactstrap";
import { Card, CardListProps } from "./Card";
import { GM_setClipboard, GM_cookie, GM_download } from '$';
import './assets/styles.css';
import { useEffect, useMemo, useRef, useState } from "react";
import { TcgPlayerScriptConfig } from "./SiteConfig";
import { SearchSettings } from "./SearchPanel";


const MODAL_KEY = 'modalVisible';
export const setModalVisibility = (value: boolean, hostname: string) => {
    GM_cookie.set({
        name: MODAL_KEY,
        domain: `.${hostname}`,
        path: '/',
        value: String(value),
        expirationDate: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30) // 30 days
    }, (err) => {
        console.log('SET result — err:', err);
        if (err) {
            console.error(err);
        } else {
            console.log('Cookie set successfully.');
        }
    });
}

export const getModalVisibility = (hostname: string): Promise<boolean> => {
    return new Promise((resolve) => {
        GM_cookie.list({name: MODAL_KEY, domain: `.${hostname}`}, (cookies, error) => {
            if (error || !cookies) {
                console.error(error, cookies);
                resolve(false);
            } else if (cookies.length > 1) {
                console.error(cookies);
                GM_cookie.delete({name: MODAL_KEY}, () => {
                    if (error) {
                        console.error(error);
                    } else {
                        console.log('Cookie deleted successfully');
                    }
                })
                resolve(false);
            } else if (cookies.length === 0) {
                setModalVisibility(false, hostname);
                resolve(false);
            } else {
                resolve(cookies[0].value === 'true');
            }
        });
    });
}

interface DataSectionProps extends CardListProps {
    searchSettings: SearchSettings;
    setSearchSettings: React.Dispatch<React.SetStateAction<SearchSettings>>;
}

interface DataFileFormat {
    maxMargin: number;
    marginPercent: number;
    comparisonRatio: number;
    cards: Card[];
}

export const DataSection: React.FC<DataSectionProps> = ({ cards, setCards, searchSettings }) => {
    const [statusText, setStatusText] = useState('');
    const [statusColor, setStatusColor] = useState('danger');
    const STATUS_DURATION = 3000;
    const STORAGE_KEY = 'cardTableStorage'; 

    const showStatus = (text: string, error: boolean) => {
        setStatusColor(error ? 'danger' : 'primary');
        setStatusText(text);
        setTimeout(() => setStatusText(''), STATUS_DURATION);
    }

    const dataToJson = (): string => {
        const data: DataFileFormat = {
            cards: cards,
            maxMargin: searchSettings.maxMargin,
            marginPercent: searchSettings.marginPercent,
            comparisonRatio: searchSettings.comparisonRatio
        }
        return JSON.stringify(data);
    }

    const exportCards = () => {
        const jsonString = dataToJson();
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        GM_download({
            url: url,
            name: 'card-price-table.json',
            saveAs: true
        })
        URL.revokeObjectURL(url);
        showStatus('Exported cards.', false);
    }

    const dataToSearchSettings = (data: DataFileFormat) => {
        searchSettings = {
            maxMargin: data.maxMargin, 
            marginPercent: data.marginPercent, 
            comparisonRatio: data.comparisonRatio,
            sleepTime: searchSettings.sleepTime
        };
    }

    const fileInputRef = useRef<HTMLInputElement>(null);
    const importCards = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target?.files || e.target.files.length === 0) {
            showStatus("Failed to import file!", true);
            return;
        }
        const file = e.target.files[0];

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const parsed: DataFileFormat = JSON.parse(String(evt.target?.result));
                if (confirm("Do you want to overwrite your current list?")) {
                    dataToSearchSettings(parsed);
                    setCards(parsed.cards.map((card) => new Card(card)));
                    showStatus('Imported cards.', false);
                }
            } catch {
                showStatus('Failed to parse file — invalid JSON.', true);
            }
        };
        reader.onerror = () => {
            showStatus('Failed to read file.', true);
        };

        reader.readAsText(file);
        e.target.value = '';
    }

    const loadCardsFromStorage = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                showStatus('No saved cards found.', true);
                return;
            }
            const parsed: DataFileFormat = JSON.parse(raw);
            dataToSearchSettings(parsed);
            setCards(parsed.cards.map((card) => new Card(card)));
            showStatus('Loaded cards from storage.', false);
        } catch {
            showStatus('Failed to load saved cards — data corrupted.', true);
        }
    }

    
    const saveCardsToStorage = () => {
        try {
            localStorage.setItem(STORAGE_KEY, dataToJson());
            showStatus('Saved cards to storage.', false);
        } catch (err) {
            showStatus(`Failed to save to storage: ${err}`, true);
        }
    }

    const copyCardsToClipboard = () => {
        const exported = dataToJson();
        try {
            GM_setClipboard(exported, 'json');
            showStatus('Copied to clipboard.', false);
        } catch (err) {
            showStatus('Failed to copy to clipboard.', true);
        }
    }

    useEffect(() => {
        loadCardsFromStorage();
    }, []);

    return (
        <div id="data-section">
            <div className="horz">
                <Input
                    id="fileInput"
                    name="file"
                    type="file"
                    innerRef={fileInputRef}
                    onChange={importCards}
                    accept=".json"
                    className="d-none"
                />
                <Button onClick={() => fileInputRef.current?.click()}>Import Cards (JSON)</Button>
                <Button onClick={exportCards}>Export Cards (JSON)</Button>
                <Button onClick={saveCardsToStorage}>Save Cards to Storage</Button>
                <Button onClick={copyCardsToClipboard}>Copy Cards to Clipboard</Button>
            </div>
            <p className={`text-${statusColor}`}>{statusText}</p>
        </div>
    );
}