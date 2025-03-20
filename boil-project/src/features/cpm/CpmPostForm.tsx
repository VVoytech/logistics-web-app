import {
    Button,
    Container,
    Table,
    TextInput,
    NumberInput,
    Card
} from "@mantine/core";
import {useEffect, useState} from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import GraphComponent from "./GraphComponent";

// Definicja typu dla danych wierszy
interface Row {
    id: number;
    predecessor: string;
    duration: number;
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""); // Lista czynności (A, B, C, ...)

const processDataForGoJS = (rows: { predecessor: string; duration: number }[]) => {
    const nodes: { key: number; t0: number; t1: number; L: number }[] = [{ key: 1, t0: 0, t1: 0, L: 0 }];
    const links: { from: number; to: number; label: string; duration: number,color:string }[] = [];
    const usedKeys = new Set<number>();
    const t0Map = new Map<number, number>();

    usedKeys.add(1);
    t0Map.set(1, 0);

    rows.forEach((row, index) => {
        if (row.predecessor) {
            const [fromNode, toNode] = row.predecessor.split('-').map(Number);

            if (!usedKeys.has(fromNode)) {
                nodes.push({ key: fromNode, t0: 0, t1: 0, L: 0 });
                usedKeys.add(fromNode);
                t0Map.set(fromNode, 0);
            }
            if (!usedKeys.has(toNode)) {
                nodes.push({ key: toNode, t0: 0, t1: 0, L: 0 });
                usedKeys.add(toNode);
                t0Map.set(toNode, 0);
            }

            links.push({
                from: fromNode,
                to: toNode,
                label: String.fromCharCode(65 + index),
                duration: row.duration,
                color:"black"
            });

            const newT0 = (t0Map.get(fromNode) || 0) + row.duration;
            t0Map.set(toNode, Math.max(t0Map.get(toNode) || 0, newT0));
        }
    });

    nodes.forEach(node => {
        node.t0 = t0Map.get(node.key) || 0;
    });

    return { nodes, links };
};


export const CpmPostForm = () => {
    const [graphData, setGraphData] = useState<{
        nodes: { key: number; t0: number; t1: number; L: number }[];
        links: { from: number; to: number; label: string; duration: number,color:string }[];
    }>({ nodes: [], links: [] });
    const [rows, setRows] = useState<Row[]>([{ id: 1, predecessor: "", duration: 0 }]);

    useEffect(() => {
        const newGraphData = processDataForGoJS(rows);
        setGraphData(newGraphData);
    },[rows]);

    // Funkcja dodająca nowy wiersz
    const addRow = () => {
        setRows([...rows, { id: rows.length + 1, predecessor: "", duration: 0 }]);
    };

    // Funkcja usuwająca wiersz
    const removeRow = (id: number) => {
        setRows(rows.filter((row) => row.id !== id));
    };

    // Funkcja aktualizująca wartość pola w wierszu
    const updateRow = (id: number, field: keyof Row, value: string | number | null) => {
        setRows(rows.map((row) =>
            row.id === id ? { ...row, [field]: value ?? 0 } : row
        ));
    };

    const handleSave = () => {
        const newGraphData = processDataForGoJS(rows);

        // Krok 1: Inicjalizacja t1 dla wszystkich węzłów
        newGraphData.nodes.forEach(node => {
            node.t1 = Infinity; // Ustawiamy t1 na nieskończoność, aby później znaleźć minimum
        });

        // Krok 2: Ustawienie t1 dla ostatniego węzła (zdarzenia końcowego)
        const lastNode = newGraphData.nodes[newGraphData.nodes.length - 1];
        lastNode.t1 = lastNode.t0; // t1 ostatniego węzła jest równe jego t0

        // Krok 3: Przejście przez węzły od końca i aktualizacja t1 dla poprzedników
        for (let i = newGraphData.nodes.length - 1; i >= 0; i--) {
            const currentNode = newGraphData.nodes[i];

            // Znajdź wszystkie połączenia, gdzie currentNode jest następnikiem (toNode)
            const incomingLinks = newGraphData.links.filter(link => link.to === currentNode.key);

            // Dla każdego połączenia aktualizuj t1 poprzednika (fromNode)
            incomingLinks.forEach(link => {
                const fromNode = newGraphData.nodes.find(node => node.key === link.from);

                if (fromNode) {
                    // Oblicz t1 dla poprzednika jako t1 aktualnego węzła minus duration
                    const t1Candidate = currentNode.t1 - link.duration;

                    // Jeśli obliczona wartość jest mniejsza niż aktualne t1 poprzednika, zaktualizuj t1
                    if (t1Candidate < fromNode.t1) {
                        fromNode.t1 = t1Candidate;
                    }
                }
            });
        }
        newGraphData.nodes.forEach(node => {
            if (node.t1 === Infinity) {
                node.t1 = node.t0; // Jeśli t1 nie zostało zaktualizowane, ustaw je na t0
            }
        });

        newGraphData.nodes.forEach(node => {
            node.L=node.t1-node.t0;
        });

        // Krok 5: Znajdź ścieżkę krytyczną
        const criticalPath: string[] = []; // Tablica na etykiety połączeń ścieżki krytycznej
        let currentNode = newGraphData.nodes[0]; // Zaczynamy od pierwszego węzła

        while (currentNode) {
            // Znajdź wszystkie połączenia wychodzące z bieżącego węzła
            const outgoingLinks = newGraphData.links.filter(link => link.from === currentNode.key);

            // Znajdź połączenie, które prowadzi do węzła z t0 = t1 i jest spójne z różnicą t0
            const nextLink = outgoingLinks.find(link => {
                const toNode = newGraphData.nodes.find(node => node.key === link.to);
                return toNode && toNode.t0 === toNode.t1 && toNode.t0 === currentNode.t0 + link.duration;
            });

            if (nextLink) {
                criticalPath.push(nextLink.label); // Dodaj etykietę połączenia do ścieżki krytycznej
                currentNode = newGraphData.nodes.find(node => node.key === nextLink.to)!; // Przejdź do następnego węzła
            } else {
                break; // Zakończ, jeśli nie ma więcej węzłów na ścieżce krytycznej
            }
        }


        newGraphData.links.forEach(link => {

            for(let i=0;i<criticalPath.length;i++) {
                if(link.label===criticalPath[i]){
                    link.color="red";
                }
            }
        });

        newGraphData.nodes.slice(0, -1).forEach(node => { // Pomijamy ostatni węzeł
            const outgoingLinks = newGraphData.links.filter(link => link.from === node.key);

            if (outgoingLinks.length === 0) {
                // Jeśli nie ma połączeń wychodzących, znajdź najbliższy węzeł (z najmniejszym t0)
                const nearestNode = newGraphData.nodes
                    .filter(n => n.key !== node.key && n.t0 > node.t0) // Tylko węzły z większym t0
                    .sort((a, b) => a.t0 - b.t0)[0]; // Sortuj po t0 i wybierz pierwszy

                if (nearestNode) {
                    // Dodaj nowe połączenie
                    const newLink = {
                        from: node.key,
                        to: nearestNode.key,
                        label: "p", // Etykieta automatycznego połączenia
                        duration: 0, // Czas trwania to różnica t0
                        color: "gray" // Kolor dla automatycznego połączenia
                    };
                    newGraphData.links.push(newLink);
                }
            }
        });

        setGraphData(newGraphData);
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
                <GraphComponent data={graphData} />
            </Card>
        </div>
    );
};
