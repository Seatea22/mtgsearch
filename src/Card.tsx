export interface StandardField<T> {
    field: string;
    default: T;
    header: string;
    inputType: string;
    valueType: string;
    cssStyles: object;
}

export interface StaticNumberField extends StandardField<number> {
    specifier: 'f_static_num';
}

export interface StringField extends StandardField<string> {
    specifier: 'f_string';
}

export interface BooleanField extends StandardField<boolean> {
    specifier: 'f_boolean';
}

export interface NumberField extends StandardField<number> {
    specifier: 'f_number';
    step: number;
    min: number;
}

export interface SelectionField extends StandardField<string[]> {
    specifier: 'f_select';
    multiple: boolean;
    options: string[];
}

export interface SplitStringField extends StandardField<string[]> {
    specifier: 'f_split';
    delimiter: string;
    placeholder: string;
}

export type CardField =
    | StaticNumberField
    | StringField
    | BooleanField
    | NumberField
    | SelectionField
    | SplitStringField;

export class Card {
    id = 0;
    name = '';
    maxPrice = 0.00;
    cheapest = true;
    flexible = false;
    relative = true;
    allowedPrintings: string[] = [];
    allowedConditions: string[] = [];
    collections: string[] = [];

    constructor(obj: object) {
        if (obj) {
            Object.assign(this, obj);
        } else {
            throw new Error('Invalid object provided to Card constructor!');
        }
    }
}

export interface CardListProps {
    cards: Card[];
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
}


export const CARD_ROW_CONFIG: Array<CardField> = [
    {
        field: "id",
        default: 0,
        header: "ID",
        inputType: "none",
        valueType: "string",
        specifier: 'f_static_num',
        cssStyles: {}
    },
    {
        field: "name",
        default: "Card Name",
        header: "Name",
        inputType: "text",
        valueType: "string",
        specifier: "f_string",
        cssStyles: {}
    },
    {
        field: "maxPrice",
        default: 0.00,
        header: "Max Price",
        inputType: "number",
        valueType: "number",
        specifier: "f_number",
        cssStyles: {width: "100px"},
        min: 0.00,
        step: 0.01
    },
    {
        field: "cheapest",
        default: true,
        header: "Cheapest",
        inputType: "checkbox",
        valueType: "boolean",
        specifier: "f_boolean",
        cssStyles: {}
    },
    {
        field: "flexible",
        default: false,
        header: "Flexible",
        inputType: "checkbox",
        valueType: "boolean",
        specifier: "f_boolean",
        cssStyles: {}
    },
    {
        field: "relative",
        default: true,
        header: "Relative",
        inputType: "checkbox",
        valueType: "boolean",
        specifier: "f_boolean",
        cssStyles: {}
    },
    {
        field: "allowedPrintings",
        default: [],
        header: "Printings",
        inputType: "select",
        valueType: "array",
        specifier: "f_select",
        cssStyles: {},
        options: [
            'Normal',
            'Foil'
        ],
        multiple: true
    },
    {
        field: "allowedConditions",
        default: [],
        header: "Conditions",
        inputType: "text",
        valueType: "array",
        specifier: "f_select",
        options: [
            'Near Mint',
            'Lightly Played',
            'Moderately Played',
            'Heavily Played',
            'Damaged'
        ],
        multiple: true,
        cssStyles: {}
    },
    {
        field: "collections",
        default: [],
        header: "Collections",
        inputType: "text",
        valueType: "array",
        specifier: "f_split",
        delimiter: ";",
        placeholder: "e.g. 'Secret Lair Drop Series, Foil Edition;...'",
        cssStyles: {}
    }
];