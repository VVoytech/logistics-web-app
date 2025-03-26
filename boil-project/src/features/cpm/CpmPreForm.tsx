import {
    Button,
    Container,
    Table,
    TextInput,
    NumberInput,
    Card,
    Text, Select, Flex, FileInput, Menu, Divider
} from "@mantine/core";
import { useEffect, useState } from "react";
import {
    IconCategory2,
    IconDeviceFloppy,
    IconHome,
    IconPlus,
    IconSchema,
    IconTrash, IconTruck,
    IconUpload
} from "@tabler/icons-react";
import GraphComponentPre from "./GraphComponentPre";
import GanttChart from "./GanntChart.tsx";
import * as XLSX from "xlsx";
import {useNavigate} from "react-router-dom";

// Definicja typu dla danych wierszy
interface Row {
    id: number;
    predecessor: string; // Poprzedzająca czynność
    duration: number;
}

// Definicja typu dla GraphData
interface GraphData {
    nodes: { key: number; t0: number; t1: number; L: number; label: string }[];
    links: { from: number; to: number; label: string; duration: number; color: string }[];
}

// Definicja typu dla GanttData
interface GanttData {
    links: { from: number; to: number; label: string; duration: number; color: string }[];
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""); // Lista czynności

const processDataForGoJS = (rows: { predecessor: string; duration: number }[]) => {
    const nodes: { key: number; t0: number; t1: number; L: number; label: string }[] = [
        { key: 1, t0: 0, t1: 0, L: 0, label: 'START' } // Węzeł startowy (key = 1, label = 'START')
    ];
    const links: { from: number; to: number; label: string; duration: number; color: string }[] = [];
    const usedKeys = new Set<number>();
    const t0Map = new Map<number, number>();

    usedKeys.add(1); // Węzeł startowy ma key = 1
    t0Map.set(1, 0);

    rows.forEach((row, index) => {
        const activity = index + 2; // Przypisujemy numer do czynności
        const predecessors = row.predecessor.split(',').map(p => p.trim()); // Dzielimy poprzedników

        // Dodajemy węzeł dla aktualnej czynności, jeśli jeszcze nie istnieje
        if (!usedKeys.has(activity)) {
            nodes.push({ key: activity, t0: 0, t1: 0, L: 0, label: alphabet[index] });
            usedKeys.add(activity);
            t0Map.set(activity, 0);
        }

        // Tworzymy połączenia na podstawie poprzedników
        if (predecessors[0] === '-') {
            // Jeśli nie ma poprzedników, łączymy z węzłem START (key = 1)
            links.push({
                from: 1, // Węzeł startowy
                to: activity,
                label: `START-${alphabet[index]}`,
                duration: row.duration,
                color: 'black'
            });

            // Aktualizujemy t0 dla węzła
            const newT0 = (t0Map.get(1) || 0) + row.duration;
            t0Map.set(activity, Math.max(t0Map.get(activity) || 0, newT0));
        } else {
            // Łączymy z każdym poprzednikiem
            predecessors.forEach((predecessor) => {
                const predecessorKey = alphabet.indexOf(predecessor) + 2; // Konwertujemy literę na numer

                if (!usedKeys.has(predecessorKey)) {
                    // Jeśli poprzednik nie istnieje, dodajemy go
                    nodes.push({ key: predecessorKey, t0: 0, t1: 0, L: 0, label: predecessor });
                    usedKeys.add(predecessorKey);
                    t0Map.set(predecessorKey, 0);
                }

                links.push({
                    from: predecessorKey,
                    to: activity,
                    label: `${predecessor}-${alphabet[index]}`,
                    duration: row.duration,
                    color: 'black'
                });

                // Aktualizujemy t0 dla węzła
                const newT0 = (t0Map.get(predecessorKey) || 0) + row.duration;
                t0Map.set(activity, Math.max(t0Map.get(activity) || 0, newT0));
            });
        }
    });

    // Dodajemy węzeł KONIEC
    const endNodeKey = rows.length + 2; // Numer dla węzła KONIEC
    nodes.push({ key: endNodeKey, t0: 0, t1: 0, L: 0, label: 'KONIEC' });

    // Znajdujemy węzły, które nie mają wychodzących połączeń
    const nodesWithoutOutgoingLinks = new Set(nodes.map(node => node.key));
    links.forEach(link => {
        nodesWithoutOutgoingLinks.delete(link.from);
    });

    // Łączymy węzły bez wychodzących połączeń z węzłem KONIEC
    nodesWithoutOutgoingLinks.forEach(nodeKey => {
        if (nodeKey !== endNodeKey) { // Nie łączymy KONIEC z samym sobą
            links.push({
                from: nodeKey,
                to: endNodeKey,
                label: `${nodes.find(node => node.key === nodeKey)?.label}-KONIEC`, // Etykieta w formacie A-KONIEC, B-KONIEC, itd.
                duration: 0,
                color: 'black'
            });

            // Aktualizujemy t0 dla węzła KONIEC
            const nodeT0 = t0Map.get(nodeKey) || 0;
            t0Map.set(endNodeKey, Math.max(t0Map.get(endNodeKey) || 0, nodeT0));
        }
    });

    // Aktualizujemy t0 dla wszystkich węzłów
    nodes.forEach(node => {
        node.t0 = t0Map.get(node.key) || 0;
    });

    return { nodes, links };
};

export const CpmPreForm = () => {
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
    const [ganttData, setGanttData] = useState<GanttData>({ links: [] });
    const [rows, setRows] = useState<Row[]>([{ id: 1, predecessor: "", duration: 0 }]);
    const [criticalPath, setCriticalPath] = useState<string[]>([]);
    const [timeUnit, setTimeUnit] = useState<"minuty" | "godziny" | "dni">("dni");
    const navigate = useNavigate();


    useEffect(() => {
        const newGraphData = processDataForGoJS(rows);
        setGraphData(newGraphData);
    }, [rows]);

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

    const handleHome = () => {
        navigate("/");
    };

    const handlePost = () => {
        navigate("/cpmpost");
    };

    const handleFileUpload = (file: File | null) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json<{ predecessor?: string; duration?: number }>(worksheet);

            const newRows = jsonData.map((row, index) => ({
                id: index + 1,
                predecessor: row.predecessor || "",
                duration: row.duration || 0
            }));

            setRows(newRows);
        };
        reader.readAsArrayBuffer(file);
    };

    // Funkcja obsługująca zapis i rysowanie wykresu
    const handleSave = () => {
        const newGraphData = processDataForGoJS(rows);

        // Inicjalizacja t1 dla wszystkich węzłów
        newGraphData.nodes.forEach(node => {
            node.t1 = Infinity; // Ustawiamy t1 na nieskończoność, aby później znaleźć minimum
        });

        // Ustawienie t1 dla ostatniego węzła (zdarzenia końcowego)
        const lastNode = newGraphData.nodes[newGraphData.nodes.length - 1];
        lastNode.t1 = lastNode.t0; // t1 ostatniego węzła jest równe jego t0

        // Przejście przez węzły od końca i aktualizacja t1 dla poprzedników
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

        // Obliczenie L (luzy) dla każdego węzła
        newGraphData.nodes.forEach(node => {
            node.L = node.t1 - node.t0;
        });

        // Znajdź ścieżkę krytyczną
        const criticalPath: string[] = []; // Tablica na etykiety połączeń ścieżki krytycznej
        criticalPath.push("START");
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
                const toNode = newGraphData.nodes.find(node => node.key === nextLink.to);
                if (toNode) {
                    criticalPath.push(toNode.label);
                    currentNode = toNode;
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        setCriticalPath(criticalPath);
        // Resetowanie kolorów wszystkich połączeń do domyślnego (czarnego)
        newGraphData.links.forEach(link => {
            link.color = "black"; // Resetuj kolor do domyślnego
        });

        // Oznaczanie tylko połączeń na ścieżce krytycznej na czerwono
        newGraphData.links.forEach(link => {
            // Przejdź przez tablicę criticalPath i sprawdź, czy link.from i link.to są kolejnymi elementami
            for (let i = 0; i < criticalPath.length - 1; i++) {
                const fromNode = criticalPath[i]; // Aktualny węzeł
                const toNode = criticalPath[i + 1]; // Następny węzeł

                // Sprawdź, czy link.from i link.to pasują do kolejnych węzłów w criticalPath
                if (link.label===`${fromNode}-${toNode}`) {
                    link.color = "red"; // Oznacz połączenie jako część ścieżki krytycznej
                }
            }
        });

        // Dodanie automatycznych połączeń dla węzłów bez wychodzących połączeń
        newGraphData.nodes.slice(0, -1).forEach(node => { // Pomijamy ostatni węzeł
            const outgoingLinks = newGraphData.links.filter(link => link.from === node.key);

            if (outgoingLinks.length === 0) {
                // Dodaj nowe połączenie
                const newLink = {
                    from: node.key,
                    to: newGraphData.nodes[newGraphData.nodes.length - 1].key,
                    label: '',
                    duration: 0,
                    color: "gray" // Kolor dla automatycznego połączenia
                };
                newGraphData.links.push(newLink);
            }
        });

        // Przygotowanie danych dla GanttChart
        const ganttData = {
            nodes: newGraphData.nodes,
            links: newGraphData.links
        };

        setGanttData(ganttData);
        setGraphData(newGraphData);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2vw", padding: "2vw" }}>
            <div style={{ display: "flex", gap: "2vw", width: "100%" }}>
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

                        <Menu shadow="md" width={200}>
                            <Menu.Target>
                                <Button leftSection={<IconCategory2 />}>MENU</Button>
                            </Menu.Target>

                            <Menu.Dropdown>
                                <Menu.Item
                                    leftSection={<IconHome size={18} />}
                                    onClick={handleHome}
                                >
                                    Strona główna
                                </Menu.Item>
                                <Menu.Item
                                    leftSection={<IconSchema size={18} />}
                                    onClick={handlePost}
                                >
                                    CPM następnik
                                </Menu.Item>
                                <Menu.Item leftSection={<IconTruck size={18} />}>
                                    Zagadnienie pośrednika
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>

                        <Divider my="md" />

                        <FileInput
                            label="Wczytaj dane z Excela"
                            placeholder="Wybierz plik XLS/XLSX"
                            accept=".xls,.xlsx"
                            onChange={handleFileUpload}
                            leftSection={<IconUpload size={18} />}
                            mb="md"
                        />
                        <Select
                            label="Jednostka czasu"
                            value={timeUnit}
                            onChange={(value) => setTimeUnit(value as "minuty" | "godziny" | "dni")}
                            data={[
                                {value: "minuty", label: "Minuty"},
                                {value: "godziny", label: "Godziny"},
                                {value: "dni", label: "Dni"},
                            ]}
                            mb="md"
                        />

                        <Divider my="md" />

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
                                    <td>{alphabet[index]}</td>
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
                                        <Button color="red" onClick={() => removeRow(row.id)}
                                                disabled={rows.length === 1}>
                                            <IconTrash size={18}/>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>

                        <Divider my="md" />

                        <Flex
                            mih={50}
                            gap="md"
                            justify="center"
                            align="center"
                            direction="row"
                            wrap="wrap"
                        >
                            <Button onClick={addRow} leftSection={<IconPlus size={18}/>} mt="md">
                                Dodaj wiersz
                            </Button>
                            <Button onClick={handleSave} leftSection={<IconDeviceFloppy size={18}/>} mt="md">
                                Zapisz i rysuj wykres
                            </Button>
                        </Flex>

                        <Divider my="md" />

                        {criticalPath.length > 0 && (
                            <Card shadow="sm" mt="md" p="sm" style={{backgroundColor: "#e9f5ff"}}>
                                <Text fw={500} size="lg" color="blue">
                                    Ścieżka krytyczna: {criticalPath.join(" → ")}
                                </Text>
                            </Card>
                        )}
                    </Container>
                    <div style={{
                        marginTop: "20px",
                        textAlign: "center",
                        border: "1px dashed #ccc",
                        borderRadius: "8px",
                        padding: "10px",
                        backgroundColor: "#fff"
                    }}>
                        <img
                            src="/legenda.png"
                            alt="Legenda wykresu"
                            style={{
                                maxWidth: "100%",
                                height: "auto",
                                borderRadius: "4px",
                                marginBottom: "10px"
                            }}
                        />
                        <div style={{
                            padding: "8px",
                            fontSize: "14px",
                            lineHeight: "1.5",
                            color: "#333",
                            textAlign: "left"
                        }}>
                            <p><strong>j</strong> - Czynność</p>
                            <p><strong>t0</strong> - najwcześniejszy możliwy moment zaistnienia zdarzenia </p>
                            <p><strong>t1</strong> - najpóźniejszy możliwy moment zaistnienia zdarzenia</p>
                            <p><strong>L</strong> - zapas (luz) czasu</p>
                        </div>
                    </div>
                </Card>

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
                    <GraphComponentPre data={graphData}/>
                </Card>
            </div>

            <Card
                shadow="md"
                style={{
                    width: "100%",
                    height: "50vh",
                    padding: "20px",
                    borderRadius: "12px",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                    marginTop: "2vw",
                }}
            >
                <GanttChart ganttData={ganttData} timeUnit={timeUnit}/>
            </Card>
        </div>
    );
};