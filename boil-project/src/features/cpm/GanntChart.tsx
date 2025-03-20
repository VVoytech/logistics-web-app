import React from 'react';
import ReactFlow, { Controls, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

// Definiowanie typu dla linku
interface Link {
    from: number;
    to: number;
    label: string;
    duration: number;
    color: string;
}

// Definiowanie typu dla ganttData
interface GanttData {
    links: Link[];
}

// Definiowanie typu dla propsów komponentu GanttChart
interface GanttChartProps {
    ganttData: GanttData;
}

const GanttChart: React.FC<GanttChartProps> = ({ ganttData }) => {
    const { links } = ganttData;

    // Obliczanie czasu rozpoczęcia dla każdego zadania
    const calculateStartTimes = (links: Link[]) => {
        const startTimes: { [key: string]: number } = {};

        links.forEach((link) => {
            if (!startTimes[link.label]) {
                // Jeśli zadanie nie ma jeszcze czasu rozpoczęcia, ustawiamy je na podstawie `from`
                startTimes[link.label] = link.from;
            }

            // Jeśli zadanie ma zależność (np. B musi zacząć się po A), aktualizujemy jego czas rozpoczęcia
            const dependency = links.find((l) => l.to === link.from);
            if (dependency) {
                startTimes[link.label] = Math.max(startTimes[link.label], startTimes[dependency.label] + dependency.duration);
            }
        });

        return startTimes;
    };

    const startTimes = calculateStartTimes(links);

    // Znajdź minimalny czas rozpoczęcia (pierwszy dzień)
    const minStartTime = Math.min(...Object.values(startTimes));

    // Funkcja do generowania osi czasu z datami (w formacie "dd.mm.rrrr")
    const generateTimeAxis = (startDate: Date, numberOfDays: number) => {
        const timeAxis = [];
        for (let i = 0; i < numberOfDays; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i); // Dodajemy dni
            timeAxis.push(currentDate.toLocaleDateString('pl-PL')); // Format: "dd.mm.rrrr"
        }
        return timeAxis;
    };

    // Ustalamy datę początkową (np. dzisiaj)
    const startDate = new Date();
    const maxTime = Math.max(...links.map((link) => startTimes[link.label] + link.duration));
    const additionalDays = 20; // Dodatkowe dni do wyświetlenia
    const totalDays = maxTime - minStartTime + 1 + additionalDays; // Całkowita liczba dni
    const timeAxis = generateTimeAxis(startDate, totalDays); // Generujemy oś czasu

    // Szerokość jednego dnia w pikselach
    const dayWidth = 100; // 100px na dzień

    // Tworzenie węzłów (nodes)
    const nodes: Node[] = links.map((link, index) => ({
        id: `node-${link.label}`,
        data: { label: `${link.label} (${link.duration}d)` },
        position: {
            x: (startTimes[link.label] - minStartTime) * dayWidth, // Przesunięcie względem początku osi czasu
            y: index * 40, // Odstęp na osi Y
        },
        style: {
            backgroundColor: link.color,
            color: 'white',
            padding: 8,
            border: '2px solid black',
            borderRadius: '5px',
            width: `${link.duration * dayWidth}px`, // Szerokość węzła proporcjonalna do liczby dni
        },
    }));

    // Tworzenie krawędzi (edges)
    const edges: Edge[] = links.map((link) => ({
        id: `edge-${link.label}`,
        source: `node-${link.label}`,
        target: `node-${link.label}`,
        animated: true,
        style: { strokeWidth: 2 },
    }));

    return (
        <div style={{ height: '600px', width: '100%', position: 'relative', overflowX: 'auto' }}>
            {/* Oś czasu z datami */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    padding: '10px 0',
                    borderBottom: '2px solid #ccc',
                    marginBottom: '20px',
                    width: `${totalDays * dayWidth}px`, // Szerokość osi czasu odpowiada całkowitej liczbie dni
                    marginLeft: `-${minStartTime * dayWidth}px`, // Przesunięcie osi czasu w lewo
                }}
            >
                {timeAxis.map((date, index) => (
                    <div
                        key={index}
                        style={{
                            fontWeight: 'bold',
                            width: `${dayWidth}px`, // Szerokość jednego dnia
                            textAlign: 'center',
                            flexShrink: 0, // Zapobiega zmniejszaniu szerokości
                        }}
                    >
                        {date}
                    </div>
                ))}
            </div>

            <div style={{ width: `${totalDays * dayWidth}px`, height: '500px', overflow: 'auto' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    zoomOnScroll={false}
                    zoomOnPinch={false}
                    zoomOnDoubleClick={false}
                    panOnScroll
                >
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
};

export default GanttChart;