import { useEffect, useRef } from "react";

export type TerminalLineType = "info" | "success" | "error" | "warn";

export interface TerminalLine {
    id: string;
    text: string;
    type?: TerminalLineType;
}

interface TerminalOutputProps {
    lines: TerminalLine[];
    height?: string;
    autoScroll?: boolean;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({
    lines,
    height = "320px",
    autoScroll = true,
}) => {
    const bodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (autoScroll && bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
    }, [lines, autoScroll]);

    return (
        <div
            className="terminal-body"
            ref={bodyRef}
            style={{ height }}
        >
            {lines.map(line => (
                    <div
                        key={`$line-${line.id}`}
                        className={`terminal-line terminal-${line.type ?? "info"}`}
                    >
                        <span className="terminal-text">{`> ${line.text}`}</span>
                    </div>
                ))
            }
        </div>
    );
};