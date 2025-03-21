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
    predecessor: string; // Poprzedzająca czynność (np. "A,B")
    duration: number;
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""); // Lista czynności (A, B, C, ...)

const processDataForGoJS = (rows: { predecessor: string; duration: number }[]) => {
    const nodes: { key: string; t0: number; t1: number; L: number; label: string }[] = [
        { key: 'START', t0: 0, t1: 0, L: 0, label: '1' } // Węzeł startowy
    ];
    const links: { from: string; to: string; label: string; duration: number; color: string }[] = [];
    const usedKeys = new Set<string>();
    const t0Map = new Map<string, number>();

    usedKeys.add('START');
    t0Map.set('START', 0);

    // Lista dostępnych liter dla nazw czynności
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    rows.forEach((row, index) => {
        const activity = alphabet[index]; // Przypisujemy literę do czynności (A, B, C, ...)
        const predecessors = row.predecessor.split(',').map(p => p.trim()); // Dzielimy poprzedników

        // Dodajemy węzeł dla aktualnej czynności, jeśli jeszcze nie istnieje
        if (!usedKeys.has(activity)) {
            nodes.push({ key: activity, t0: 0, t1: 0, L: 0, label: (index + 2).toString() });
            usedKeys.add(activity);
            t0Map.set(activity, 0);
        }

        // Tworzymy połączenia na podstawie poprzedników
        if (predecessors[0] === '-') {
            // Jeśli nie ma poprzedników, łączymy z węzłem START
            links.push({
                from: 'START',
                to: activity,
                label: '',
                duration: row.duration,
                color: 'black'
            });

            // Aktualizujemy t0 dla węzła
            const newT0 = (t0Map.get('START') || 0) + row.duration;
            t0Map.set(activity, Math.max(t0Map.get(activity) || 0, newT0));
        } else {
            // Łączymy z każdym poprzednikiem
            predecessors.forEach((predecessor) => {
                if (!usedKeys.has(predecessor)) {
                    // Jeśli poprzednik nie istnieje, dodajemy go
                    nodes.push({ key: predecessor, t0: 0, t1: 0, L: 0, label: (alphabet.indexOf(predecessor) + 2).toString() });
                    usedKeys.add(predecessor);
                    t0Map.set(predecessor, 0);
                }

                links.push({
                    from: predecessor,
                    to: activity,
                    label: '',
                    duration: row.duration,
                    color: 'black'
                });

                // Aktualizujemy t0 dla węzła
                const newT0 = (t0Map.get(predecessor) || 0) + row.duration;
                t0Map.set(activity, Math.max(t0Map.get(activity) || 0, newT0));
            });
        }
    });

    // Dodajemy węzeł KONIEC
    nodes.push({ key: 'KONIEC', t0: 0, t1: 0, L: 0, label: (rows.length + 2).toString() });

    // Znajdujemy węzły, które nie mają wychodzących połączeń
    const nodesWithoutOutgoingLinks = new Set(nodes.map(node => node.key));
    links.forEach(link => {
        nodesWithoutOutgoingLinks.delete(link.from);
    });

    // Łączymy węzły bez wychodzących połączeń z węzłem KONIEC
    nodesWithoutOutgoingLinks.forEach(nodeKey => {
        if (nodeKey !== 'KONIEC') { // Nie łączymy KONIEC z samym sobą
            links.push({
                from: nodeKey,
                to: 'KONIEC',
                label: '',
                duration: 0,
                color: 'black'
            });

            // Aktualizujemy t0 dla węzła KONIEC
            const nodeT0 = t0Map.get(nodeKey) || 0;
            t0Map.set('KONIEC', Math.max(t0Map.get('KONIEC') || 0, nodeT0));
        }
    });

    // Aktualizujemy t0 dla wszystkich węzłów
    nodes.forEach(node => {
        node.t0 = t0Map.get(node.key) || 0;
    });

    return { nodes, links };
};

export const CpmPreForm = () => {
    const [graphData, setGraphData] = useState<{
        nodes: { key: string; t0: number; t1: number; L: number, label:string}[];
        links: { from: string; to: string; label: string; duration: number,color:string }[];
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

    // Funkcja obsługująca zapis i rysowanie wykresu
    const handleSave = () => {
        const graphData = processDataForGoJS(rows);
        console.log(graphData);
        setGraphData(graphData);
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
                                        placeholder="Poprzednia czynność (np. A,B lub -)"
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