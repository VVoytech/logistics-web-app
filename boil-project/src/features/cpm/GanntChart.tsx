import React from 'react';
import ReactFlow, { Controls, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

interface Link {
    from: number;
    to: number;
    label: string;
    duration: number;
    color: string;
}

interface GanttData {
    links: Link[];
}

interface GanttChartProps {
    ganttData: GanttData;
    timeUnit: "minuty" | "godziny" | "dni";
}

const GanttChart: React.FC<GanttChartProps> = ({ ganttData, timeUnit }) => {
    const { links } = ganttData;

    const filteredLinks = links.filter((link) => link.duration > 0);

    const calculateStartTimes = (links: Link[]) => {
        const startTimes: { [key: string]: number } = {};

        links.forEach((link) => {
            if (!startTimes[link.label]) {
                startTimes[link.label] = link.from;
            }

            const dependency = links.find((l) => l.to === link.from);
            if (dependency) {
                startTimes[link.label] = Math.max(startTimes[link.label], startTimes[dependency.label] + dependency.duration);
            }
        });

        return startTimes;
    };

    const startTimes = calculateStartTimes(filteredLinks);

    const minStartTime = Math.min(...Object.values(startTimes));

    // Funkcja generująca oś czasu z odpowiednim formatem etykiet
    const generateTimeAxis = (startDate: Date, numberOfUnits: number, timeUnit: "minuty" | "godziny" | "dni") => {
        const timeAxis = [];
        let step = 1;

        // Dostosowanie kroku w zależności od jednostki czasu
        if (timeUnit === "minuty") {
            step = 15; // Wyświetlaj co godzinę (60 minut)
        } else if (timeUnit === "godziny") {
            step = 6; // Wyświetlaj co 6 godzin
        } else if (timeUnit === "dni") {
            step = 1; // Wyświetlaj codziennie
        }

        for (let i = 0; i < numberOfUnits; i += step) {
            const currentDate = new Date(startDate);

            if (timeUnit === "minuty") {
                currentDate.setMinutes(startDate.getMinutes() + i);
            } else if (timeUnit === "godziny") {
                currentDate.setHours(startDate.getHours() + i);
            } else if (timeUnit === "dni") {
                currentDate.setDate(startDate.getDate() + i);
            }

            // Formatowanie etykiety w zależności od jednostki czasu
            let label = "";
            if (timeUnit === "minuty") {
                label = currentDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }); // Format: "12:30"
            } else if (timeUnit === "godziny") {
                label = currentDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }); // Format: "12:00"
            } else if (timeUnit === "dni") {
                label = currentDate.toLocaleDateString('pl-PL'); // Format: "01.01.2023"
            }

            timeAxis.push({
                time: i,
                label: label,
            });
        }

        return { timeAxis, step }; // Zwracamy zarówno oś czasu, jak i krok
    };

    const startDate = new Date();
    const maxTime = Math.max(...filteredLinks.map((link) => startTimes[link.label] + link.duration));
    const additionalUnits = 20; // Dodatkowe jednostki czasu do wyświetlenia
    const totalUnits = maxTime - minStartTime + 1 + additionalUnits;

    // Generowanie osi czasu z odpowiednim formatem etykiet
    const { timeAxis, step } = generateTimeAxis(startDate, totalUnits, timeUnit);

    // Dostosowanie szerokości jednostki czasu w zależności od wybranej jednostki
    const unitWidth = timeUnit === "minuty" ? 20 : timeUnit === "godziny" ? 50 : 100; // Zwiększona szerokość dla minut i godzin

    const nodes: Node[] = filteredLinks.map((link, index) => ({
        id: `node-${link.label}`,
        data: { label: `${link.label} (${link.duration}${timeUnit === "minuty" ? "m" : timeUnit === "godziny" ? "h" : "d"})` },
        position: {
            x: (startTimes[link.label] - minStartTime) * unitWidth,
            y: index * 40,
        },
        style: {
            backgroundColor: link.color,
            color: 'white',
            padding: 8,
            border: '2px solid black',
            borderRadius: '5px',
            width: `${link.duration * unitWidth}px`,
        },
    }));

    const edges: Edge[] = filteredLinks.map((link) => ({
        id: `edge-${link.label}`,
        source: `node-${link.label}`,
        target: `node-${link.label}`,
        animated: true,
        style: { strokeWidth: 2 },
    }));

    return (
        <div style={{ height: '600px', width: '100%', position: 'relative', overflowX: 'auto' }}>
            {/* Oś czasu z etykietami */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    padding: '10px 0',
                    borderBottom: '2px solid #ccc',
                    marginBottom: '20px',
                    width: `${totalUnits * unitWidth}px`,
                    marginLeft: `-${minStartTime * unitWidth}px`,
                }}
            >
                {timeAxis.map((item, index) => (
                    <div
                        key={index}
                        style={{
                            fontWeight: 'bold',
                            width: `${step * unitWidth}px`, // Szerokość odpowiadająca krokowi
                            textAlign: 'center',
                            flexShrink: 0,
                        }}
                    >
                        {item.label}
                    </div>
                ))}
            </div>

            <div style={{ width: `${totalUnits * unitWidth}px`, height: '500px', overflow: 'auto' }}>
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