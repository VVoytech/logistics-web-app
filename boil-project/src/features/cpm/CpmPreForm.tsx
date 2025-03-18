import {
    Button,
    Container,
    Table,
    TextInput,
    NumberInput,
    Card
} from "@mantine/core";
import { useState } from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import GraphComponent from "./GraphComponent";

interface Row {
    id: number;
    predecessor: string;
    duration: number;
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""); // Lista czynności (A, B, C, ...)

const processDataForGoJS = (rows: Row[]) => {
    // Dodajemy węzeł początkowy (startowy)
    const nodes = [
        { key: 0, text: "Start" } // Węzeł startowy
    ];

    const links: { from: number, to: number, label: string, duration: number }[] = [];
    const nodeMap: { [key: string]: number } = {}; // Mapowanie poprzedników na numery węzłów
    const mergedPredecessors: { [key: string]: number } = {}; // Zmienna do przechowywania wspólnych węzłów

    // Dodajemy węzły dla każdej czynności
    rows.forEach((row, index) => {
        const currentNode = index + 1; // Węzeł aktualnej czynności
        const taskLabel = alphabet[index]; // Etykieta czynności (np. A, B, C)

        // Dodajemy węzeł dla aktualnej czynności, jeśli jeszcze nie istnieje
        if (!nodeMap[taskLabel]) {
            nodeMap[taskLabel] = currentNode;
            nodes.push({ key: currentNode, text: taskLabel }); // Tekst to etykieta czynności
        }

        const predecessors = row.predecessor.split(",").map(p => p.trim());

        // Jeśli brak poprzednika, połączmy z węzłem 0 (startowym)
        if (row.predecessor.trim() === "-") {
            links.push({
                from: 0,
                to: currentNode,
                label: `${taskLabel} ${row.duration}`,
                duration: row.duration
            });
        } else {
            // Jeśli są poprzednicy, sprawdzamy, czy potrzebujemy połączyć je w jeden wspólny węzeł
            if (predecessors.length === 1) {
                // Jeżeli tylko jeden poprzednik, nie ma potrzeby tworzenia wspólnego węzła
                const predecessorNode = nodeMap[predecessors[0]];
                links.push({
                    from: predecessorNode,
                    to: currentNode,
                    label: `${taskLabel} ${row.duration}`,
                    duration: row.duration
                });
            } else {
                // Jeśli więcej niż jeden poprzednik, musimy połączyć je w jeden węzeł
                const commonPredecessorKey = predecessors.join(",");
                let commonNode = mergedPredecessors[commonPredecessorKey];

                if (!commonNode) {
                    // Tworzymy nowy wspólny węzeł
                    commonNode = nodes.length + 1;
                    mergedPredecessors[commonPredecessorKey] = commonNode;
                    nodes.push({ key: commonNode, text: `Merged ${commonNode}` });

                    // Łączymy poprzedników z nowym wspólnym węzłem
                    predecessors.forEach(p => {
                        const predecessorNode = nodeMap[p] || commonNode;
                        links.push({
                            from: predecessorNode,
                            to: commonNode,
                            label: `Merged ${p}`,
                            duration: 0
                        });
                    });
                }

                // Teraz połączmy wspólny węzeł z aktualną czynnością
                links.push({
                    from: commonNode,
                    to: currentNode,
                    label: `${taskLabel} ${row.duration}`,
                    duration: row.duration
                });
            }
        }
    });

    return { nodes, links };
};


export const CpmPreForm = () => {
    const [rows, setRows] = useState<Row[]>([{ id: 1, predecessor: "", duration: 0 }]);

    const addRow = () => {
        setRows([...rows, { id: rows.length + 1, predecessor: "", duration: 0 }]);
    };

    const removeRow = (id: number) => {
        setRows(rows.filter((row) => row.id !== id));
    };

    const updateRow = (id: number, field: keyof Row, value: string | number | null) => {
        setRows(rows.map((row) =>
            row.id === id ? { ...row, [field]: value ?? 0 } : row
        ));
    };

    const handleSave = () => {
        const graphData = processDataForGoJS(rows);
        // Przesyłamy dane do komponentu GraphComponent
        console.log(graphData); // Możesz zastąpić to renderowaniem diagramu
    };

    return (
        <div style={{ display: "flex", gap: "2vw", padding: "2vw" }}>
            <Card
                shadow="md"
                style={{
                    width: "25vw",
                    height: "80vh",
                    overflowY: "auto",
                    padding: "20px",
                    borderRadius: "12px",
                    backgroundColor: "#f9f9f9",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                }}
            >
                <Container>
                    <Table striped highlightOnHover>
                        <thead>
                        <tr>
                            <th>Czynności</th>
                            <th>Czynność poprzedzająca</th>
                            <th>Czas trwania</th>
                            <th>Usuń</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((row, index) => (
                            <tr key={row.id}>
                                <td>{alphabet[index]}</td> {/* Czynność A, B, C... */}
                                <td>
                                    <TextInput
                                        value={row.predecessor}
                                        onChange={(e) => updateRow(row.id, "predecessor", e.target.value)}
                                        placeholder="Poprzednia czynność"
                                    />
                                </td>
                                <td>
                                    <NumberInput
                                        value={row.duration}
                                        onChange={(value) => updateRow(row.id, "duration", value)}
                                        min={0}
                                        step={1}
                                        hideControls
                                        placeholder="Czas"
                                    />
                                </td>
                                <td>
                                    <Button color="red" onClick={() => removeRow(row.id)} disabled={rows.length === 1}>
                                        <IconTrash size={18} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                    <Button onClick={addRow} leftSection={<IconPlus size={18} />} mt="md">
                        Dodaj wiersz
                    </Button>
                    <Button onClick={handleSave} leftSection={<IconPlus size={18} />} mt="md">
                        Zapisz i rysuj wykres
                    </Button>
                </Container>
            </Card>

            {/* Sekcja wykresu */}
            <Card
                shadow="md"
                style={{
                    width: "65vw",
                    height: "80vh",
                    padding: "20px",
                    borderRadius: "12px",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <GraphComponent data={processDataForGoJS(rows)} />
            </Card>
        </div>
    );
};
