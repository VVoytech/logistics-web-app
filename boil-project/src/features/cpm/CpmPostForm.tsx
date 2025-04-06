import {
    Button,
    Container,
    Table,
    TextInput,
    NumberInput,
    Card, Text, Select, Flex, FileInput,
    Menu, Divider
} from "@mantine/core";
import {useEffect, useState} from "react";
import {
    IconCategory2,
    IconDeviceFloppy,
    IconHome,
    IconPlus,
    IconSchema,
    IconTrash,
    IconTruck,
    IconUpload
} from "@tabler/icons-react";
import GraphComponent from "./GraphComponent";
import GanttChart from "./GanntChart.tsx";
import * as XLSX from 'xlsx';
import {useNavigate} from "react-router-dom";

// Definicja typu dla danych wierszy
interface Row {
    id: number;
    predecessor: string;
    duration: number;
    errors?: {
        predecessor?: string;
        duration?: string;
    };
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""); // Lista czynności

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

// Funkcja walidująca pojedynczy wiersz
const validateRow = (row: Row): Row => {
    const errors: { predecessor?: string; duration?: string } = {};

    if (row.duration <= 0) {
        errors.duration = "Czas trwania musi być większy od 0";
    }

    if (row.predecessor.trim() === "") {
        errors.predecessor = "Podaj następstwo zdarzeń w formacie 'X-Y'";
    } else {
        const parts = row.predecessor.split('-');
        if (parts.length !== 2) {
            errors.predecessor = "Nieprawidłowy format. Wprowadź w formacie 'X-Y'";
        } else {
            const [from, to] = parts;
            if (isNaN(Number(from)) || isNaN(Number(to))) {
                errors.predecessor = "Oba elementy muszą być liczbami";
            } else if (Number(from) >= Number(to)) {
                errors.predecessor = "Pierwsza liczba musi być mniejsza od drugiej";
            }
        }
    }

    return { ...row, errors: Object.keys(errors).length > 0 ? errors : undefined };
};

// Funkcja walidująca wszystkie wiersze
const validateAllRows = (rows: Row[]): Row[] => {
    return rows.map((row) => validateRow(row));
};

export const CpmPostForm = () => {
    const [graphData, setGraphData] = useState<{
        nodes: { key: number; t0: number; t1: number; L: number }[];
        links: { from: number; to: number; label: string; duration: number,color:string }[];
    }>({ nodes: [], links: [] });
    const [ganttData, setGanttData] = useState<{
        nodes: { key: number; t0: number; t1: number; L: number }[];
        links: { from: number; to: number; label: string; duration: number,color:string }[];
    }>({ nodes: [], links: [] });
    const [rows, setRows] = useState<Row[]>([{ id: 1, predecessor: "", duration: 0 }]);
    const [criticalPath, setCriticalPath] = useState<string[]>([]);
    const [timeUnit, setTimeUnit] = useState<"minuty" | "godziny" | "dni">("dni");
    const navigate = useNavigate();

    useEffect(() => {
        const newGraphData = processDataForGoJS(rows);
        setGraphData(newGraphData);
    },[rows]);

    // Funkcja dodająca nowy wiersz
    const addRow = () => {
        const newRows = [...rows, { id: rows.length + 1, predecessor: "", duration: 0 }];
        setRows(newRows);
    };

    // Funkcja usuwająca wiersz
    const removeRow = (id: number) => {
        const newRows = rows.filter((row) => row.id !== id);
        setRows(newRows);
    };

    // Funkcja aktualizująca wartość pola w wierszu
    const updateRow = (id: number, field: keyof Row, value: string | number | null) => {
        const newRows = rows.map((row) =>
            row.id === id ? { ...row, [field]: value ?? 0 } : row
        );
        setRows(validateAllRows(newRows));
    };

    const handleHome = () => {
        navigate("/");
    };

    const handlePre = () => {
        navigate("/cpmpre");
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

            setRows(validateAllRows(newRows));
        };
        reader.readAsArrayBuffer(file);
    };

    const handleSave = () => {
        const validatedRows = validateAllRows(rows);

        const hasErrors = validatedRows.some(row => row.errors);

        if (hasErrors) {
            setRows(validatedRows);
            alert("Popraw błędy w formularzu przed zapisem");
            return;
        }

        const newGraphData = processDataForGoJS(validatedRows);

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

            // Dodatkowo, przejdź przez wszystkie węzły wychodzące z currentNode
            const outgoingLinks = newGraphData.links.filter(link => link.from === currentNode.key);

            outgoingLinks.forEach(link => {
                const toNode = newGraphData.nodes.find(node => node.key === link.to);

                if (toNode) {
                    // Oblicz t1 dla currentNode jako t1 węzła wychodzącego minus duration
                    const t1Candidate = toNode.t1 - link.duration;

                    // Jeśli obliczona wartość jest mniejsza niż aktualne t1 currentNode, zaktualizuj t1
                    if (t1Candidate < currentNode.t1) {
                        currentNode.t1 = t1Candidate;
                    }
                }
            });
        }

        // Ustawienie t1 na t0, jeśli t1 nie zostało zaktualizowane
        newGraphData.nodes.forEach(node => {
            if (node.t1 === Infinity) {
                node.t1 = node.t0; // Jeśli t1 nie zostało zaktualizowane, ustaw je na t0
            }
        });

        // Obliczenie L (luzy) dla każdego węzła
        newGraphData.nodes.forEach(node => {
            node.L = node.t1 - node.t0;
        });

        // Znajdź ścieżkę krytyczną
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

        setCriticalPath(criticalPath);

        newGraphData.links.forEach(link => {
            for(let i=0;i<criticalPath.length;i++) {
                if(link.label===criticalPath[i]){
                    link.color="red";
                }
            }
        });

        newGraphData.nodes.slice(0, -1).forEach(node => {
            const outgoingLinks = newGraphData.links.filter(link => link.from === node.key);

            if (outgoingLinks.length === 0) {
                // Dodaj nowe połączenie
                const newLink = {
                    from: node.key,
                    to: node.key+1,
                    label: "p",
                    duration: 0,
                    color: "gray"
                };
                newGraphData.links.push(newLink);
            }
        });
        setGanttData(newGraphData);
        setGraphData(newGraphData);
    };

    return (
        <div style={{display: "flex", flexDirection: "column", gap: "2vw", padding: "2vw"}}>
            <div style={{display: "flex", gap: "2vw", width: "100%"}}>
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
                                    onClick={handlePre}
                                >
                                    CPM poprzednik
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

                        {rows.some(row => row.errors) && (
                            <Card shadow="sm" mb="md" p="sm" style={{backgroundColor: "#fff4f4"}}>
                                <Text fw={500} size="lg" styles={{
                                    root: {
                                        color: "var(--mantine-color-red-6)"
                                    }
                                }}
                                >
                                    Formularz zawiera błędy. Popraw je przed zapisem.
                                </Text>
                                <ul>
                                    {rows.map((row, index) => (
                                        row.errors && (
                                            <li key={row.id}>
                                                <Text span fw={500}>{alphabet[index]}: </Text>
                                                {row.errors.predecessor && <Text span>{row.errors.predecessor}</Text>}
                                                {row.errors.duration && <Text span>{row.errors.duration}</Text>}
                                            </li>
                                        )
                                    ))}
                                </ul>
                            </Card>
                        )}

                        <Table striped highlightOnHover>
                            <thead>
                            <tr>
                                <th>Czynności</th>
                                <th>Następstwo zdarzeń</th>
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
                                            placeholder="Następstwo (np. 1-2)"
                                            error={row.errors?.predecessor}
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
                                            error={row.errors?.duration}
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
                            <Button
                                onClick={handleSave}
                                leftSection={<IconDeviceFloppy size={18}/>}
                                mt="md"
                                disabled={rows.some(row => row.errors)}
                                color={rows.some(row => row.errors) ? "gray" : "blue"}
                            >
                                Zapisz i rysuj wykres
                            </Button>
                        </Flex>

                        <Divider my="md" />

                        {criticalPath.length > 0 && (
                            <Card shadow="sm" mt="md" p="sm" style={{backgroundColor: "#e9f5ff"}}>
                                <Text fw={500} size="lg" styles={{
                                    root: {
                                        color: "var(--mantine-color-blue-6)"
                                    }
                                }}>
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
                            <p><strong>j</strong> - Nr. zdarzenia</p>
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
                    <GraphComponent data={graphData}/>
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