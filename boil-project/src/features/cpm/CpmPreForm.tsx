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

// Definicja typu dla danych wierszy
interface Row {
    id: number;
    predecessor: string; // Poprzedzająca czynność (np. "A,B")
    duration: number;
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""); // Lista czynności (A, B, C, ...)

const processDataForGoJS = (rows: Row[]) => {
    const nodes: { key: string; label: string }[] = [];
    const links: { from: string; to: string; label: string; duration: number }[] = [];

    // Dodajemy węzeł startowy z numerem 1
    nodes.push({ key: "START", label: "1" });

    // Tworzymy węzły dla każdej czynności, zaczynając od numeru 2
    rows.forEach((row, index) => {
        const activity = alphabet[index];
        const nodeNumber = (index + 2).toString(); // Numeracja od 2
        nodes.push({ key: activity, label: nodeNumber });
    });

    // Tworzymy połączenia na podstawie poprzedników
    rows.forEach((row, index) => {
        const activity = alphabet[index];
        if (row.predecessor === "-") {
            // Jeśli nie ma poprzedników, łączymy z węzłem "1" (startowym)
            links.push({
                from: "START",
                to: activity,
                label: "", // Etykieta linii to litera czynności
                duration: row.duration,
            });
        } else {
            const predecessors = row.predecessor.split(",");
            predecessors.forEach((predecessor) => {
                links.push({
                    from: predecessor.trim(),
                    to: activity,
                    label: "", // Etykieta linii to litera czynności
                    duration: row.duration,
                });
            });
        }
    });

    return { nodes, links };
};

export const CpmPreForm = () => {
    const [rows, setRows] = useState<Row[]>([{ id: 1, predecessor: "", duration: 0 }]);

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
    /*const handleSave = () => {
        const graphData = processDataForGoJS(rows);
        console.log(graphData); // Możesz zastąpić to renderowaniem diagramu
    };*/

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
                    {/*<Button onClick={handleSave} leftSection={<IconPlus size={18} />} mt="md">
                        Zapisz i rysuj wykres
                    </Button>*/}
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